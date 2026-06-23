import { useMemo, useState } from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconCheck,
  IconMinus,
  IconPackage,
  IconPlus,
  IconShoppingBag,
  IconTrendingUp,
} from '@tabler/icons-react';
import {
  Dialog,
  Stack,
  StackTight,
  uiStyles,
  useToast,
} from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { TabsNav } from '../../components/ui/tabs-nav';
import { TextareaField } from '../../components/ui/textarea-field';
import { TextField } from '../../components/ui/text-field';
import { TreeSelectField } from '../../components/ui/tree-select-field';
import {
  itemsApi,
  locationsApi,
  suppliesExtendedApi,
  type Item,
  type Location,
  type PurchaseEvent,
} from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';

type SupplyTab = 'overview' | 'typeA' | 'typeB' | 'restock';
type SupplyKind = 'predictive_supplies' | 'tracked_spares';

const DAY = 24 * 60 * 60;

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function intervalsBetween(events: PurchaseEvent[]): number[] {
  if (events.length < 2) return [];
  const sorted = [...events].sort((a, b) => a.purchased_at - b.purchased_at);
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    diffs.push(sorted[i].purchased_at - sorted[i - 1].purchased_at);
  }
  return diffs;
}

function fmtMonthDay(timestampSec: number, locale: string): string {
  return new Date(timestampSec * 1000).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
}

