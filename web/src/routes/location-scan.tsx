import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconMapPin, IconPackage } from '@tabler/icons-react';
import { Button, Stack, TextField, uiStyles } from '../components/ui';
import { FeatureHeader } from '../features/m2/components';
import { QrScanner } from '../features/qr/QrScanner';
import { parseScannedLocationCode } from '../features/qr/locationQr';
import { locationsApi } from '../api/client';
import { getLocationTypeMeta } from '../features/locations/types';

type LocationScanSearch = {
  code?: string;
};

export const Route = createFileRoute('/location-scan')({
  validateSearch: (search: Record<string, unknown>): LocationScanSearch => ({
    code: typeof search.code === 'string' ? search.code : undefined,
  }),
  component: LocationScanPage,
});

function LocationScanPage() {
  const { t } = useTranslation();
  const { code: initialCode } = Route.useSearch();
  const [manualCode, setManualCode] = useState(initialCode ?? '');

  const scanMutation = useMutation({
    mutationFn: (raw: string) => {
      const code = parseScannedLocationCode(raw);
      if (!code) {
        throw new Error(t('locationScan.invalidCode'));
      }
      return locationsApi.scan(code);
    },
  });

  useEffect(() => {
    if (initialCode) {
      scanMutation.mutate(initialCode);
    }
    // Only run on mount when opened via printed QR deep link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDetected(raw: string) {
    const code = parseScannedLocationCode(raw);
    if (code) setManualCode(code);
    scanMutation.mutate(raw);
  }

  function handleManualLookup() {
    scanMutation.mutate(manualCode);
  }

  const result = scanMutation.data;
  const resultMeta = result ? getLocationTypeMeta(result.location.type) : null;
  const ResultIcon = resultMeta?.icon ?? IconMapPin;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FeatureHeader
        title={t('locationScan.title')}
        description={t('locationScan.description')}
        meta="ops"
      />

      <div className={uiStyles.twoColumn}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <QrScanner onDetected={handleDetected} busy={scanMutation.isPending} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--line, #e2e0d8)' }} />
            <span className={uiStyles.muted}>{t('capture.orManual')}</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--line, #e2e0d8)' }} />
          </div>
          <TextField
            label={t('locationScan.codeInput')}
            placeholder={t('locationScan.codePlaceholder')}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <Button onClick={handleManualLookup} disabled={!manualCode || scanMutation.isPending}>
            {scanMutation.isPending ? t('locationScan.lookupPending') : t('locationScan.lookup')}
          </Button>
          {scanMutation.isError && (
            <span style={{ color: 'var(--danger, #c53030)' }}>
              {scanMutation.error instanceof Error
                ? scanMutation.error.message
                : t('locationScan.lookupFailed')}
            </span>
          )}
        </div>

        <div className={uiStyles.detailBody}>
          {!result ? (
            <div className={uiStyles.reminderEmpty}>{t('locationScan.emptyHint')}</div>
          ) : (
            <Stack>
              <div className={uiStyles.locationHero}>
                <span className={uiStyles.locationHeroIcon[resultMeta!.tone]}>
                  <ResultIcon size={28} />
                </span>
                <div className={uiStyles.locationHeroMeta}>
                  <span className={uiStyles.locationHeroName}>{result.location.name}</span>
                  {result.location.qr_code && (
                    <span className={uiStyles.qrChip}>{result.location.qr_code}</span>
                  )}
                </div>
              </div>

              <div className={uiStyles.subsection}>
                <span className={uiStyles.subsectionTitle}>
                  {t('locationScan.containedItems', { count: result.items.length })}
                </span>
              </div>

              {result.items.length === 0 ? (
                <span className={uiStyles.muted}>{t('locationScan.noItems')}</span>
              ) : (
                <div className={uiStyles.childrenStrip}>
                  {result.items.map((item) => (
                    <Link
                      key={item.id}
                      to="/items/$itemId"
                      params={{ itemId: item.id }}
                      className={uiStyles.childChip}
                    >
                      <IconPackage size={15} />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </Stack>
          )}
        </div>
      </div>
    </div>
  );
}
