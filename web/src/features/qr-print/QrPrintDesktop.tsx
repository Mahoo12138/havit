import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconPrinter, IconQrcode } from '@tabler/icons-react';
import { Button, uiStyles, useToast } from '../../components/ui';
import { FeatureHeader } from '../m2/components';
import { QrPrintLabel } from '../qr/QrPrintLabel';
import { flattenLocationTree } from '../qr/locationQr';
import { locationsApi } from '../../api/client';
import '../../styles/print.css';

type FilterMode = 'all' | 'withCode' | 'withoutCode';

export function QrPrintDesktop() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const initializedSelection = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const locations = useMemo(
    () => flattenLocationTree(data?.tree ?? []),
    [data?.tree],
  );

  useEffect(() => {
    if (initializedSelection.current || locations.length === 0) return;
    initializedSelection.current = true;
    const withCode = locations.filter((l) => l.qr_code).map((l) => l.id);
    if (withCode.length > 0) {
      setSelected(new Set(withCode));
    }
  }, [locations]);

  const filtered = useMemo(() => {
    if (filter === 'withCode') return locations.filter((l) => l.qr_code);
    if (filter === 'withoutCode') return locations.filter((l) => !l.qr_code);
    return locations;
  }, [locations, filter]);

  const selectedLocations = useMemo(
    () => filtered.filter((l) => selected.has(l.id)),
    [filtered, selected],
  );

  const printable = selectedLocations.filter((l) => l.qr_code);
  const missingSelected = selectedLocations.filter((l) => !l.qr_code);

  const generateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await locationsApi.generateQRCode(id);
      }
    },
    onSuccess: () => {
      toast.show(t('qrPrint.generated'));
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: Error) => toast.show(t('qrPrint.generateFailed', { error: e.message })),
  });

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(new Set(filtered.map((l) => l.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handlePrint() {
    if (printable.length === 0) {
      toast.show(t('qrPrint.noPrintable'));
      return;
    }
    window.print();
  }

  function handleGenerateMissing() {
    const ids = missingSelected.map((l) => l.id);
    if (ids.length === 0) return;
    generateMutation.mutate(ids);
  }

  return (
    <div className="qr-print-page" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="no-print">
        <FeatureHeader
          title={t('qrPrint.title')}
          description={t('qrPrint.description')}
          meta={t('qrPrint.meta')}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {(['all', 'withCode', 'withoutCode'] as const).map((mode) => (
            <Button
              key={mode}
              variant={filter === mode ? 'primary' : 'quiet'}
              onClick={() => setFilter(mode)}
            >
              {t(`qrPrint.filter.${mode}`)}
            </Button>
          ))}
          <Button variant="quiet" onClick={selectAllVisible}>
            {t('qrPrint.selectAll')}
          </Button>
          <Button variant="quiet" onClick={clearSelection}>
            {t('qrPrint.clearSelection')}
          </Button>
          {missingSelected.length > 0 && (
            <Button
              variant="quiet"
              leftSection={<IconQrcode size={15} />}
              onClick={handleGenerateMissing}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending
                ? t('qrPrint.generating')
                : t('qrPrint.generateMissing', { count: missingSelected.length })}
            </Button>
          )}
          <Button
            leftSection={<IconPrinter size={15} />}
            onClick={handlePrint}
            disabled={printable.length === 0}
          >
            {t('qrPrint.print', { count: printable.length })}
          </Button>
        </div>

        {isLoading ? (
          <div className={uiStyles.muted}>{t('common.loading')}</div>
        ) : locations.length === 0 ? (
          <div className={uiStyles.muted}>{t('qrPrint.noLocations')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {filtered.map((loc) => (
              <label
                key={loc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(loc.id)}
                  onChange={() => toggleOne(loc.id)}
                />
                <span style={{ flex: 1 }}>{loc.path ? `${loc.path} → ${loc.name}` : loc.name}</span>
                <span className={uiStyles.muted}>
                  {loc.qr_code ?? t('qrPrint.noCodeYet')}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {printable.length > 0 && (
        <div className={uiStyles.qrPrintGrid}>
          {printable.map((loc) => (
            <QrPrintLabel
              key={loc.id}
              name={loc.name}
              code={loc.qr_code}
              path={loc.path}
            />
          ))}
        </div>
      )}
    </div>
  );
}
