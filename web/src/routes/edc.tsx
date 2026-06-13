import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconHome, IconPackage, IconPackageExport } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Dialog,
  RowBetween,
  SelectField,
  ScrollArea,
  Spinner,
  Stack,
  StackTight,
  uiStyles,
  useToast,
} from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { edcBulkApi, itemsApi, itemsExtendedApi, locationsApi } from '../api/client';

export const Route = createFileRoute('/edc')({
  component: EDCPage,
});

function EDCPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'edc'],
    queryFn: () => itemsApi.list({ type: 'edc' }),
  });

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const returnHomeMutation = useMutation({
    mutationFn: (id: string) => itemsExtendedApi.returnHome(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items', 'edc'] }),
  });

  const returnAllMutation = useMutation({
    mutationFn: () => edcBulkApi.returnAll(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['items', 'edc'] });
      toast.show(t('edc.returnedAll', { count: res.moved }));
    },
  });

  const packAllMutation = useMutation({
    mutationFn: (locationId: string) => edcBulkApi.packAll(locationId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['items', 'edc'] });
      setPackDialogOpen(false);
      toast.show(t('edc.packedAll', { count: res.moved }));
    },
  });

  const items = data?.items ?? [];
  const awayItems = items.filter((i) => i.location_id !== i.home_base_location_id);
  const atHomeItems = items.filter(
    (i) => i.home_base_location_id && i.location_id === i.home_base_location_id,
  );

  // Flatten location tree for pack destination picker
  const locationOptions: Array<{ value: string; label: string }> = [];
  if (locData?.tree) {
    const walk = (nodes: typeof locData.tree, depth = 0) => {
      for (const node of nodes) {
        locationOptions.push({ value: node.id, label: '  '.repeat(depth) + node.name });
        if (node.children) walk(node.children, depth + 1);
      }
    };
    walk(locData.tree);
  }

  return (
    <Stack>
      <FeatureHeader
        title={t('edc.title')}
        description={t('edc.description')}
        meta={t('edc.meta')}
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <RowBetween>
            <MetricStrip
              metrics={[
                { label: t('edc.edcItems'), value: items.length },
                { label: t('edc.currentlyWithYou'), value: awayItems.length },
                { label: t('edc.canReturn'), value: awayItems.length },
              ]}
            />
            <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
              {awayItems.length > 0 && (
                <Button
                  variant="subtle"
                  leftSection={<IconHome size={14} />}
                  disabled={returnAllMutation.isPending}
                  onClick={() => returnAllMutation.mutate()}
                >
                  {t('edc.returnAll')}
                </Button>
              )}
              {atHomeItems.length > 0 && (
                <Button
                  variant="primary"
                  leftSection={<IconPackageExport size={14} />}
                  onClick={() => setPackDialogOpen(true)}
                >
                  {t('edc.packAll')}
                </Button>
              )}
            </div>
          </RowBetween>

          <DataCard title={t('edc.checklist')}>
            <ScrollArea className={uiStyles.tableWrap}>
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
                        <Badge>{t(`status.${item.status}`, item.status)}</Badge>
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
            </ScrollArea>
          </DataCard>
        </>
      )}

      <Dialog
        open={packDialogOpen}
        onClose={() => setPackDialogOpen(false)}
        title={t('edc.packAll')}
      >
        <Stack>
          <SelectField
            label={t('edc.packDestination')}
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.currentTarget.value)}
            options={locationOptions}
            placeholder={t('edc.selectLocation')}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="subtle" onClick={() => setPackDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              leftSection={<IconPackage size={14} />}
              disabled={!selectedLocationId || packAllMutation.isPending}
              onClick={() => packAllMutation.mutate(selectedLocationId)}
            >
              {t('edc.packConfirm')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </Stack>
  );
}
