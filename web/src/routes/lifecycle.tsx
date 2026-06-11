import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Card, Spinner, Stack, StatusBadge, Tabs, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { itemsExtendedApi } from '../api/client';

export const Route = createFileRoute('/lifecycle')({
  component: LifecyclePage,
});

function LifecyclePage() {
  const [tab, setTab] = useState<'graveyard' | 'loss'>('graveyard');

  const { data: graveyardData, isLoading: graveyardLoading } = useQuery({
    queryKey: ['items', 'graveyard'],
    queryFn: () => itemsExtendedApi.graveyard(),
    enabled: tab === 'graveyard',
  });

  const { data: lossData, isLoading: lossLoading } = useQuery({
    queryKey: ['items', 'loss-records'],
    queryFn: () => itemsExtendedApi.lossRecords(),
    enabled: tab === 'loss',
  });

  const graveyardItems = graveyardData?.items ?? [];
  const lossRecords = lossData?.loss_records ?? [];
  const isLoading = tab === 'graveyard' ? graveyardLoading : lossLoading;

  return (
    <Stack>
      <FeatureHeader
        title="资产退场"
        description="售出、赠出、报废、丢失和被盗都进入归档台账，主搜索默认隐藏。"
        meta="item graveyard"
      />

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as 'graveyard' | 'loss')}
        tabs={[
          { key: 'graveyard', label: '物品墓地' },
          { key: 'loss', label: '损耗记录' },
        ]}
      />

      {isLoading ? (
        <Spinner />
      ) : tab === 'graveyard' ? (
        <>
          <MetricStrip
            metrics={[
              { label: '归档资产', value: graveyardItems.length },
              {
                label: '异常退场',
                value: graveyardItems.filter((i) =>
                  ['lost', 'stolen', 'damaged'].includes(i.status),
                ).length,
              },
            ]}
          />
          <DataCard title="物品墓地">
            <div className={uiStyles.cardGrid}>
              {graveyardItems.map((item) => (
                <Card className="surface-card" key={item.id}>
                  <Stack>
                    <h3 className={uiStyles.heading}>{item.name}</h3>
                    <StatusBadge status={item.status} />
                  </Stack>
                </Card>
              ))}
            </div>
          </DataCard>
        </>
      ) : (
        <>
          <MetricStrip
            metrics={[
              { label: '损耗记录', value: lossRecords.length },
            ]}
          />
          <DataCard title="损耗记录">
            <div className={uiStyles.cardGrid}>
              {lossRecords.map((record) => (
                <Card className="surface-card" key={record.item_id}>
                  <Stack>
                    <h3 className={uiStyles.heading}>{record.name}</h3>
                    <StatusBadge status={record.status} />
                    {record.exit_notes && (
                      <span className={uiStyles.muted}>{record.exit_notes}</span>
                    )}
                  </Stack>
                </Card>
              ))}
            </div>
          </DataCard>
        </>
      )}
    </Stack>
  );
}
