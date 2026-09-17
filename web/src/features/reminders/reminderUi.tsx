import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconBellRinging, IconCheck, IconX } from '@tabler/icons-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { remindersApi, type Reminder } from '../../api/client';
import { formatDateTime } from '../essentials/shared';
import * as s from './reminderUi.css';

type TFn = ReturnType<typeof useTranslation>['t'];

// The backend builds warranty reminder types from the configured lead times
// (`warranty_<N>d`, see item.go replaceWarrantyReminders), and the shipped
// defaults are 30/7. Anything else used to fall through to the raw key, so the
// patterns below resolve the family instead of the two literal variants.
const WARRANTY_DAYS = /^warranty_(\d+)d$/;
const LOAN_DUE_DAYS = /^loan_due_(\d+)d$/;

/**
 * Resolves a reminder type to its localized label, falling back to a generic
 * label rather than leaking the raw type key when the type is unknown.
 */
export function reminderLabel(t: TFn, type: string) {
  const warranty = WARRANTY_DAYS.exec(type);
  if (warranty) {
    return t('reminder.warrantyDays', { count: Number(warranty[1]) });
  }

  const loanDue = LOAN_DUE_DAYS.exec(type);
  if (loanDue) {
    return t('reminder.loanDueDays', { count: Number(loanDue[1]) });
  }

  return t(`reminder.${type}`, { defaultValue: t('reminder.default') });
}

export function reminderStatus(r: Reminder): 'dismissed' | 'sent' | 'pending' {
  if (r.is_dismissed) return 'dismissed';
  return r.sent_at ? 'sent' : 'pending';
}

export function useReminderActions() {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reminders'] });
  };

  const markSent = useMutation({
    mutationFn: (id: string) => remindersApi.markSent(id),
    onSuccess: () => {
      invalidate();
      toast.show(t('reminders.markedDone'));
    },
    onError: (err) => toast.show(t('reminders.actionFailed', { error: errorText(err) })),
  });

  const dismiss = useMutation({
    mutationFn: (id: string) => remindersApi.dismiss(id),
    onSuccess: () => {
      invalidate();
      toast.show(t('reminders.dismissed'));
    },
    onError: (err) => toast.show(t('reminders.actionFailed', { error: errorText(err) })),
  });

  return { markSent, dismiss };
}

/**
 * A single reminder row with item name, trigger time, status badge and
 * mark-done / dismiss actions. Pending reminders get both actions; processed
 * ones are rendered read-only and dimmed.
 *
 * `compact` tightens the row for the header popover, where space is at a
 * premium; the page and dashboard lists keep the roomier default.
 */
export function ReminderRow({
  reminder,
  showItem = true,
  compact = false,
}: {
  reminder: Reminder;
  showItem?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { markSent, dismiss } = useReminderActions();
  const status = reminderStatus(reminder);
  const pending = status === 'pending';
  const itemName = reminder.item_name ?? reminder.item_id;

  return (
    <div
      className={[s.row, compact ? s.rowCompact : undefined, pending ? undefined : s.done]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={s.rowIcon} aria-hidden="true">
        <IconBellRinging size={15} />
      </span>
      <div className={s.rowMain}>
        <span className={s.rowTitle}>{reminderLabel(t, reminder.type)}</span>
        <span className={s.rowMeta}>
          {showItem ? `${itemName} · ` : ''}
          {formatDateTime(reminder.trigger_at)}
        </span>
      </div>
      {pending ? (
        <div className={s.rowActions}>
          <Button
            variant="quiet"
            size="icon-xs"
            aria-label={t('reminders.markDone')}
            title={t('reminders.markDone')}
            disabled={markSent.isPending || dismiss.isPending}
            onClick={() => markSent.mutate(reminder.id)}
          >
            <IconCheck size={14} />
          </Button>
          <Button
            variant="quiet"
            size="icon-xs"
            aria-label={t('reminders.dismissAction')}
            title={t('reminders.dismissAction')}
            disabled={markSent.isPending || dismiss.isPending}
            onClick={() => dismiss.mutate(reminder.id)}
          >
            <IconX size={14} />
          </Button>
        </div>
      ) : (
        <Badge variant={status === 'dismissed' ? 'outline' : 'secondary'}>
          {t(`reminders.status.${status}`)}
        </Badge>
      )}
    </div>
  );
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
