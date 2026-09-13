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

export function reminderLabel(t: TFn, type: string) {
  return t(`reminder.${type}`, type);
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
 */
export function ReminderRow({
  reminder,
  showItem = true,
}: {
  reminder: Reminder;
  showItem?: boolean;
}) {
  const { t } = useTranslation();
  const { markSent, dismiss } = useReminderActions();
  const status = reminderStatus(reminder);
  const pending = status === 'pending';
  const itemName = reminder.item_name ?? reminder.item_id;

  return (
    <div className={[s.row, pending ? undefined : s.done].filter(Boolean).join(' ')}>
      <IconBellRinging size={15} />
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
            aria-label={t('reminders.markDone')}
            title={t('reminders.markDone')}
            disabled={markSent.isPending || dismiss.isPending}
            onClick={() => markSent.mutate(reminder.id)}
          >
            <IconCheck size={15} />
          </Button>
          <Button
            variant="quiet"
            aria-label={t('reminders.dismissAction')}
            title={t('reminders.dismissAction')}
            disabled={markSent.isPending || dismiss.isPending}
            onClick={() => dismiss.mutate(reminder.id)}
          >
            <IconX size={15} />
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
