import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconPrinter, IconQrcode } from '@tabler/icons-react';
import { uiStyles } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../components/ui/use-toast';
import { DataCard, FeatureHeader, MetricStrip } from '../m2/components';
import { QrPrintLabel } from '../qr/QrPrintLabel';
import { flattenLocationTree } from '../qr/locationQr';
import { locationsApi } from '../../api/client';
import '../../styles/print.css';
import * as s from './qr-print.css';

type FilterMode = 'all' | 'withCode' | 'withoutCode';

export function QrPrintDesktop() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [query, setQuery] = useState('');
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

  const counts = useMemo(() => {
    const withCode = locations.filter((l) => l.qr_code).length;
    return { withCode, withoutCode: locations.length - withCode };
  }, [locations]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return locations.filter((l) => {
      if (filter === 'withCode' && !l.qr_code) return false;
      if (filter === 'withoutCode' && l.qr_code) return false;
      if (!needle) return true;
      return (
        l.name.toLowerCase().includes(needle) ||
        (l.path ?? '').toLowerCase().includes(needle) ||
        (l.qr_code ?? '').toLowerCase().includes(needle)
      );
    });
  }, [locations, filter, query]);

  // Derived from all locations so the sheet stays stable while browsing filters.
  const selectedLocations = useMemo(
    () => locations.filter((l) => selected.has(l.id)),
    [locations, selected],
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
    <div className={`qr-print-page ${s.page}`}>
      <div className="no-print">
        <FeatureHeader
          title={t('qrPrint.title')}
          description={t('qrPrint.description')}
          meta={t('qrPrint.meta')}
        />

        <MetricStrip
          metrics={[
            { label: t('qrPrint.metrics.locations'), value: locations.length },
            { label: t('qrPrint.metrics.withCode'), value: counts.withCode },
            { label: t('qrPrint.metrics.withoutCode'), value: counts.withoutCode },
            { label: t('qrPrint.metrics.selected'), value: selected.size },
          ]}
        />
      </div>

      <div className="no-print">
        <DataCard
          title={t('qrPrint.listTitle')}
          meta={
            <span className={s.cardMeta}>
              {t('qrPrint.listMeta', { selected: selected.size, total: locations.length })}
            </span>
          }
        >
          <div className={s.toolbarRow}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('qrPrint.searchPlaceholder')}
              aria-label={t('qrPrint.searchPlaceholder')}
              className={s.searchInput}
            />
            <Button
              variant="quiet"
              onClick={selectAllVisible}
              disabled={isLoading || filtered.length === 0}
            >
              {t('qrPrint.selectAll')}
            </Button>
            <Button variant="quiet" onClick={clearSelection} disabled={selected.size === 0}>
              {t('qrPrint.clearSelection')}
            </Button>
          </div>

          <div className={s.listBlock}>
            <div className={s.filterTabsBar}>
              <Tabs
                value={filter}
                onValueChange={(nextValue) => {
                  if (typeof nextValue === 'string') setFilter(nextValue as FilterMode);
                }}
              >
                <TabsList variant="line">
                  <TabsTrigger value="all">
                    {t('qrPrint.filter.all')}
                    <span className={s.tabCount}>{locations.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="withCode">
                    {t('qrPrint.filter.withCode')}
                    <span className={s.tabCount}>{counts.withCode}</span>
                  </TabsTrigger>
                  <TabsTrigger value="withoutCode">
                    {t('qrPrint.filter.withoutCode')}
                    <span className={s.tabCount}>{counts.withoutCode}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isLoading ? (
              <Spinner />
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                {locations.length === 0 ? t('qrPrint.noLocations') : t('qrPrint.emptyFilter')}
              </div>
            ) : (
              <div className={s.locationList}>
                {filtered.map((loc) => (
                  <label
                    key={loc.id}
                    className={
                      selected.has(loc.id)
                        ? `${s.locationRow} ${s.locationRowSelected}`
                        : s.locationRow
                    }
                  >
                    <Checkbox
                      checked={selected.has(loc.id)}
                      onCheckedChange={() => toggleOne(loc.id)}
                    />
                    <span className={s.rowMeta}>
                      <span className={s.rowName}>{loc.name}</span>
                      {loc.path && <span className={s.rowPath}>{loc.path}</span>}
                    </span>
                    {loc.qr_code ? (
                      <span className={s.rowCode}>{loc.qr_code}</span>
                    ) : (
                      <span className="status-pill status-pill-warning">
                        {t('qrPrint.noCodeYet')}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {missingSelected.length > 0 && (
            <div className={s.cardFoot}>
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
            </div>
          )}
        </DataCard>
      </div>

      {printable.length > 0 ? (
        <section className={s.sheetSection}>
          <div className={`no-print ${s.sheetHead}`}>
            <div className={s.sheetTitle}>
              <h3 className={uiStyles.heading}>{t('qrPrint.previewTitle')}</h3>
              <span className={s.cardMeta}>
                {t('qrPrint.previewMeta', { count: printable.length })}
              </span>
            </div>
            <Button leftSection={<IconPrinter size={15} />} onClick={handlePrint}>
              {t('qrPrint.print', { count: printable.length })}
            </Button>
          </div>
          <div className={s.printSheet}>
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
          </div>
        </section>
      ) : (
        !isLoading &&
        locations.length > 0 && (
          <div className="empty-state no-print">{t('qrPrint.previewEmpty')}</div>
        )
      )}
    </div>
  );
}
