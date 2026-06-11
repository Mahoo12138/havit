import { useQuery, useMutation } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { Badge, Button, Card, Spinner, Stack, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { backupApi, exportApi, remindersApi, locationsApi } from '../api/client';

export const Route = createFileRoute('/operations')({
  component: OperationsPage,
});

function OperationsPage() {
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const { data: remindersData } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersApi.list(),
  });

  const backupMutation = useMutation({
    mutationFn: () => backupApi.run(),
  });

  const exportJsonMutation = useMutation({
    mutationFn: () => exportApi.items('json'),
    onSuccess: (blob) => downloadBlob(blob, 'havit-items.json'),
  });

  const exportCsvMutation = useMutation({
    mutationFn: () => exportApi.items('csv'),
    onSuccess: (blob) => downloadBlob(blob, 'havit-items.csv'),
  });

  const locations = flattenTree(locationsData?.tree ?? []);
  const reminders = remindersData?.reminders ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FeatureHeader
        title="运维与导出"
        description="位置二维码、提醒网关、备份任务和手动导出集中在这里。"
        meta="ops"
      />

      <MetricStrip
        metrics={[
          { label: '位置标签', value: locations.length },
          { label: '提醒任务', value: reminders.length },
          { label: '最近备份', value: backupMutation.data?.path ? '已完成' : '未执行' },
        ]}
      />

      {locationsLoading ? (
        <Spinner />
      ) : (
        <DataCard title="位置二维码">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {locations.filter((l) => l.qr_code).map((loc) => (
              <Card className="surface-card" key={loc.id}>
                <Stack>
                  <div className={uiStyles.qrMock}>{loc.qr_code}</div>
                  <h3 className={uiStyles.heading}>{loc.name}</h3>
                  <span className={uiStyles.muted}>QR: {loc.qr_code}</span>
                </Stack>
              </Card>
            ))}
            <Link to="/qr-print" className={uiStyles.sectionLink}>
              打印标签
            </Link>
          </div>
        </DataCard>
      )}

      <div className={uiStyles.twoColumn}>
        <DataCard title="提醒调度器">
          <Stack>
            {reminders.length === 0 ? (
              <span className={uiStyles.muted}>暂无提醒</span>
            ) : (
              reminders.slice(0, 10).map((r) => (
                <Card className="surface-card" key={r.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{r.type} — {r.item_id}</span>
                    <Badge>{r.is_dismissed ? '已忽略' : r.sent_at ? '已发送' : '待处理'}</Badge>
                  </div>
                </Card>
              ))
            )}
          </Stack>
        </DataCard>

        <DataCard title="备份与导出">
          <Stack>
            <Button
              leftSection={<IconRefresh size={15} />}
              onClick={() => backupMutation.mutate()}
              disabled={backupMutation.isPending}
            >
              {backupMutation.isPending ? '备份中…' : '手动备份'}
            </Button>
            {backupMutation.data && (
              <span className={uiStyles.muted}>备份完成：{backupMutation.data.path}</span>
            )}

            <div style={{ height: '1px', background: 'var(--line, #e2e0d8)', margin: '0.5rem 0' }} />

            <Button
              variant="quiet"
              leftSection={<IconDownload size={15} />}
              onClick={() => exportJsonMutation.mutate()}
              disabled={exportJsonMutation.isPending}
            >
              导出 JSON
            </Button>
            <Button
              variant="quiet"
              leftSection={<IconDownload size={15} />}
              onClick={() => exportCsvMutation.mutate()}
              disabled={exportCsvMutation.isPending}
            >
              导出 CSV
            </Button>
          </Stack>
        </DataCard>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function flattenTree(tree: any[]): Array<{ id: string; name: string; qr_code?: string }> {
  const result: Array<{ id: string; name: string; qr_code?: string }> = [];
  for (const node of tree) {
    result.push({ id: node.id, name: node.name, qr_code: node.qr_code });
    if (node.children) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}
