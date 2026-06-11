import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconHome } from '@tabler/icons-react';
import { Badge, Button, Spinner, Stack, StackTight, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { itemsApi, itemsExtendedApi } from '../api/client';

export const Route = createFileRoute('/edc')({
  component: EDCPage,
});

function EDCPage() {
  const { t } = useTranslation();
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
        title={t('edc.title')}
        description={t('edc.description')}
        meta="baseline + state"
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <MetricStrip
            metrics={[
              { label: t('edc.edcItems'), value: items.length },
              { label: t('edc.currentlyWithYou'), value: awayItems.length },
              { label: t('edc.canReturn'), value: items.filter((i) => i.location_id !== i.home_base_location_id).length },
            ]}
          />

          <DataCard title={t('edc.checklist')}>
            <div className={uiStyles.tableWrap}>
              <table className={uiStyles.table}>
                <thead>
                  <tr>
                    <th className={uiStyles.th}>{t('edc.item')}</th>
                    <th className={uiStyles.th}>{t('edc.homeBase')}</th>
                    <th className={uiStyles.th}>{t('edc.currentStatus')}</th>
                    <th className={uiStyles.th}>{t('edc.action')}</th>
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
                            {t('edc.returnHome')}
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
