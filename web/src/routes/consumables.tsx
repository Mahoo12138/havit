import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconShoppingBag,
  IconPackage,
  IconAlertTriangle,
  IconCheck,
  IconTrendingUp,
  IconPlus,
  IconSettings,
  IconMinus,
} from '@tabler/icons-react';
import {
  Button,
  Card,
  Dialog,
  Spinner,
  Stack,
  StackTight,
  Tabs,
  TextField,
  uiStyles,
} from '../components/ui';
import { itemsApi, itemsExtendedApi } from '../api/client';

export const Route = createFileRoute('/consumables')({
  component: ConsumablesPage,
});

interface Item {
  id: string;
  name: string;
  description?: string;
  category?: string;
  type: string;
  status: string;
  location_id?: string;
  current_stock?: number;
  min_stock_threshold?: number;
  lifespan_days?: number;
  in_use_since?: number;
  purchase_price?: number;
  purchase_date?: number;
  created_at: number;
}

type ConsumableTab = 'overview' | 'typeA' | 'typeB' | 'restock';

function getStockStatus(item: Item): 'normal' | 'sufficient' | 'low' | 'below' {
  if (item.current_stock == null || item.min_stock_threshold == null) return 'normal';
  if (item.current_stock <= 0) return 'below';
  if (item.current_stock <= item.min_stock_threshold) return 'low';
  if (item.current_stock <= item.min_stock_threshold * 2) return 'sufficient';
  return 'normal';
}

function getStockStatusLabel(t: (key: string) => string, status: string): string {
  const map: Record<string, string> = {
    normal: t('consumables.statusNormal'),
    sufficient: t('consumables.statusSufficient'),
    low: t('consumables.statusLow'),
    below: t('consumables.statusBelowThreshold'),
  };
  return map[status] ?? status;
}

function ConsumablesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ConsumableTab>('overview');
  const [showCalibrate, setShowCalibrate] = useState<string | null>(null);
  const [signal, setSignal] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'consumables'],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        itemsApi.list({ type: 'consumable_a' }),
        itemsApi.list({ type: 'consumable_b' }),
      ]);
      return [...a.items, ...b.items];
    },
  });

  const useOneMutation = useMutation({
    mutationFn: (id: string) => itemsExtendedApi.useOne(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items', 'consumables'] }),
  });

  const calibrateMutation = useMutation({
    mutationFn: ({ itemId, signal }: { itemId: string; signal: string }) =>
      itemsExtendedApi.createCalibrationEvent(itemId, { signal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', 'consumables'] });
      setShowCalibrate(null);
      setSignal('');
    },
  });

  const items: Item[] = data ?? [];
  const typeAItems = items.filter((i) => i.type === 'consumable_a');
  const typeBItems = items.filter((i) => i.type === 'consumable_b');
  const warningItems = items.filter(
    (i) => i.current_stock != null && i.min_stock_threshold != null && i.current_stock <= i.min_stock_threshold,
  );
  const sufficientCount = items.length - warningItems.length;

  const tabItems = [
    { key: 'overview', label: t('consumables.overview') },
    { key: 'typeA', label: t('consumables.typeAEvent') },
    { key: 'typeB', label: t('consumables.typeBCount') },
    { key: 'restock', label: t('consumables.restockList') },
  ];

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('consumables.title')}</h2>
          <p className="page-kicker">{t('consumables.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button variant="primary" leftSection={<IconPlus size={14} />}>
            {t('consumables.addItem')}
          </Button>
          <Button variant="subtle" leftSection={<IconSettings size={14} />}>
            {t('consumables.settings')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as ConsumableTab)} tabs={tabItems} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={uiStyles.consumableKpiStrip}>
            <div className={uiStyles.consumableKpiTile}>
              <span className={uiStyles.consumableKpiIcon.blue}>
                <IconPackage size={20} />
              </span>
              <div className={uiStyles.consumableKpiMeta}>
                <span className={uiStyles.consumableKpiLabel}>{t('consumables.totalConsumables')}</span>
                <span className={uiStyles.consumableKpiValue}>{items.length}</span>
                <span className={uiStyles.consumableKpiNote}>
                  {t('consumables.typeACount', { count: typeAItems.length, count2: typeBItems.length })}
                </span>
              </div>
            </div>
            <div className={uiStyles.consumableKpiTile}>
              <span className={uiStyles.consumableKpiIcon.red}>
                <IconShoppingBag size={20} />
              </span>
              <div className={uiStyles.consumableKpiMeta}>
                <span className={uiStyles.consumableKpiLabel}>{t('consumables.needRestock')}</span>
                <span className={uiStyles.consumableKpiValue}>{warningItems.length}</span>
              </div>
            </div>
            <div className={uiStyles.consumableKpiTile}>
              <span className={uiStyles.consumableKpiIcon.orange}>
                <IconAlertTriangle size={20} />
              </span>
              <div className={uiStyles.consumableKpiMeta}>
                <span className={uiStyles.consumableKpiLabel}>{t('consumables.aboutToRunOut')}</span>
                <span className={uiStyles.consumableKpiValue}>{warningItems.length}</span>
                <span className={uiStyles.consumableKpiNote}>
                  {t('consumables.aboutToRunOutHint', { count: warningItems.length })}
                </span>
              </div>
            </div>
            <div className={uiStyles.consumableKpiTile}>
              <span className={uiStyles.consumableKpiIcon.green}>
                <IconCheck size={20} />
              </span>
              <div className={uiStyles.consumableKpiMeta}>
                <span className={uiStyles.consumableKpiLabel}>{t('consumables.stockSufficient')}</span>
                <span className={uiStyles.consumableKpiValue}>{sufficientCount}</span>
                <span className={uiStyles.consumableKpiNote}>
                  {t('consumables.stockSufficientHint', {
                    percent: items.length > 0 ? Math.round((sufficientCount / items.length) * 100) : 0,
                  })}
                </span>
              </div>
            </div>
            <div className={uiStyles.consumableKpiTile}>
              <span className={uiStyles.consumableKpiIcon.violet}>
                <IconTrendingUp size={20} />
              </span>
              <div className={uiStyles.consumableKpiMeta}>
                <span className={uiStyles.consumableKpiLabel}>{t('consumables.monthlyPurchase')}</span>
                <span className={uiStyles.consumableKpiValue}>{t('consumables.monthlyPurchaseAmount')}</span>
                <span className={uiStyles.consumableKpiNote}>{t('consumables.monthlyPurchaseHint')}</span>
              </div>
            </div>
          </div>

          {typeAItems.length > 0 && (
            <Card className="surface-card">
              <div className={uiStyles.sectionHead}>
                <h3 className={uiStyles.sectionTitle}>{t('consumables.restockForecast')}</h3>
                <button className={uiStyles.sectionLink}>
                  {t('consumables.viewAllPredictions')} <span style={{ fontSize: '0.75rem' }}>›</span>
                </button>
              </div>
              <div className={uiStyles.consumableForecastScroll}>
                {typeAItems.slice(0, 6).map((item) => {
                  const stock = item.current_stock ?? 0;
                  const threshold = item.min_stock_threshold ?? 1;
                  const progress = Math.min(100, Math.round((stock / (threshold * 3)) * 100));
                  const daysLeft = Math.max(1, Math.round(progress * 0.3));

                  return (
                    <div className={uiStyles.consumableForecastCard} key={item.id}>
                      <div className={uiStyles.consumableForecastHeader}>
                        <div className={uiStyles.consumableForecastThumb}>
                          <IconPackage size={18} />
                        </div>
                        <div>
                          <div className={uiStyles.consumableForecastName}>{item.name}</div>
                          <div className={uiStyles.consumableForecastHint}>
                            {t('consumables.daysLeft', { count: daysLeft })}
                          </div>
                        </div>
                      </div>
                      <div className={uiStyles.consumableForecastMeta}>
                        <span>{t('consumables.estimatedDate')}</span>
                        <span>5月29日</span>
                      </div>
                      <div>
                        <div className={uiStyles.consumableForecastMeta} style={{ marginBottom: '4px' }}>
                          <span>{t('consumables.stockProgress')}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className={uiStyles.consumableProgressBar}>
                          <div
                            className={uiStyles.consumableProgressFill}
                            style={{
                              width: `${progress}%`,
                              background: progress < 30
                                ? 'var(--havit-danger)'
                                : progress < 60
                                  ? 'var(--havit-warning)'
                                  : 'var(--havit-success)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className={uiStyles.consumableTwoCol}>
            <Card className="surface-card" padded={false}>
              <div className={uiStyles.sectionHead}>
                <h3 className={uiStyles.sectionTitle}>
                  {t('consumables.restockChecklist', { count: warningItems.length })}
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className={uiStyles.consumableTable}>
                  <thead>
                    <tr>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.tracked')}</th>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.type')}</th>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.status')}</th>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.restockDate')}</th>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warningItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      const isTypeA = item.type === 'consumable_a';
                      return (
                        <tr className={uiStyles.consumableTableRow} key={item.id}>
                          <td className={uiStyles.consumableTableCell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <IconPackage size={16} style={{ color: 'var(--havit-muted)' }} />
                              <span style={{ fontWeight: 500 }}>{item.name}</span>
                            </div>
                          </td>
                          <td className={uiStyles.consumableTableCell}>
                            <span
                              style={{
                                display: 'inline-flex',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                background: isTypeA ? 'var(--havit-info-soft)' : 'var(--havit-accent-soft)',
                                color: isTypeA ? 'var(--havit-info)' : 'var(--havit-accent-ink)',
                              }}
                            >
                              {isTypeA ? t('consumables.typeA') : t('consumables.typeB')}
                            </span>
                          </td>
                          <td className={uiStyles.consumableTableCell}>
                            <span className={uiStyles.consumableStatusBadge[stockStatus]}>
                              {getStockStatusLabel(t, stockStatus)}
                            </span>
                          </td>
                          <td className={uiStyles.consumableTableCell} style={{ color: 'var(--havit-muted)', fontSize: '0.82rem' }}>
                            {isTypeA ? '5月29日 (5天)' : '—'}
                          </td>
                          <td className={uiStyles.consumableTableCell}>
                            <Button
                              variant="quiet"
                              onClick={() => isTypeA ? setShowCalibrate(item.id) : useOneMutation.mutate(item.id)}
                              disabled={useOneMutation.isPending}
                            >
                              {isTypeA ? t('consumables.goBuy') : t('consumables.addStock')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {warningItems.length === 0 && (
                      <tr>
                        <td className={uiStyles.consumableTableCell} colSpan={5} style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>
                          {t('consumables.noConsumables')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {warningItems.length > 0 && (
                <button className={uiStyles.consumableViewAllLink}>
                  {t('consumables.restockChecklistAll', { count: warningItems.length })}
                </button>
              )}
            </Card>

            <Card className="surface-card" padded={false}>
              <div className={uiStyles.sectionHead}>
                <h3 className={uiStyles.sectionTitle}>
                  {t('consumables.inventoryCount', { count: typeBItems.length })}
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className={uiStyles.consumableTable}>
                  <thead>
                    <tr>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.tracked')}</th>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.currentQty')}</th>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.minThreshold')}</th>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.status')}</th>
                      <th className={uiStyles.consumableTableHead}>{t('consumables.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeBItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr className={uiStyles.consumableTableRow} key={item.id}>
                          <td className={uiStyles.consumableTableCell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <IconPackage size={16} style={{ color: 'var(--havit-muted)' }} />
                              <span style={{ fontWeight: 500 }}>{item.name}</span>
                            </div>
                          </td>
                          <td className={uiStyles.consumableTableCell} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.current_stock ?? '—'}
                          </td>
                          <td className={uiStyles.consumableTableCell} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.min_stock_threshold ?? '—'}
                          </td>
                          <td className={uiStyles.consumableTableCell}>
                            <span className={uiStyles.consumableStatusBadge[stockStatus]}>
                              {getStockStatusLabel(t, stockStatus)}
                            </span>
                          </td>
                          <td className={uiStyles.consumableTableCell}>
                            <Button
                              variant="quiet"
                              leftSection={<IconMinus size={12} />}
                              onClick={() => useOneMutation.mutate(item.id)}
                              disabled={useOneMutation.isPending}
                            >
                              {t('consumables.useOneAction')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {typeBItems.length === 0 && (
                      <tr>
                        <td className={uiStyles.consumableTableCell} colSpan={5} style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>
                          {t('consumables.noConsumables')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {typeBItems.length > 0 && (
                <button className={uiStyles.consumableViewAllLink}>
                  {t('consumables.inventoryCountAll', { count: typeBItems.length })}
                </button>
              )}
            </Card>
          </div>

          <div className={uiStyles.consumableChartPlaceholder}>
            <div className={uiStyles.sectionHead} style={{ padding: 0, borderBottom: 0 }}>
              <h3 className={uiStyles.sectionTitle}>{t('consumables.consumptionTrend')}</h3>
              <Button variant="subtle">{t('consumables.last6Months')}</Button>
            </div>
            <div className={uiStyles.consumableChartGrid}>
              <div
                style={{
                  height: '200px',
                  background: `linear-gradient(180deg, var(--havit-accent-soft) 0%, transparent 100%)`,
                  borderRadius: 'var(--havit-radius2)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '0 1rem',
                  gap: '2px',
                }}
              >
                {[40, 65, 55, 80, 45, 70].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: 'var(--havit-accent)',
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.7 + (i * 0.05),
                    }}
                  />
                ))}
              </div>
              <div className={uiStyles.consumableChartMeta}>
                <div>
                  <div className={uiStyles.consumableKpiLabel}>{t('consumables.thisMonth')}</div>
                  <div className={uiStyles.consumableChartAmount}>{t('consumables.thisMonthSpend')}</div>
                </div>
                <div className={uiStyles.consumableChartChangeNeg}>
                  <span>{t('consumables.vsLastMonth')} ↓12.5%</span>
                </div>
                <Button variant="quiet" style={{ alignSelf: 'flex-start' }}>
                  {t('consumables.viewPurchaseHistory')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {showCalibrate && (
        <Dialog open title={t('consumables.calibrateTitle')} onClose={() => setShowCalibrate(null)}>
          <Stack>
            <TextField
              label={t('consumables.signal')}
              placeholder={t('consumables.signalPlaceholder')}
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
            />
            <Button
              onClick={() =>
                calibrateMutation.mutate({ itemId: showCalibrate, signal: signal || 'almost_empty' })
              }
              disabled={calibrateMutation.isPending}
            >
              {t('consumables.submitCalibration')}
            </Button>
          </Stack>
        </Dialog>
      )}
    </Stack>
  );
}
