import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { FeatureHeader } from '../m2/components';
import { remindersApi } from '../../api/client';
import { ReminderRow } from './reminderUi';
import * as s from './reminderUi.css';

type Filter = 'pending' | 'all';

export function RemindersDesktop() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');
  const reminders = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersApi.list(),
  });

  const all = reminders.data?.reminders ?? [];
  const visible = filter === 'pending' ? all.filter((r) => reminderRowPending(r)) : all;
  const pendingCount = all.filter(reminderRowPending).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FeatureHeader
        title={t('reminders.title')}
        description={t('reminders.description')}
        meta={t('operations.reminderCount', { count: pendingCount })}
      />

      <Tabs
        value={filter}
        onValueChange={(nextValue) => {
          if (typeof nextValue === 'string') setFilter(nextValue as Filter);
        }}
      >
        <TabsList>
          {(['all', 'pending'] as Filter[]).map((f) => (
            <TabsTrigger key={f} value={f}>
              {t(`reminders.filter.${f}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className={s.pageCard} padded={false}>
        {reminders.isPending ? (
          <Spinner />
        ) : visible.length === 0 ? (
          <div className={s.empty}>{t(filter === 'pending' ? 'dashboard.noReminders' : 'operations.noReminders')}</div>
        ) : (
          visible.map((r) => <ReminderRow key={r.id} reminder={r} />)
        )}
      </Card>
    </div>
  );
}

function reminderRowPending(r: { is_dismissed: boolean; sent_at?: number }) {
  return !r.is_dismissed && !r.sent_at;
}
