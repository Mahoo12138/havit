import { createFileRoute } from '@tanstack/react-router';
import { Badge, Card, Stack, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, KeyValueGrid, MetricStrip } from '../features/m2/components';
import { lifecycleRecords } from '../features/m2/mockData';

export const Route = createFileRoute('/lifecycle')({
  component: LifecyclePage,
});

function LifecyclePage() {
  return (
    <Stack>
      <FeatureHeader
        title="资产退场"
        description="售出、赠出、报废、丢失和被盗都进入归档台账，主搜索默认隐藏。"
        meta="item graveyard"
      />

      <MetricStrip
        metrics={[
          { label: '归档资产', value: lifecycleRecords.length },
          {
            label: '异常退场',
            value: lifecycleRecords.filter((record) =>
              ['damaged', 'lost', 'stolen'].includes(record.status),
            ).length,
          },
          {
            label: '回收金额',
            value: `${lifecycleRecords.reduce((total, record) => total + (record.amount ?? 0), 0)} CNY`,
          },
        ]}
      />

      <DataCard title="物品墓地">
        <div className={uiStyles.cardGrid}>
          {lifecycleRecords.map((record) => (
            <Card className="surface-card" key={record.id}>
              <KeyValueGrid
                rows={[
                  { label: '物品', value: record.itemName },
                  { label: '状态', value: <Badge>{record.status}</Badge> },
                  { label: '日期', value: record.date },
                  {
                    label: '金额',
                    value:
                      record.amount != null
                        ? `${record.amount} ${record.currency ?? ''}`
                        : '无',
                  },
                  { label: '备注', value: record.note },
                ]}
              />
            </Card>
          ))}
        </div>
      </DataCard>
    </Stack>
  );
}
