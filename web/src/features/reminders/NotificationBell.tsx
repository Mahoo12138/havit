import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconBell } from '@tabler/icons-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Spinner } from '../../components/ui/spinner';
import { remindersApi } from '../../api/client';
import { ReminderRow } from './reminderUi';
import * as s from './reminderUi.css';

const PREVIEW_LIMIT = 6;

/**
 * Header bell with a due-reminder count badge and a popover listing pending
 * reminders with inline mark-done / dismiss actions.
 */
export function NotificationBell({ iconClassName }: { iconClassName?: string }) {
  const { t } = useTranslation();
  const reminders = useQuery({
    queryKey: ['reminders', 'due'],
    queryFn: () => remindersApi.list({ dueOnly: true }),
    staleTime: 30_000,
  });

  const due = reminders.data?.reminders ?? [];
  const count = due.length;

  return (
    <Popover>
      <PopoverTrigger className={iconClassName} aria-label={t('common.notifications')}>
        <span className={s.bellWrap}>
          <IconBell size={18} />
          {count > 0 && <span className={s.bellDot}>{count > 99 ? '99+' : count}</span>}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8}>
        <div className={s.panel}>
          <div className={s.panelHead}>
            <span className={s.panelTitle}>{t('reminders.bellTitle')}</span>
            <Link to="/reminders">{t('reminders.viewAll')}</Link>
          </div>
          <div className={s.panelBody}>
            {reminders.isPending ? (
              <Spinner />
            ) : count === 0 ? (
              <div className={s.empty}>{t('dashboard.noReminders')}</div>
            ) : (
              due.slice(0, PREVIEW_LIMIT).map((r) => <ReminderRow key={r.id} reminder={r} />)
            )}
          </div>
          {count > PREVIEW_LIMIT && (
            <Link to="/reminders" className={s.empty}>
              {t('reminders.moreCount', { count: count - PREVIEW_LIMIT })}
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
