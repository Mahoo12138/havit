import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { IconHome } from '@tabler/icons-react';
import { Badge, Button, Spinner, Stack, StackTight, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { itemsApi, itemsExtendedApi } from '../api/client';

export const Route = createFileRoute('/edc')({
  component: EDCPage,
});

function EDCPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'edc'],
    queryFn: () => itemsApi.list({ type: 'edc' }),
  });

  const returnHomeMutation = useMutation({
    mutationFn: (id: string) => itemsExtendedApi.returnHome(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items', 'edc'] }),
  });

  const items = data?.items ?? [];
  const awayItems = items.filter((i) => i.location_id !== i.home_base_location_id);

  return (
    <Stack>
      <FeatureHeader
        title="EDC 双轨模型"
        description="保留基准位置，同时用动态状态表达随身、出差包和未知状态。"
        meta="baseline + state"
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <MetricStrip
            metrics={[
              { label: 'EDC 物品', value: items.length },
              { label: '当前随身', value: awayItems.length },
              { label: '可归位', value: items.filter((i) => i.location_id !== i.home_base_location_id).length },
            ]}
          />

          <DataCard title="出门检查清单">
            <div className={uiStyles.tableWrap}>
              <table className={uiStyles.table}>
                <thead>
                  <tr>
                    <th className={uiStyles.th}>物品</th>
                    <th className={uiStyles.th}>基准位置</th>
                    <th className={uiStyles.th}>当前状态</th>
                    <th className={uiStyles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className={uiStyles.tableRow} key={item.id}>
                      <td className={uiStyles.td}>
                        <StackTight>
                          <strong>{item.name}</strong>
                          <span className={uiStyles.muted}>{item.category}</span>
                        </StackTight>
                      </td>
                      <td className={uiStyles.td}>{item.home_base_location_id ?? '—'}</td>
                      <td className={uiStyles.td}>
                        <Badge>{item.status}</Badge>
                      </td>
                      <td className={uiStyles.td}>
                        {item.location_id !== item.home_base_location_id && (
                          <Button
                            variant="quiet"
                            leftSection={<IconHome size={14} />}
                            disabled={returnHomeMutation.isPending}
                            onClick={() => returnHomeMutation.mutate(item.id)}
                          >
                            归位
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataCard>
        </>
      )}
    </Stack>
  );
}
