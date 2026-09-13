import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { DataCard, FeatureHeader, MetricStrip } from '../m2/components';
import { backupApi, exportApi, remindersApi, locationsApi } from '../../api/client';
import { LocationQrCode } from '../qr/QrCode';
import { flattenLocationTree } from '../qr/locationQr';
import { formatDateTime } from '../essentials/shared';
import * as s from './operations.css';

const REMINDER_PREVIEW_LIMIT = 10;

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
  const qrLocations = locations.filter((l) => l.qr_code);
  const reminders = remindersData?.reminders ?? [];
  const reminderPreview = reminders.slice(0, REMINDER_PREVIEW_LIMIT);

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
        <DataCard
          title={t('operations.locationQr')}
          meta={<span className={s.cardMeta}>{t('operations.qrCount', { count: qrLocations.length })}</span>}
        >
          {qrLocations.length === 0 ? (
            <div className="empty-state">{t('operations.noQr')}</div>
          ) : (
            <div className={s.qrGrid}>
              {qrLocations.map((loc) => (
                <div className={s.qrTile} key={loc.id}>
                  <LocationQrCode code={loc.qr_code!} size={104} alt={loc.name} />
                  <span className={s.qrName}>{loc.name}</span>
                  <span className={s.qrCode}>{loc.qr_code}</span>
                </div>
              ))}
            </div>
          )}
          <div className={s.cardFoot}>
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
        <DataCard
          title={t('operations.reminderScheduler')}
          meta={<span className={s.cardMeta}>{t('operations.reminderCount', { count: reminders.length })}</span>}
        >
          {reminderPreview.length === 0 ? (
            <div className="empty-state">{t('operations.noReminders')}</div>
          ) : (
            <div className={s.reminderList}>
              {reminderPreview.map((r) => (
                <div className={s.reminderRow} key={r.id}>
                  <div className={s.reminderMeta}>
                    <h4 className={s.reminderType}>{t(`reminder.${r.type}`, r.type)}</h4>
                    <span className={s.reminderItem}>{r.item_name ?? r.item_id}</span>
                  </div>
                  <div className={s.reminderSide}>
                    <span className={s.reminderTime}>{formatDateTime(r.trigger_at)}</span>
                    <span className={statusChipClass(r)}>
                      {r.is_dismissed ? t('operations.dismissed') : r.sent_at ? t('operations.sent') : t('operations.pending')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {reminders.length > REMINDER_PREVIEW_LIMIT && (
            <span className={s.exportHint}>{t('operations.reminderPreview', { count: REMINDER_PREVIEW_LIMIT })}</span>
          )}
          <div className={s.cardFoot}>
            <Link to="/reminders" className={uiStyles.sectionLink}>
              {t('reminders.viewAll')}
            </Link>
          </div>
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
            {backupMutation.data?.path && (
              <span className={s.backupPath}>{t('operations.backupComplete', { path: backupMutation.data.path })}</span>
            )}
            {backupMutation.isError && (
              <span className={s.backupError}>{t('operations.backupFailed', { error: errorText(backupMutation.error) })}</span>
            )}

            <hr className={s.divider} />

            <span className={s.exportHint}>{t('operations.exportHint')}</span>
            <div className={s.exportRow}>
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
            </div>
          </Stack>
        </DataCard>
      </div>
    </div>
  );
}

function statusChipClass(r: { is_dismissed: boolean; sent_at?: number }) {
  if (r.is_dismissed) return s.statusChip.dismissed;
  return r.sent_at ? s.statusChip.sent : s.statusChip.pending;
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
