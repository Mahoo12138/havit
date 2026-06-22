import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconArchive,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconClipboardList,
  IconHistory,
  IconMapPin,
  IconMinus,
  IconPackage,
  IconShoppingBag,
  IconTrendingUp,
} from '@tabler/icons-react';
import {
  Button,
  Card,
  DatePickerField,
  Dialog,
  SelectField,
  Spinner,
  Stack,
  StackTight,
  TextField,
  TextareaField,
  uiStyles,
  useToast,
} from '../../components/ui';
import {
  itemsApi,
  locationsApi,
  suppliesExtendedApi,
  type Item,
  type Location,
  type PurchaseEvent,
} from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';

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

function findLocationPath(
  nodes: Location[] | undefined,
  locationId: string | undefined,
  prefix = '',
): string | undefined {
  if (!nodes || !locationId) return undefined;
  for (const node of nodes) {
    const path = prefix ? `${prefix} → ${node.name}` : node.name;
    if (node.id === locationId) return path;
    const child = findLocationPath(node.children, locationId, path);
    if (child) return child;
  }
  return undefined;
}

function formatDate(unix: number | undefined): string {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleDateString();
}

function formatDateTime(unix: number | undefined): string {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleString();
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

export function SupplyDetailDesktop({ itemId }: { itemId: string }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US';
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [thresholdOpen, setThresholdOpen] = useState(false);

  const item = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.get(itemId),
  });
  const locations = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const itemType = item.data?.type;
  const isTypeA = itemType === 'predictive_supplies';
  const isTypeB = itemType === 'tracked_spares';

  const purchases = useQuery({
    queryKey: ['supplies', itemId, 'purchase-events'],
    queryFn: () => suppliesExtendedApi.listPurchaseEvents(itemId),
    enabled: isTypeA,
  });
  const calibrations = useQuery({
    queryKey: ['supplies', itemId, 'calibration-events'],
    queryFn: () => suppliesExtendedApi.listCalibrationEvents(itemId),
    enabled: isTypeA,
  });
  const events = useQuery({
    queryKey: ['supplies', itemId, 'events'],
    queryFn: () => suppliesExtendedApi.listEvents(itemId),
    enabled: isTypeB,
  });

  const calibrate = useMutation({
    mutationFn: (signal: 'almost_empty' | 'plenty_left') =>
      suppliesExtendedApi.createCalibrationEvent(itemId, { signal }),
    onSuccess: () => {
      toast.show(t('supplies.calibrationSaved'));
      qc.invalidateQueries({
        queryKey: ['supplies', itemId, 'calibration-events'],
      });
      qc.invalidateQueries({
        queryKey: ['supplies', itemId, 'purchase-events'],
      });
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  const useOne = useMutation({
    mutationFn: () => suppliesExtendedApi.useOne(itemId),
    onSuccess: (next) => {
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['supplies', itemId, 'events'] });
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      toast.show(t('supplies.stockAdjusted'));
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  const recordPurchase = useMutation({
    mutationFn: (body: {
      quantity: number;
      price?: number;
      currency?: string;
      purchased_at?: number;
      notes?: string;
    }) => suppliesExtendedApi.createPurchaseEvent(itemId, body),
    onSuccess: () => {
      toast.show(t('supplies.purchaseRecorded'));
      qc.invalidateQueries({
        queryKey: ['supplies', itemId, 'purchase-events'],
      });
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      setPurchaseOpen(false);
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  const adjustStock = useMutation({
    mutationFn: (newStock: number) =>
      itemsApi.update(itemId, { current_stock: newStock }),
    onSuccess: (next) => {
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      toast.show(t('supplies.stockAdjusted'));
      setStockOpen(false);
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  const updateThreshold = useMutation({
    mutationFn: (threshold: number) =>
      itemsApi.update(itemId, { min_stock_threshold: threshold }),
    onSuccess: (next) => {
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      toast.show(t('supplies.thresholdUpdated'));
      setThresholdOpen(false);
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  const archive = useMutation({
    mutationFn: () => itemsApi.archive(itemId),
    onSuccess: () => {
      toast.show(t('supplies.archived'));
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      navigate({ to: '/supplies' });
    },
    onError: (e: Error) =>
      toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  if (item.isLoading || !item.data) return <Spinner />;
  if (item.error) {
    return <p className={uiStyles.errorText}>{t('errors.not_found')}</p>;
  }

  const it = item.data;
  const locationPath = findLocationPath(locations.data?.tree, it.location_id);
  const purchaseEvents = purchases.data?.purchase_events ?? [];
  const nextPurchase = purchases.data?.next_purchase_at;
  const calibrationEvents = calibrations.data?.calibration_events ?? [];
  const itemEvents = events.data?.events ?? [];

  const localeCurrency = locale.startsWith('zh') ? 'CNY' : 'USD';
  const currency = dominantCurrency(purchaseEvents, localeCurrency);

  const totalPurchases = purchaseEvents.length;
  const totalQuantity = purchaseEvents.reduce(
    (s, e) => s + (e.quantity ?? 0),
    0,
  );
  const totalAmount = purchaseEvents.reduce(
    (s, e) => s + (e.price ?? 0) * (e.quantity ?? 1),
    0,
  );
  const avgPerPurchase = totalPurchases > 0 ? totalAmount / totalPurchases : 0;

  const intervals = intervalsBetween(purchaseEvents);
  const med = median(intervals);
  const medDays = med > 0 ? Math.round(med / DAY) : 0;

  const now = Math.floor(Date.now() / 1000);
  const daysToNext =
    nextPurchase != null
      ? Math.max(0, Math.round((nextPurchase - now) / DAY))
      : null;

  const stock = it.current_stock ?? 0;
  const threshold = it.min_stock_threshold ?? 0;
  const lifespan = it.lifespan_days;
  const inUseSince = it.in_use_since;
  let lifeRemaining: number | null = null;
  if (lifespan != null && lifespan > 0 && inUseSince != null) {
    const expiresAt = inUseSince + lifespan * DAY;
    lifeRemaining = Math.floor((expiresAt - now) / DAY);
  }

  const offlineTitle = isOnline ? undefined : t('supplies.offlineDisabled');

  const typeBadgeKey = isTypeA ? 'typeA' : 'typeB';
  const typeLabel = isTypeA ? t('supplies.typeA') : t('supplies.typeB');

  return (
    <Stack>
      <Button
        variant="subtle"
        className={uiStyles.supplyBackLink}
        onClick={() => navigate({ to: '/supplies' })}
      >
        <IconChevronLeft size={14} />
        {t('supplies.back')}
      </Button>

      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{it.name}</h2>
          <div className={uiStyles.itemSpecBadges}>
            <span className={uiStyles.supplyDetailTypeBadge[typeBadgeKey]}>
              {typeLabel}
            </span>
            {it.category && (
              <span className={uiStyles.itemSpecCategory}>{it.category}</span>
            )}
          </div>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            leftSection={<IconArchive size={16} />}
            variant="quiet"
            onClick={() => archive.mutate()}
            disabled={!isOnline || archive.isPending}
            title={offlineTitle}
          >
            {t('supplies.archive')}
          </Button>
        </div>
      </div>

      <Card className="surface-card">
        <div className={uiStyles.supplyDetailHero}>
          <div className={uiStyles.supplyDetailHeroMain}>
            <div className={uiStyles.supplyDetailHeroMeta}>
              <IconMapPin size={14} />
              <span>{locationPath ?? t('common.notSet')}</span>
            </div>
            {it.description && (
              <p
                style={{
                  margin: 0,
                  color: 'var(--havit-muted)',
                  fontSize: '0.86rem',
                }}
              >
                {it.description}
              </p>
            )}
            {it.tags && it.tags.length > 0 && (
              <div className={uiStyles.tagList}>
                {it.tags.map((tag) => (
                  <span className={uiStyles.tagChip} key={tag.id}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className={uiStyles.itemDashboard}>
        <div className={uiStyles.itemMain}>
          {isTypeA && (
            <>
              <section className={uiStyles.itemSection}>
                <header className={uiStyles.itemSectionHead}>
                  <h3 className={uiStyles.itemSectionTitle}>
                    <span className={uiStyles.itemSectionTitleIcon}>
                      <IconShoppingBag size={14} />
                    </span>
                    {t('supplies.action')}
                  </h3>
                </header>
                <div className={uiStyles.itemSectionBody}>
                  <div className={uiStyles.supplyActionRow}>
                    <Button
                      variant="subtle"
                      className={uiStyles.supplyActionPrimary}
                      onClick={() => setPurchaseOpen(true)}
                      disabled={!isOnline}
                      title={offlineTitle}
                    >
                      <IconShoppingBag size={18} />
                      {t('supplies.recordPurchase')}
                    </Button>
                    <Button
                      variant="subtle"
                      className={uiStyles.supplyActionDanger}
                      onClick={() => calibrate.mutate('almost_empty')}
                      disabled={!isOnline || calibrate.isPending}
                      title={offlineTitle}
                    >
                      <IconAlertTriangle size={18} />
                      {t('supplies.almostEmpty')}
                    </Button>
                    <Button
                      variant="subtle"
                      className={uiStyles.supplyActionSuccess}
                      onClick={() => calibrate.mutate('plenty_left')}
                      disabled={!isOnline || calibrate.isPending}
                      title={offlineTitle}
                    >
                      <IconCheck size={18} />
                      {t('supplies.plentyLeft')}
                    </Button>
                  </div>
                </div>
              </section>

              <section className={uiStyles.itemSection}>
                <header className={uiStyles.itemSectionHead}>
                  <h3 className={uiStyles.itemSectionTitle}>
                    <span className={uiStyles.itemSectionTitleIcon}>
                      <IconClipboardList size={14} />
                    </span>
                    {t('supplies.viewPurchaseHistory')}
                  </h3>
                </header>
                <div className={uiStyles.itemSectionBody}>
                  {purchaseEvents.length === 0 ? (
                    <div className={uiStyles.supplyDetailEmpty}>
                      {t('supplies.noPurchaseData')}
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className={uiStyles.supplyTable}>
                        <thead>
                          <tr>
                            <th className={uiStyles.supplyTableHead}>
                              {t('supplies.purchaseDate')}
                            </th>
                            <th className={uiStyles.supplyTableHead}>
                              {t('supplies.purchaseQuantity')}
                            </th>
                            <th className={uiStyles.supplyTableHead}>
                              {t('supplies.purchasePrice')}
                            </th>
                            <th className={uiStyles.supplyTableHead}>
                              {t('supplies.purchaseNotes')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...purchaseEvents]
                            .sort((a, b) => b.purchased_at - a.purchased_at)
                            .map((ev) => (
                              <tr
                                key={ev.id}
                                className={uiStyles.supplyTableRow}
                              >
                                <td className={uiStyles.supplyTableCell}>
                                  {formatDate(ev.purchased_at)}
                                </td>
                                <td
                                  className={uiStyles.supplyTableCell}
                                  style={{ fontVariantNumeric: 'tabular-nums' }}
                                >
                                  {ev.quantity}
                                </td>
                                <td className={uiStyles.supplyTableCell}>
                                  {ev.price != null
                                    ? fmtAmount(
                                        ev.price,
                                        ev.currency ?? currency,
                                        locale,
                                      )
                                    : '—'}
                                </td>
                                <td
                                  className={uiStyles.supplyTableCell}
                                  style={{
                                    color: 'var(--havit-muted)',
                                    fontSize: '0.82rem',
                                  }}
                                >
                                  {ev.notes ?? '—'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              <section className={uiStyles.itemSection}>
                <header className={uiStyles.itemSectionHead}>
                  <h3 className={uiStyles.itemSectionTitle}>
                    <span className={uiStyles.itemSectionTitleIcon}>
                      <IconHistory size={14} />
                    </span>
                    {t('supplies.calibrate')}
                  </h3>
                </header>
                <div className={uiStyles.itemSectionBody}>
                  {calibrationEvents.length === 0 ? (
                    <div className={uiStyles.supplyDetailEmpty}>
                      {t('supplies.noCalibration')}
                    </div>
                  ) : (
                    <div className={uiStyles.supplyTimeline}>
                      {[...calibrationEvents]
                        .sort((a, b) => b.created_at - a.created_at)
                        .map((ev) => {
                          const variant =
                            ev.signal === 'almost_empty'
                              ? 'almostEmpty'
                              : 'plentyLeft';
                          return (
                            <div
                              key={ev.id}
                              className={uiStyles.supplyTimelineItem}
                            >
                              <span className={uiStyles.supplyTimelineDot} />
                              <div className={uiStyles.supplyTimelineBody}>
                                <span
                                  className={
                                    uiStyles.supplyCalibrationPill[variant]
                                  }
                                >
                                  {variant === 'almostEmpty'
                                    ? t('supplies.almostEmpty')
                                    : t('supplies.plentyLeft')}
                                </span>
                                <span className={uiStyles.supplyTimelineMeta}>
                                  {formatDateTime(ev.created_at)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {isTypeB && (
            <>
              <section className={uiStyles.itemSection}>
                <header className={uiStyles.itemSectionHead}>
                  <h3 className={uiStyles.itemSectionTitle}>
                    <span className={uiStyles.itemSectionTitleIcon}>
                      <IconPackage size={14} />
                    </span>
                    {t('supplies.stock')}
                  </h3>
                  {threshold > 0 && stock <= threshold && (
                    <span className={uiStyles.itemStockLow}>
                      <IconAlertTriangle size={12} />
                      {t('supplies.statusBelowThreshold')}
                    </span>
                  )}
                </header>
                <div className={uiStyles.itemSectionBody}>
                  <div className={uiStyles.supplyStockHero}>
                    <span className={uiStyles.supplyStockHeroValue}>
                      {stock}
                    </span>
                    <span className={uiStyles.supplyStockHeroUnit}>
                      {t('supplies.stock')}
                    </span>
                  </div>
                  <div className={uiStyles.supplyStockHeroSub}>
                    {t('supplies.minThreshold')}:{' '}
                    {it.min_stock_threshold ?? '—'}
                  </div>
                  <div className={uiStyles.supplyActionRow}>
                    <Button
                      variant="subtle"
                      className={uiStyles.supplyActionDanger}
                      onClick={() => useOne.mutate()}
                      disabled={!isOnline || stock <= 0 || useOne.isPending}
                      title={offlineTitle}
                    >
                      <IconMinus size={18} />
                      {t('supplies.useOneAction')}
                    </Button>
                    <Button
                      variant="subtle"
                      className={uiStyles.supplyActionPrimary}
                      onClick={() => setStockOpen(true)}
                      disabled={!isOnline}
                      title={offlineTitle}
                    >
                      <IconShoppingBag size={18} />
                      {t('supplies.addStock')}
                    </Button>
                    <Button
                      variant="subtle"
                      className={uiStyles.supplyActionBigBtn}
                      onClick={() => setThresholdOpen(true)}
                      disabled={!isOnline}
                      title={offlineTitle}
                    >
                      <IconTrendingUp size={18} />
                      {t('supplies.setThresholdTitle')}
                    </Button>
                  </div>
                </div>
              </section>

              {lifespan != null && lifespan > 0 && (
                <section className={uiStyles.itemSection}>
                  <header className={uiStyles.itemSectionHead}>
                    <h3 className={uiStyles.itemSectionTitle}>
                      <span className={uiStyles.itemSectionTitleIcon}>
                        <IconCalendar size={14} />
                      </span>
                      {t('supplies.lifespanDays')}
                    </h3>
                  </header>
                  <div className={uiStyles.itemSectionBody}>
                    <div className={uiStyles.supplyLifeCountdown}>
                      {lifeRemaining == null ? (
                        <span className={uiStyles.supplyLifeCountdownLabel}>
                          {t('supplies.noLifespan')}
                        </span>
                      ) : lifeRemaining < 0 ? (
                        <>
                          <span className={uiStyles.supplyLifeCountdownValue}>
                            0
                          </span>
                          <span className={uiStyles.supplyLifeCountdownLabel}>
                            {t('supplies.lifeExpired')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={uiStyles.supplyLifeCountdownValue}>
                            {lifeRemaining}
                          </span>
                          <span className={uiStyles.supplyLifeCountdownLabel}>
                            {t('supplies.lifeRemaining', {
                              count: lifeRemaining,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <section className={uiStyles.itemSection}>
                <header className={uiStyles.itemSectionHead}>
                  <h3 className={uiStyles.itemSectionTitle}>
                    <span className={uiStyles.itemSectionTitleIcon}>
                      <IconHistory size={14} />
                    </span>
                    {t('supplies.activityLog')}
                  </h3>
                </header>
                <div className={uiStyles.itemSectionBody}>
                  {itemEvents.length === 0 ? (
                    <div className={uiStyles.supplyDetailEmpty}>
                      {t('supplies.noActivity')}
                    </div>
                  ) : (
                    <div className={uiStyles.supplyTimeline}>
                      {[...itemEvents]
                        .sort((a, b) => b.created_at - a.created_at)
                        .map((ev) => (
                          <div
                            key={ev.id}
                            className={uiStyles.supplyTimelineItem}
                          >
                            <span className={uiStyles.supplyTimelineDot} />
                            <div className={uiStyles.supplyTimelineBody}>
                              <span style={{ fontSize: '0.84rem' }}>
                                {ev.event_type}
                              </span>
                              <span className={uiStyles.supplyTimelineMeta}>
                                {formatDateTime(ev.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <div className={uiStyles.itemRail}>
          {isTypeA && (
            <>
              <section className={uiStyles.itemSection}>
                <header className={uiStyles.itemSectionHead}>
                  <h3 className={uiStyles.itemSectionTitle}>
                    <span className={uiStyles.itemSectionTitleIcon}>
                      <IconTrendingUp size={14} />
                    </span>
                    {t('supplies.restockForecast')}
                  </h3>
                </header>
                <div className={uiStyles.itemSectionBody}>
                  {nextPurchase == null ? (
                    <div className={uiStyles.supplyDetailEmpty}>
                      {t('supplies.insufficientHistory')}
                    </div>
                  ) : (
                    <Stack>
                      <div className={uiStyles.supplyLifeCountdown}>
                        <span className={uiStyles.supplyLifeCountdownValue}>
                          {daysToNext ?? 0}
                        </span>
                        <span className={uiStyles.supplyLifeCountdownLabel}>
                          {t('supplies.daysLeft', {
                            count: daysToNext ?? 0,
                          })}
                        </span>
                      </div>
                      <div className={uiStyles.supplyStatCard}>
                        <span className={uiStyles.supplyStatLabel}>
                          {t('supplies.estimatedDate')}
                        </span>
                        <span className={uiStyles.supplyStatValue}>
                          {formatDate(nextPurchase)}
                        </span>
                      </div>
                      {medDays > 0 && (
                        <div className={uiStyles.supplyStatCard}>
                          <span className={uiStyles.supplyStatLabel}>
                            {t('supplies.medianInterval')}
                          </span>
                          <span className={uiStyles.supplyStatValue}>
                            {t('supplies.daysLeft', { count: medDays })}
                          </span>
                          <span className={uiStyles.supplyStatHint}>
                            {t('supplies.samples', {
                              count: intervals.length,
                            })}
                          </span>
                        </div>
                      )}
                    </Stack>
                  )}
                </div>
              </section>

              <section className={uiStyles.itemSection}>
                <header className={uiStyles.itemSectionHead}>
                  <h3 className={uiStyles.itemSectionTitle}>
                    <span className={uiStyles.itemSectionTitleIcon}>
                      <IconClipboardList size={14} />
                    </span>
                    {t('supplies.totalAmount')}
                  </h3>
                </header>
                <div className={uiStyles.itemSectionBody}>
                  <div className={uiStyles.supplyStatGrid}>
                    <div className={uiStyles.supplyStatCard}>
                      <span className={uiStyles.supplyStatLabel}>
                        {t('supplies.totalPurchases')}
                      </span>
                      <span className={uiStyles.supplyStatValue}>
                        {totalPurchases}
                      </span>
                    </div>
                    <div className={uiStyles.supplyStatCard}>
                      <span className={uiStyles.supplyStatLabel}>
                        {t('supplies.totalQuantity')}
                      </span>
                      <span className={uiStyles.supplyStatValue}>
                        {totalQuantity}
                      </span>
                    </div>
                    <div className={uiStyles.supplyStatCard}>
                      <span className={uiStyles.supplyStatLabel}>
                        {t('supplies.totalAmount')}
                      </span>
                      <span className={uiStyles.supplyStatValue}>
                        {fmtAmount(totalAmount, currency, locale)}
                      </span>
                    </div>
                    <div className={uiStyles.supplyStatCard}>
                      <span className={uiStyles.supplyStatLabel}>
                        {t('supplies.averagePerPurchase')}
                      </span>
                      <span className={uiStyles.supplyStatValue}>
                        {fmtAmount(avgPerPurchase, currency, locale)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {isTypeB && (
            <section className={uiStyles.itemSection}>
              <header className={uiStyles.itemSectionHead}>
                <h3 className={uiStyles.itemSectionTitle}>
                  <span className={uiStyles.itemSectionTitleIcon}>
                    <IconClipboardList size={14} />
                  </span>
                  {t('supplies.meta')}
                </h3>
              </header>
              <div className={uiStyles.itemSectionBody}>
                <div className={uiStyles.itemKvList}>
                  <div className={uiStyles.itemKvRow}>
                    <span className={uiStyles.itemKvLabel}>
                      {t('supplies.minThreshold')}
                    </span>
                    <span className={uiStyles.itemKvValue}>
                      {it.min_stock_threshold ?? '—'}
                    </span>
                  </div>
                  <div className={uiStyles.itemKvRow}>
                    <span className={uiStyles.itemKvLabel}>
                      {t('supplies.lifespanDays')}
                    </span>
                    <span className={uiStyles.itemKvValue}>
                      {lifespan ?? '—'}
                    </span>
                  </div>
                  {inUseSince != null && (
                    <div className={uiStyles.itemKvRow}>
                      <span className={uiStyles.itemKvLabel}>
                        {t('itemDetail.purchasedAt')}
                      </span>
                      <span className={uiStyles.itemKvValue}>
                        {formatDate(inUseSince)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className={uiStyles.itemSection}>
            <header className={uiStyles.itemSectionHead}>
              <h3 className={uiStyles.itemSectionTitle}>
                <span className={uiStyles.itemSectionTitleIcon}>
                  <IconMapPin size={14} />
                </span>
                {t('supplies.supplyLocation')}
              </h3>
            </header>
            <div className={uiStyles.itemSectionBody}>
              <div className={uiStyles.itemRailLocation}>
                <IconMapPin size={14} />
                <span>{locationPath ?? t('common.notSet')}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {isTypeA && (
        <RecordPurchaseDialog
          open={purchaseOpen}
          item={it}
          defaultCurrency={currency}
          isPending={recordPurchase.isPending}
          onSubmit={(body) => recordPurchase.mutate(body)}
          onClose={() => setPurchaseOpen(false)}
        />
      )}

      {isTypeB && (
        <>
          <AdjustStockDialog
            open={stockOpen}
            item={it}
            isPending={adjustStock.isPending}
            onSubmit={(newStock) => adjustStock.mutate(newStock)}
            onClose={() => setStockOpen(false)}
          />
          <SetThresholdDialog
            open={thresholdOpen}
            item={it}
            isPending={updateThreshold.isPending}
            onSubmit={(value) => updateThreshold.mutate(value)}
            onClose={() => setThresholdOpen(false)}
          />
        </>
      )}
    </Stack>
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
  item: Item;
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

  if (!open) return null;

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
  item: Item;
  isPending: boolean;
  onSubmit: (newStock: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [stock, setStock] = useState('');

  if (!open) return null;

  const current = item.current_stock ?? 0;
  const value = stock === '' ? String(current) : stock;

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
          value={value}
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
            onClick={() => onSubmit(Number(value) || 0)}
            disabled={isPending}
          >
            {t('supplies.submit')}
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}

function SetThresholdDialog({
  open,
  item,
  isPending,
  onSubmit,
  onClose,
}: {
  open: boolean;
  item: Item;
  isPending: boolean;
  onSubmit: (threshold: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [threshold, setThreshold] = useState('');

  if (!open) return null;

  const current = item.min_stock_threshold ?? 1;
  const value = threshold === '' ? String(current) : threshold;

  return (
    <Dialog
      open
      title={`${t('supplies.setThresholdTitle')} · ${item.name}`}
      onClose={onClose}
    >
      <Stack>
        <TextField
          label={t('supplies.thresholdLabel')}
          type="number"
          min={1}
          value={value}
          onChange={(e) => setThreshold(e.target.value)}
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
            onClick={() => onSubmit(Number(value) || 1)}
            disabled={isPending}
          >
            {t('supplies.submit')}
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}
