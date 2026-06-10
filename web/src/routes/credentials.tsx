import { createFileRoute } from '@tanstack/react-router';
import { Badge, Card, Stack, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, KeyValueGrid, MetricStrip } from '../features/m2/components';
import { credentials } from '../features/m2/mockData';

export const Route = createFileRoute('/credentials')({
  component: CredentialsPage,
});

function CredentialsPage() {
  return (
    <Stack>
      <FeatureHeader
        title="凭证与保修"
        description="发票、订单截图、平台凭证和保修信息挂在资产记录下。"
        meta="warranty"
      />

      <MetricStrip
        metrics={[
          { label: '凭证记录', value: credentials.length },
          {
            label: '即将到期',
            value: credentials.filter((item) => item.warrantyState === 'expiring').length,
          },
          {
            label: '附件数',
            value: credentials.reduce((total, item) => total + item.attachments, 0),
          },
        ]}
      />

      <DataCard title="保修状态聚合">
        <div className={uiStyles.cardGrid}>
          {credentials.map((record) => (
            <Card className="surface-card" key={record.id}>
              <KeyValueGrid
                rows={[
                  { label: '物品', value: record.itemName },
                  { label: '平台', value: record.platform ?? '未填写' },
                  { label: '凭证类型', value: record.credentialType },
                  {
                    label: '保修状态',
                    value: <Badge>{record.warrantyState}</Badge>,
                  },
                  { label: '到期', value: record.expiresAt ?? '无到期日' },
                  { label: '附件', value: `${record.attachments} 个` },
                ]}
              />
            </Card>
          ))}
        </div>
      </DataCard>
    </Stack>
  );
}
