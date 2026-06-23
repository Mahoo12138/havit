import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { DataCard, FeatureHeader, MetricStrip } from '../m2/components';
import { backupApi, exportApi, remindersApi, locationsApi } from '../../api/client';
import { LocationQrCode } from '../qr/QrCode';
import { flattenLocationTree } from '../qr/locationQr';

export function OperationsDesktop() {
  const { t } = useTranslation();
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

  const locations = flattenLocationTree(locationsData?.tree ?? []);
  const reminders = remindersData?.reminders ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FeatureHeader
        title={t('operations.title')}
        description={t('operations.description')}
        meta={t('operations.meta')}
      />

      <MetricStrip
        metrics={[
          { label: t('operations.locationLabels'), value: locations.length },
          { label: t('operations.reminderTasks'), value: reminders.length },
          { label: t('operations.lastBackup'), value: backupMutation.data?.path ? t('operations.completed') : t('operations.notExecuted') },
        ]}
      />

      {locationsLoading ? (
        <Spinner />
      ) : (
        <DataCard title={t('operations.locationQr')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {locations.filter((l) => l.qr_code).map((loc) => (
              <Card className="surface-card" key={loc.id}>
                <Stack>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <LocationQrCode code={loc.qr_code!} size={120} alt={loc.name} />
                  </div>
                  <h3 className={uiStyles.heading}>{loc.name}</h3>
                  <span className={uiStyles.muted}>{loc.qr_code}</span>
                </Stack>
              </Card>
            ))}
            <Link to="/qr-print" className={uiStyles.sectionLink}>
              {t('operations.printLabels')}
            </Link>
            <Link to="/location-scan" className={uiStyles.sectionLink}>
              {t('nav.locationScan')}
            </Link>
          </div>
        </DataCard>
      )}

      <div className={uiStyles.twoColumn}>
        <DataCard title={t('operations.reminderScheduler')}>
          <Stack>
            {reminders.length === 0 ? (
              <span className={uiStyles.muted}>{t('operations.noReminders')}</span>
            ) : (
              reminders.slice(0, 10).map((r) => (
                <Card className="surface-card" key={r.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t(`reminder.${r.type}`, r.type)} — {r.item_id}</span>
                    <Badge>{r.is_dismissed ? t('operations.dismissed') : r.sent_at ? t('operations.sent') : t('operations.pending')}</Badge>
                  </div>
                </Card>
              ))
            )}
          </Stack>
        </DataCard>

        <DataCard title={t('operations.backupExport')}>
          <Stack>
            <Button
              leftSection={<IconRefresh size={15} />}
              onClick={() => backupMutation.mutate()}
              disabled={backupMutation.isPending}
            >
              {backupMutation.isPending ? t('operations.backingUp') : t('operations.manualBackup')}
            </Button>
            {backupMutation.data && (
              <span className={uiStyles.muted}>{t('operations.backupComplete', { path: backupMutation.data.path })}</span>
            )}

            <div style={{ height: '1px', background: 'var(--line, #e2e0d8)', margin: '0.5rem 0' }} />

            <Button
              variant="quiet"
              leftSection={<IconDownload size={15} />}
              onClick={() => exportJsonMutation.mutate()}
              disabled={exportJsonMutation.isPending}
            >
              {t('operations.exportJson')}
            </Button>
            <Button
              variant="quiet"
              leftSection={<IconDownload size={15} />}
              onClick={() => exportCsvMutation.mutate()}
              disabled={exportCsvMutation.isPending}
            >
              {t('operations.exportCsv')}
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

