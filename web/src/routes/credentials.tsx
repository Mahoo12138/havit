import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Card, Spinner, Stack, Tabs, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { itemsExtendedApi, itemsApi, virtualAssetsApi, type VirtualCredential } from '../api/client';

export const Route = createFileRoute('/credentials')({
  component: CredentialsPage,
});

function CredentialsPage() {
  const [tab, setTab] = useState<'warranty' | 'credentials'>('warranty');

  const { data: warrantyData, isLoading: warrantyLoading } = useQuery({
    queryKey: ['items', 'warranty'],
    queryFn: () => itemsExtendedApi.warranty(),
    enabled: tab === 'warranty',
  });

  const { data: credData, isLoading: credLoading } = useQuery({
    queryKey: ['items', 'credentials'],
    queryFn: async () => {
      const items = await itemsApi.list({ type: 'virtual' });
      const allCreds: Array<{ itemName: string; credential: VirtualCredential }> = [];
      for (const item of items.items) {
        const res = await virtualAssetsApi.listCredentials(item.id);
        for (const c of res.credentials) {
          allCreds.push({ itemName: item.name, credential: c });
        }
      }
      return allCreds;
    },
    enabled: tab === 'credentials',
  });

  const warrantyItems = warrantyData?.items ?? [];
  const credentials = credData ?? [];
  const isLoading = tab === 'warranty' ? warrantyLoading : credLoading;

  return (
    <Stack>
      <FeatureHeader
        title="凭证与保修"
        description="发票、订单截图、平台凭证和保修信息挂在资产记录下。"
        meta="warranty"
      />

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as 'warranty' | 'credentials')}
        tabs={[
          { key: 'warranty', label: '保修状态' },
          { key: 'credentials', label: '虚拟凭证' },
        ]}
      />

      {isLoading ? (
        <Spinner />
      ) : tab === 'warranty' ? (
        <>
          <MetricStrip
            metrics={[
              { label: '保修中', value: warrantyItems.length },
              {
                label: '即将到期',
                value: warrantyItems.filter((i) => {
                  if (!i.warranty_expires_at) return false;
                  const daysLeft = (i.warranty_expires_at * 1000 - Date.now()) / (1000 * 60 * 60 * 24);
                  return daysLeft <= 30 && daysLeft > 0;
                }).length,
              },
            ]}
          />
          <DataCard title="保修状态聚合">
            <div className={uiStyles.cardGrid}>
              {warrantyItems.map((item) => (
                <Card className="surface-card" key={item.id}>
                  <Stack>
                    <h3 className={uiStyles.heading}>{item.name}</h3>
                    <span className={uiStyles.muted}>
                      到期：{item.warranty_expires_at ? new Date(item.warranty_expires_at * 1000).toLocaleDateString() : '—'}
                    </span>
                    {item.warranty_contact && (
                      <span className={uiStyles.muted}>联系方式：{item.warranty_contact}</span>
                    )}
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
              { label: '凭证记录', value: credentials.length },
              {
                label: '有 License Key',
                value: credentials.filter((c) => c.credential.license_key).length,
              },
            ]}
          />
          <DataCard title="虚拟凭证">
            <div className={uiStyles.cardGrid}>
              {credentials.map((c, idx) => (
                <Card className="surface-card" key={idx}>
                  <Stack>
                    <h3 className={uiStyles.heading}>{c.itemName}</h3>
                    <span className={uiStyles.muted}>平台：{c.credential.platform}</span>
                    {c.credential.account && (
                      <span className={uiStyles.muted}>账号：{c.credential.account}</span>
                    )}
                    {c.credential.order_id && (
                      <span className={uiStyles.muted}>订单：{c.credential.order_id}</span>
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