function fmtAmount(value: number, currency: string, locale: string): string {
  const cur = currency || (locale.startsWith('zh') ? 'CNY' : 'USD');
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${cur} ${value.toFixed(2)}`;
  }
}

function dominantCurrency(events: PurchaseEvent[], fallback: string): string {
  const counts: Record<string, number> = {};
  for (const ev of events) {
    if (!ev.currency) continue;
    counts[ev.currency] = (counts[ev.currency] ?? 0) + 1;
  }
  let best = fallback;
  let bestN = 0;
  for (const [cur, n] of Object.entries(counts)) {
    if (n > bestN) {
      best = cur;
      bestN = n;
    }
  }
  return best;
}

function getStockStatus(
  item: Item,
): 'normal' | 'sufficient' | 'low' | 'below' {
  if (item.current_stock == null || item.min_stock_threshold == null)
    return 'normal';
  if (item.current_stock <= 0) return 'below';
  if (item.current_stock <= item.min_stock_threshold) return 'low';
  if (item.current_stock <= item.min_stock_threshold * 2) return 'sufficient';
  return 'normal';
}

function getStockStatusLabel(
  t: (key: string) => string,
  status: string,
): string {
  const map: Record<string, string> = {
    normal: t('supplies.statusNormal'),
    sufficient: t('supplies.statusSufficient'),
    low: t('supplies.statusLow'),
    below: t('supplies.statusBelowThreshold'),
  };
  return map[status] ?? status;
}

function locationTreeAsNodes(tree: Location[] | undefined): Location[] {
  return tree ?? [];
}

export function SuppliesDesktop() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US';
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SupplyTab>('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [purchaseDialog, setPurchaseDialog] = useState<{
    open: boolean;
    item: Item | null;
  }>({ open: false, item: null });
  const [stockDialog, setStockDialog] = useState<{
    open: boolean;
    item: Item | null;
  }>({ open: false, item: null });

  const supplies = useQuery({
    queryKey: ['items', 'supplies'],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        itemsApi.list({ type: 'predictive_supplies' }),
        itemsApi.list({ type: 'tracked_spares' }),
      ]);
      return [...a.items, ...b.items];
    },
  });

  const locations = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const items = supplies.data ?? [];
  const typeAItems = items.filter((i) => i.type === 'predictive_supplies');
  const typeBItems = items.filter((i) => i.type === 'tracked_spares');

  const purchaseEventQueries = useQueries({
    queries: typeAItems.map((it) => ({
      queryKey: ['supplies', it.id, 'purchase-events'] as const,
      queryFn: () => suppliesExtendedApi.listPurchaseEvents(it.id),
    })),
  });

  const purchaseEventsByItem = useMemo(() => {
    const map = new Map<
      string,
      { events: PurchaseEvent[]; next: number | undefined }
    >();
    typeAItems.forEach((it, idx) => {
      const data = purchaseEventQueries[idx]?.data;
      map.set(it.id, {
        events: data?.purchase_events ?? [],
        next: data?.next_purchase_at,
      });
    });
    return map;
  }, [typeAItems, purchaseEventQueries]);

  const allPurchaseEvents = useMemo(() => {
    const out: PurchaseEvent[] = [];
    for (const v of purchaseEventsByItem.values()) out.push(...v.events);
    return out;
  }, [purchaseEventsByItem]);

  const localeCurrency = locale.startsWith('zh') ? 'CNY' : 'USD';
  const chartCurrency = dominantCurrency(allPurchaseEvents, localeCurrency);

  const monthBuckets = useMemo(
    () => buildMonthBuckets(allPurchaseEvents, 6),
    [allPurchaseEvents],
  );
  const thisMonthTotal = monthBuckets[monthBuckets.length - 1]?.total ?? 0;
  const lastMonthTotal = monthBuckets[monthBuckets.length - 2]?.total ?? 0;
  const thisMonthCount = monthBuckets[monthBuckets.length - 1]?.count ?? 0;
  const thisMonthQty = monthBuckets[monthBuckets.length - 1]?.qty ?? 0;
  const monthMax = Math.max(...monthBuckets.map((m) => m.total), 1);
  const trendPct =
    lastMonthTotal > 0
      ? Math.round(
          (Math.abs(thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100,
        )
      : 0;
  const trendLabel =
    lastMonthTotal === 0
      ? t('supplies.vsLastMonthFlat')
      : thisMonthTotal < lastMonthTotal
        ? t('supplies.vsLastMonthDown', { percent: trendPct })
        : thisMonthTotal > lastMonthTotal
          ? t('supplies.vsLastMonthUp', { percent: trendPct })
          : t('supplies.vsLastMonthFlat');

  const now = Math.floor(Date.now() / 1000);
  const warningItems = items.filter((it) => {
    if (it.type === 'tracked_spares') {
      const status = getStockStatus(it);
      return status === 'low' || status === 'below';
    }
    if (it.type === 'predictive_supplies') {
      const meta = purchaseEventsByItem.get(it.id);
      if (!meta?.next) return false;
      return meta.next - now <= 7 * DAY;
    }
    return false;
  });
  const sufficientCount = items.length - warningItems.length;
  const aboutToRunOut = warningItems.length;

  const calibrate = useMutation({
    mutationFn: ({
      itemId,
      signal,
    }: {
      itemId: string;
      signal: 'almost_empty' | 'plenty_left';
    }) => suppliesExtendedApi.createCalibrationEvent(itemId, { signal }),
    onSuccess: (_data, vars) => {
      toast.show(t('supplies.calibrationSaved'));
      qc.invalidateQueries({
        queryKey: ['supplies', vars.itemId, 'calibration-events'],
      });
      qc.invalidateQueries({
        queryKey: ['supplies', vars.itemId, 'purchase-events'],
      });
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  const useOne = useMutation({
    mutationFn: (itemId: string) => suppliesExtendedApi.useOne(itemId),
    onSuccess: (next) => {
      qc.setQueryData(['item', next.id], next);
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      qc.invalidateQueries({ queryKey: ['supplies', next.id, 'events'] });
      toast.show(t('supplies.stockAdjusted'));
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  const recordPurchase = useMutation({
    mutationFn: ({
      itemId,
      body,
    }: {
      itemId: string;
      body: {
        quantity: number;
        price?: number;
        currency?: string;
        purchased_at?: number;
        notes?: string;
      };
    }) => suppliesExtendedApi.createPurchaseEvent(itemId, body),
    onSuccess: (_data, vars) => {
      toast.show(t('supplies.purchaseRecorded'));
      qc.invalidateQueries({
        queryKey: ['supplies', vars.itemId, 'purchase-events'],
      });
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      setPurchaseDialog({ open: false, item: null });
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  const adjustStock = useMutation({
    mutationFn: ({
      itemId,
      newStock,
    }: {
      itemId: string;
      newStock: number;
    }) => itemsApi.update(itemId, { current_stock: newStock }),
    onSuccess: (next) => {
      qc.setQueryData(['item', next.id], next);
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      toast.show(t('supplies.stockAdjusted'));
      setStockDialog({ open: false, item: null });
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  const tabItems = [
    { key: 'overview', label: t('supplies.overview') },
    { key: 'typeA', label: t('supplies.typeAEvent') },
    { key: 'typeB', label: t('supplies.typeBCount') },
    { key: 'restock', label: t('supplies.restockList') },
  ];

  const showForecast =
    typeAItems.length > 0 && (activeTab === 'overview' || activeTab === 'typeA');
  const showRestockChecklist =
    activeTab === 'overview' || activeTab === 'restock';
  const showInventoryCount =
    activeTab === 'overview' || activeTab === 'typeB';
  const showChart = activeTab === 'overview' || activeTab === 'typeA';

  const offlineTitle = isOnline ? undefined : t('supplies.offlineDisabled');

  function goToDetail(id: string) {
    navigate({ to: '/supplies/$itemId', params: { itemId: id } });
  }

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('supplies.title')}</h2>
          <p className="page-kicker">{t('supplies.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="primary"
            leftSection={<IconPlus size={14} />}
            onClick={() => setAddOpen(true)}
            disabled={!isOnline}
            title={offlineTitle}
          >
            {t('supplies.addItem')}
          </Button>
        </div>
      </div>

      <TabsNav
        value={activeTab}
        onChange={(v) => setActiveTab(v as SupplyTab)}
        tabs={tabItems}
      />

      {supplies.isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={uiStyles.supplyKpiStrip}>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.blue}>
                <IconPackage size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>
                  {t('supplies.totalConsumables')}
                </span>
                <span className={uiStyles.supplyKpiValue}>{items.length}</span>
                <span className={uiStyles.supplyKpiNote}>
                  {t('supplies.typeACount', {
                    count: typeAItems.length,
                    count2: typeBItems.length,
                  })}
                </span>
              </div>
            </div>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.red}>
                <IconShoppingBag size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>
                  {t('supplies.needRestock')}
                </span>
                <span className={uiStyles.supplyKpiValue}>
                  {warningItems.length}
                </span>
              </div>
            </div>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.orange}>
                <IconAlertTriangle size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>
                  {t('supplies.aboutToRunOut')}
                </span>
                <span className={uiStyles.supplyKpiValue}>{aboutToRunOut}</span>
                <span className={uiStyles.supplyKpiNote}>
                  {t('supplies.aboutToRunOutHint', { count: aboutToRunOut })}
                </span>
              </div>
            </div>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.green}>
                <IconCheck size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>
                  {t('supplies.stockSufficient')}
                </span>
                <span className={uiStyles.supplyKpiValue}>
                  {sufficientCount}
                </span>
                <span className={uiStyles.supplyKpiNote}>
                  {t('supplies.stockSufficientHint', {
                    percent:
                      items.length > 0
                        ? Math.round((sufficientCount / items.length) * 100)
                        : 0,
                  })}
                </span>
              </div>
            </div>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.violet}>
                <IconTrendingUp size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>
                  {t('supplies.monthlyPurchase')}
                </span>
                <span className={uiStyles.supplyKpiValue}>
                  {t('supplies.monthlyPurchaseAmount', {
                    amount: fmtAmount(thisMonthTotal, chartCurrency, locale),
                  })}
                </span>
                <span className={uiStyles.supplyKpiNote}>
                  {t('supplies.monthlyPurchaseHint', {
                    count: thisMonthCount,
                    itemCount: thisMonthQty,
                  })}
                </span>
              </div>
            </div>
          </div>

          {showForecast && (
            <Card className="surface-card">
              <div className={uiStyles.sectionHead}>
                <h3 className={uiStyles.sectionTitle}>
                  {t('supplies.restockForecast')}
                </h3>
              </div>
              <div className={uiStyles.supplyForecastScroll}>
                {typeAItems.slice(0, 8).map((item) => {
                  const meta = purchaseEventsByItem.get(item.id);
                  const events = meta?.events ?? [];
                  const next = meta?.next;
                  const hasHistory = events.length >= 2;
                  const intervals = intervalsBetween(events);
                  const med = median(intervals);
                  let progress = 0;
                  let daysLeft: number | null = null;
                  let predictedLabel = t('supplies.insufficientHistory');
                  if (next) {
                    daysLeft = Math.max(
                      0,
                      Math.round((next - now) / DAY),
                    );
                    predictedLabel = fmtMonthDay(next, locale);
                    if (med > 0) {
                      const elapsed = med - (next - now);
                      progress = Math.max(
                        0,
                        Math.min(100, Math.round((elapsed / med) * 100)),
                      );
                    } else {
                      progress = 50;
                    }
                  }
                  return (
                    <div
                      className={uiStyles.supplyForecastCard}
                      key={item.id}
                      onClick={() => goToDetail(item.id)}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={uiStyles.supplyForecastHeader}>
                        <div className={uiStyles.supplyForecastThumb}>
                          <IconPackage size={18} />
                        </div>
                        <div>
                          <div className={uiStyles.supplyForecastName}>
                            {item.name}
                          </div>
                          <div className={uiStyles.supplyForecastHint}>
                            {hasHistory && daysLeft !== null
                              ? t('supplies.daysLeft', { count: daysLeft })
                              : t('supplies.insufficientHistory')}
                          </div>
                        </div>
                      </div>
                      <div className={uiStyles.supplyForecastMeta}>
                        <span>{t('supplies.estimatedDate')}</span>
                        <span>{predictedLabel}</span>
                      </div>
                      <div>
                        <div
                          className={uiStyles.supplyForecastMeta}
                          style={{ marginBottom: '4px' }}
                        >
                          <span>{t('supplies.stockProgress')}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className={uiStyles.supplyProgressBar}>
                          <div
                            className={uiStyles.supplyProgressFill}
                            style={{
                              width: `${progress}%`,
                              background:
                                progress < 30
                                  ? 'var(--havit-danger)'
                                  : progress < 60
                                    ? 'var(--havit-warning)'
                                    : 'var(--havit-success)',
                            }}
                          />
                        </div>
                      </div>
                      <div
                        className={uiStyles.supplyForecastActions}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="quiet"
                          onClick={() =>
                            calibrate.mutate({
                              itemId: item.id,
                              signal: 'almost_empty',
                            })
                          }
                          disabled={!isOnline || calibrate.isPending}
                          title={offlineTitle}
                        >
                          {t('supplies.almostEmpty')}
                        </Button>
                        <Button
                          variant="quiet"
                          onClick={() =>
                            calibrate.mutate({
                              itemId: item.id,
                              signal: 'plenty_left',
                            })
                          }
                          disabled={!isOnline || calibrate.isPending}
                          title={offlineTitle}
                        >
                          {t('supplies.plentyLeft')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className={uiStyles.supplyTwoCol}>
            {showRestockChecklist && (
              <Card className="surface-card" padded={false}>
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>
                    {t('supplies.restockChecklist', {
                      count: warningItems.length,
                    })}
                  </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className={uiStyles.supplyTable}>
                    <thead>
                      <tr>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.tracked')}
                        </th>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.type')}
                        </th>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.status')}
                        </th>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.restockDate')}
                        </th>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.action')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {warningItems.map((item) => {
                        const isTypeA = item.type === 'predictive_supplies';
                        const stockStatus = getStockStatus(item);
                        const meta = purchaseEventsByItem.get(item.id);
                        const next = meta?.next;
                        const daysLeft =
                          next != null
                            ? Math.max(0, Math.round((next - now) / DAY))
                            : null;
                        const restockLabel =
                          isTypeA && next
                            ? `${fmtMonthDay(next, locale)} (${t('supplies.daysLeft', { count: daysLeft ?? 0 })})`
                            : '—';
                        const badgeStatus = isTypeA ? 'low' : stockStatus;
                        return (
                          <tr
                            className={uiStyles.supplyTableRow}
                            key={item.id}
                            onClick={() => goToDetail(item.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className={uiStyles.supplyTableCell}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                }}
                              >
                                <IconPackage
                                  size={16}
                                  style={{ color: 'var(--havit-muted)' }}
                                />
                                <span style={{ fontWeight: 500 }}>
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className={uiStyles.supplyTableCell}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  padding: '2px 6px',
                                  borderRadius: '999px',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  background: isTypeA
                                    ? 'var(--havit-info-soft)'
                                    : 'var(--havit-accent-soft)',
                                  color: isTypeA
                                    ? 'var(--havit-info)'
                                    : 'var(--havit-accent-ink)',
                                }}
                              >
                                {isTypeA
                                  ? t('supplies.typeA')
                                  : t('supplies.typeB')}
                              </span>
                            </td>
                            <td className={uiStyles.supplyTableCell}>
                              <span
                                className={
                                  uiStyles.supplyStatusBadge[badgeStatus]
                                }
                              >
                                {getStockStatusLabel(t, badgeStatus)}
                              </span>
                            </td>
                            <td
                              className={uiStyles.supplyTableCell}
                              style={{
                                color: 'var(--havit-muted)',
                                fontSize: '0.82rem',
                              }}
                            >
                              {restockLabel}
                            </td>
                            <td
                              className={uiStyles.supplyTableCell}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isTypeA ? (
                                <Button
                                  variant="quiet"
                                  onClick={() =>
                                    setPurchaseDialog({
                                      open: true,
                                      item,
                                    })
                                  }
                                  disabled={!isOnline}
                                  title={offlineTitle}
                                >
                                  {t('supplies.goBuy')}
                                </Button>
                              ) : (
                                <Button
                                  variant="quiet"
                                  onClick={() =>
                                    setStockDialog({ open: true, item })
                                  }
                                  disabled={!isOnline}
                                  title={offlineTitle}
                                >
                                  {t('supplies.addStock')}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {warningItems.length === 0 && (
                        <tr>
                          <td
                            className={uiStyles.supplyTableCell}
                            colSpan={5}
                            style={{
                              textAlign: 'center',
                              color: 'var(--havit-muted)',
                              padding: '2rem',
                            }}
                          >
                            {t('supplies.noConsumables')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {showInventoryCount && (
              <Card className="surface-card" padded={false}>
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>
                    {t('supplies.inventoryCount', { count: typeBItems.length })}
                  </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className={uiStyles.supplyTable}>
                    <thead>
                      <tr>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.tracked')}
                        </th>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.currentQty')}
                        </th>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.minThreshold')}
                        </th>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.status')}
                        </th>
                        <th className={uiStyles.supplyTableHead}>
                          {t('supplies.action')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeBItems.map((item) => {
                        const stockStatus = getStockStatus(item);
                        const stock = item.current_stock ?? 0;
                        return (
                          <tr
                            className={uiStyles.supplyTableRow}
                            key={item.id}
                            onClick={() => goToDetail(item.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className={uiStyles.supplyTableCell}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                }}
                              >
                                <IconPackage
                                  size={16}
                                  style={{ color: 'var(--havit-muted)' }}
                                />
                                <span style={{ fontWeight: 500 }}>
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td
                              className={uiStyles.supplyTableCell}
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {item.current_stock ?? '—'}
                            </td>
                            <td
                              className={uiStyles.supplyTableCell}
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {item.min_stock_threshold ?? '—'}
                            </td>
                            <td className={uiStyles.supplyTableCell}>
                              <span
                                className={
                                  uiStyles.supplyStatusBadge[stockStatus]
                                }
                              >
                                {getStockStatusLabel(t, stockStatus)}
                              </span>
                            </td>
                            <td
                              className={uiStyles.supplyTableCell}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="quiet"
                                leftSection={<IconMinus size={12} />}
                                onClick={() => useOne.mutate(item.id)}
                                disabled={
                                  !isOnline ||
                                  stock <= 0 ||
                                  useOne.isPending
                                }
                                title={offlineTitle}
                              >
                                {t('supplies.useOneAction')}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {typeBItems.length === 0 && (
                        <tr>
                          <td
                            className={uiStyles.supplyTableCell}
                            colSpan={5}
                            style={{
                              textAlign: 'center',
                              color: 'var(--havit-muted)',
                              padding: '2rem',
                            }}
                          >
                            {t('supplies.noConsumables')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {showChart && (
            <div className={uiStyles.supplyChartPlaceholder}>
              <div
                className={uiStyles.sectionHead}
                style={{ padding: 0, borderBottom: 0 }}
              >
                <h3 className={uiStyles.sectionTitle}>
                  {t('supplies.consumptionTrend')}
                </h3>
                <span
                  style={{ color: 'var(--havit-muted)', fontSize: '0.78rem' }}
                >
                  {t('supplies.last6Months')}
                </span>
              </div>
              {allPurchaseEvents.length === 0 ? (
                <div className={uiStyles.supplyChartGrid}>
                  <div
                    style={{
                      height: '200px',
                      borderRadius: 'var(--havit-radius2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--havit-muted)',
                      background: 'var(--havit-bg-soft)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {t('supplies.noPurchaseData')}
                  </div>
                </div>
              ) : (
                <div className={uiStyles.supplyChartGrid}>
                  <div
                    style={{
                      height: '200px',
                      background: `linear-gradient(180deg, var(--havit-accent-soft) 0%, transparent 100%)`,
                      borderRadius: 'var(--havit-radius2)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '0 1rem',
                      gap: '6px',
                    }}
                  >
                    {monthBuckets.map((bucket, i) => {
                      const h = Math.max(
                        4,
                        Math.round((bucket.total / monthMax) * 90),
                      );
                      return (
                        <div
                          key={bucket.key}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title={`${bucket.label} · ${fmtAmount(bucket.total, chartCurrency, locale)}`}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: `${h}%`,
                              background: 'var(--havit-accent)',
                              borderRadius: '4px 4px 0 0',
                              opacity: 0.55 + i * 0.07,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.66rem',
                              color: 'var(--havit-muted)',
                            }}
                          >
                            {bucket.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={uiStyles.supplyChartMeta}>
                    <div>
                      <div className={uiStyles.supplyKpiLabel}>
                        {t('supplies.thisMonth')}
                      </div>
                      <div className={uiStyles.supplyChartAmount}>
                        {t('supplies.thisMonthSpend', {
                          amount: fmtAmount(
                            thisMonthTotal,
                            chartCurrency,
                            locale,
                          ),
                        })}
                      </div>
                    </div>
                    <div
                      className={
                        thisMonthTotal < lastMonthTotal
                          ? uiStyles.supplyChartChangeNeg
                          : thisMonthTotal > lastMonthTotal
                            ? uiStyles.supplyChartChangePos
                            : uiStyles.supplyChartChange
                      }
                    >
                      <span>{trendLabel}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AddSupplyDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        locationTree={locationTreeAsNodes(locations.data?.tree)}
        isOnline={isOnline}
      />

      <RecordPurchaseDialog
        open={purchaseDialog.open}
        item={purchaseDialog.item}
        defaultCurrency={chartCurrency}
        isPending={recordPurchase.isPending}
        onSubmit={(body) => {
          if (!purchaseDialog.item) return;
          recordPurchase.mutate({ itemId: purchaseDialog.item.id, body });
        }}
        onClose={() => setPurchaseDialog({ open: false, item: null })}
      />

      <AdjustStockDialog
        open={stockDialog.open}
        item={stockDialog.item}
        isPending={adjustStock.isPending}
        onSubmit={(newStock) => {
          if (!stockDialog.item) return;
          adjustStock.mutate({ itemId: stockDialog.item.id, newStock });
        }}
        onClose={() => setStockDialog({ open: false, item: null })}
      />
    </Stack>
  );
}

function buildMonthBuckets(
  events: PurchaseEvent[],
  count: number,
): Array<{ key: string; label: string; total: number; count: number; qty: number }> {
  const now = new Date();
  const buckets: Array<{
    key: string;
    label: string;
    total: number;
    count: number;
    qty: number;
  }> = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'short' });
    buckets.push({ key, label, total: 0, count: 0, qty: 0 });
  }
  for (const ev of events) {
    const d = new Date(ev.purchased_at * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = buckets.find((b) => b.key === key);
    if (!b) continue;
    b.total += (ev.price ?? 0) * (ev.quantity ?? 1);
    b.count += 1;
    b.qty += ev.quantity ?? 1;
  }
  return buckets;
}

function AddSupplyDialog({
  open,
  onClose,
  locationTree,
  isOnline,
}: {
  open: boolean;
  onClose: () => void;
  locationTree: Location[];
  isOnline: boolean;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const qc = useQueryClient();
  const [kind, setKind] = useState<SupplyKind>('predictive_supplies');
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [stock, setStock] = useState('1');
  const [threshold, setThreshold] = useState('1');
  const [lifespan, setLifespan] = useState('');

  const create = useMutation({
    mutationFn: () => {
      const body: Partial<Item> = { name: name.trim(), type: kind };
      if (locationId) body.location_id = locationId;
      if (kind === 'tracked_spares') {
        body.current_stock = Number(stock) || 0;
        body.min_stock_threshold = Number(threshold) || 1;
        if (lifespan.trim()) body.lifespan_days = Number(lifespan);
      }
      return itemsApi.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      toast.show(t('supplies.addSupplyCreated'));
      setName('');
      setLocationId('');
      setStock('1');
      setThreshold('1');
      setLifespan('');
      setKind('predictive_supplies');
      onClose();
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) return;
    create.mutate();
  };

  return (
    <Dialog open title={t('supplies.addSupplyTitle')} onClose={onClose}>
      <Stack>
        <div className={uiStyles.field}>
          <span className={uiStyles.label}>{t('supplies.chooseType')}</span>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {(
              [
                {
                  value: 'predictive_supplies' as const,
                  label: t('supplies.chooseTypeA'),
                  hint: t('supplies.chooseTypeAHint'),
                },
                {
                  value: 'tracked_spares' as const,
                  label: t('supplies.chooseTypeB'),
                  hint: t('supplies.chooseTypeBHint'),
                },
              ]
            ).map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  border: `1px solid ${
                    kind === opt.value
                      ? 'var(--havit-accent)'
                      : 'var(--havit-line)'
                  }`,
                  borderRadius: 'var(--havit-radius2)',
                  cursor: 'pointer',
                  background:
                    kind === opt.value
                      ? 'var(--havit-accent-soft)'
                      : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="supply-kind"
                  checked={kind === opt.value}
                  onChange={() => setKind(opt.value)}
                  style={{ marginTop: '3px' }}
                />
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {opt.label}
                  </span>
                  <span
                    style={{ color: 'var(--havit-muted)', fontSize: '0.78rem' }}
                  >
                    {opt.hint}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <TextField
          label={t('supplies.supplyName')}
          placeholder={t('supplies.supplyNamePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <TreeSelectField
          label={t('supplies.supplyLocation')}
          placeholder={t('supplies.supplyLocationPlaceholder')}
          tree={locationTree}
          value={locationId}
          onChange={setLocationId}
        />

        {kind === 'tracked_spares' && (
          <>
            <TextField
              label={t('supplies.initialStock')}
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
            <TextField
              label={t('supplies.thresholdLabel')}
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <TextField
              label={t('supplies.lifespanDays')}
              type="number"
              min={1}
              placeholder={t('supplies.lifespanDaysHint')}
              value={lifespan}
              onChange={(e) => setLifespan(e.target.value)}
            />
          </>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <Button variant="quiet" onClick={onClose}>
            {t('supplies.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!isOnline || !name.trim() || create.isPending}
          >
            {t('supplies.submit')}
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}

function RecordPurchaseDialog({
  open,
  item,
  defaultCurrency,
  isPending,
  onSubmit,
  onClose,
}: {
  open: boolean;
  item: Item | null;
  defaultCurrency: string;
  isPending: boolean;
  onSubmit: (body: {
    quantity: number;
    price?: number;
    currency?: string;
    purchased_at?: number;
    notes?: string;
  }) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [purchasedAt, setPurchasedAt] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');

  if (!open || !item) return null;

  const submit = () => {
    const qty = Number(quantity) || 1;
    const body: Parameters<typeof onSubmit>[0] = { quantity: qty };
    const priceN = Number(price);
    if (priceN > 0) body.price = priceN;
    if (currency) body.currency = currency;
    if (purchasedAt) {
      const ts = Math.floor(new Date(purchasedAt).getTime() / 1000);
      if (!Number.isNaN(ts)) body.purchased_at = ts;
    }
    if (notes.trim()) body.notes = notes.trim();
    onSubmit(body);
  };

  const currencyOptions = [
    { value: 'CNY', label: 'CNY ¥' },
    { value: 'USD', label: 'USD $' },
    { value: 'EUR', label: 'EUR €' },
    { value: 'JPY', label: 'JPY ¥' },
    { value: 'GBP', label: 'GBP £' },
  ];

  return (
    <Dialog
      open
      title={`${t('supplies.recordPurchaseTitle')} · ${item.name}`}
      onClose={onClose}
    >
      <Stack>
        <TextField
          label={t('supplies.purchaseQuantity')}
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <TextField
          label={t('supplies.purchasePrice')}
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <SelectField
          label={t('supplies.purchaseCurrency')}
          value={currency}
          options={currencyOptions}
          onChange={(e) => setCurrency(e.currentTarget.value)}
        />
        <DatePickerField
          label={t('supplies.purchaseDate')}
          value={purchasedAt}
          onChange={setPurchasedAt}
        />
        <TextareaField
          label={t('supplies.purchaseNotes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <Button variant="quiet" onClick={onClose}>
            {t('supplies.cancel')}
          </Button>
          <Button variant="primary" onClick={submit} disabled={isPending}>
            {t('supplies.submit')}
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}

function AdjustStockDialog({
  open,
  item,
  isPending,
  onSubmit,
  onClose,
}: {
  open: boolean;
  item: Item | null;
  isPending: boolean;
  onSubmit: (newStock: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [stock, setStock] = useState('');

  if (!open || !item) return null;

  const current = item.current_stock ?? 0;
  const initial = stock === '' ? String(current) : stock;

  return (
    <Dialog
      open
      title={`${t('supplies.adjustStockTitle')} · ${item.name}`}
      onClose={onClose}
    >
      <Stack>
        <TextField
          label={t('supplies.newStock')}
          type="number"
          min={0}
          value={initial}
          onChange={(e) => setStock(e.target.value)}
          autoFocus
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <Button variant="quiet" onClick={onClose}>
            {t('supplies.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => onSubmit(Number(initial) || 0)}
            disabled={isPending}
          >
            {t('supplies.submit')}
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}
