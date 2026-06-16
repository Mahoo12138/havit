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
import { itemsApi, suppliesExtendedApi } from '../api/client';

export const Route = createFileRoute('/supplies')({
  component: SuppliesPage,
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

type SupplyTab = 'overview' | 'typeA' | 'typeB' | 'restock';

function getStockStatus(item: Item): 'normal' | 'sufficient' | 'low' | 'below' {
  if (item.current_stock == null || item.min_stock_threshold == null) return 'normal';
  if (item.current_stock <= 0) return 'below';
  if (item.current_stock <= item.min_stock_threshold) return 'low';
  if (item.current_stock <= item.min_stock_threshold * 2) return 'sufficient';
  return 'normal';
}

function getStockStatusLabel(t: (key: string) => string, status: string): string {
  const map: Record<string, string> = {
    normal: t('supplies.statusNormal'),
    sufficient: t('supplies.statusSufficient'),
    low: t('supplies.statusLow'),
    below: t('supplies.statusBelowThreshold'),
  };
  return map[status] ?? status;
}

function SuppliesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SupplyTab>('overview');
  const [showCalibrate, setShowCalibrate] = useState<string | null>(null);
  const [signal, setSignal] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'supplies'],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        itemsApi.list({ type: 'predictive_supplies' }),
        itemsApi.list({ type: 'tracked_spares' }),
      ]);
      return [...a.items, ...b.items];
    },
  });

  const useOneMutation = useMutation({
    mutationFn: (id: string) => suppliesExtendedApi.useOne(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items', 'supplies'] }),
  });

  const calibrateMutation = useMutation({
    mutationFn: ({ itemId, signal }: { itemId: string; signal: string }) =>
      suppliesExtendedApi.createCalibrationEvent(itemId, { signal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', 'supplies'] });
      setShowCalibrate(null);
      setSignal('');
    },
  });

  const items: Item[] = data ?? [];
  const typeAItems = items.filter((i) => i.type === 'predictive_supplies');
  const typeBItems = items.filter((i) => i.type === 'tracked_spares');
  const warningItems = items.filter(
    (i) => i.current_stock != null && i.min_stock_threshold != null && i.current_stock <= i.min_stock_threshold,
  );
  const sufficientCount = items.length - warningItems.length;

  const tabItems = [
    { key: 'overview', label: t('supplies.overview') },
    { key: 'typeA', label: t('supplies.typeAEvent') },
    { key: 'typeB', label: t('supplies.typeBCount') },
    { key: 'restock', label: t('supplies.restockList') },
  ];

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('supplies.title')}</h2>
          <p className="page-kicker">{t('supplies.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button variant="primary" leftSection={<IconPlus size={14} />}>
            {t('supplies.addItem')}
          </Button>
          <Button variant="subtle" leftSection={<IconSettings size={14} />}>
            {t('supplies.settings')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as SupplyTab)} tabs={tabItems} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={uiStyles.supplyKpiStrip}>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.blue}>
                <IconPackage size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>{t('supplies.totalConsumables')}</span>
                <span className={uiStyles.supplyKpiValue}>{items.length}</span>
                <span className={uiStyles.supplyKpiNote}>
                  {t('supplies.typeACount', { count: typeAItems.length, count2: typeBItems.length })}
                </span>
              </div>
            </div>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.red}>
                <IconShoppingBag size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>{t('supplies.needRestock')}</span>
                <span className={uiStyles.supplyKpiValue}>{warningItems.length}</span>
              </div>
            </div>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.orange}>
                <IconAlertTriangle size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>{t('supplies.aboutToRunOut')}</span>
                <span className={uiStyles.supplyKpiValue}>{warningItems.length}</span>
                <span className={uiStyles.supplyKpiNote}>
                  {t('supplies.aboutToRunOutHint', { count: warningItems.length })}
                </span>
              </div>
            </div>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.green}>
                <IconCheck size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>{t('supplies.stockSufficient')}</span>
                <span className={uiStyles.supplyKpiValue}>{sufficientCount}</span>
                <span className={uiStyles.supplyKpiNote}>
                  {t('supplies.stockSufficientHint', {
                    percent: items.length > 0 ? Math.round((sufficientCount / items.length) * 100) : 0,
                  })}
                </span>
              </div>
            </div>
            <div className={uiStyles.supplyKpiTile}>
              <span className={uiStyles.supplyKpiIcon.violet}>
                <IconTrendingUp size={20} />
              </span>
              <div className={uiStyles.supplyKpiMeta}>
                <span className={uiStyles.supplyKpiLabel}>{t('supplies.monthlyPurchase')}</span>
                <span className={uiStyles.supplyKpiValue}>{t('supplies.monthlyPurchaseAmount')}</span>
                <span className={uiStyles.supplyKpiNote}>{t('supplies.monthlyPurchaseHint')}</span>
              </div>
            </div>
          </div>

          {typeAItems.length > 0 && (
            <Card className="surface-card">
              <div className={uiStyles.sectionHead}>
                <h3 className={uiStyles.sectionTitle}>{t('supplies.restockForecast')}</h3>
                <button className={uiStyles.sectionLink}>
                  {t('supplies.viewAllPredictions')} <span style={{ fontSize: '0.75rem' }}>›</span>
                </button>
              </div>
              <div className={uiStyles.supplyForecastScroll}>
                {typeAItems.slice(0, 6).map((item) => {
                  const stock = item.current_stock ?? 0;
                  const threshold = item.min_stock_threshold ?? 1;
                  const progress = Math.min(100, Math.round((stock / (threshold * 3)) * 100));
                  const daysLeft = Math.max(1, Math.round(progress * 0.3));

                  return (
                    <div className={uiStyles.supplyForecastCard} key={item.id}>
                      <div className={uiStyles.supplyForecastHeader}>
                        <div className={uiStyles.supplyForecastThumb}>
                          <IconPackage size={18} />
                        </div>
                        <div>
                          <div className={uiStyles.supplyForecastName}>{item.name}</div>
                          <div className={uiStyles.supplyForecastHint}>
                            {t('supplies.daysLeft', { count: daysLeft })}
                          </div>
                        </div>
                      </div>
                      <div className={uiStyles.supplyForecastMeta}>
                        <span>{t('supplies.estimatedDate')}</span>
                        <span>5月29日</span>
                      </div>
                      <div>
                        <div className={uiStyles.supplyForecastMeta} style={{ marginBottom: '4px' }}>
                          <span>{t('supplies.stockProgress')}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className={uiStyles.supplyProgressBar}>
                          <div
                            className={uiStyles.supplyProgressFill}
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

          <div className={uiStyles.supplyTwoCol}>
            <Card className="surface-card" padded={false}>
              <div className={uiStyles.sectionHead}>
                <h3 className={uiStyles.sectionTitle}>
                  {t('supplies.restockChecklist', { count: warningItems.length })}
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className={uiStyles.supplyTable}>
                  <thead>
                    <tr>
                      <th className={uiStyles.supplyTableHead}>{t('supplies.tracked')}</th>
                      <th className={uiStyles.supplyTableHead}>{t('supplies.type')}</th>
                      <th className={uiStyles.supplyTableHead}>{t('supplies.status')}</th>
                      <th className={uiStyles.supplyTableHead}>{t('supplies.restockDate')}</th>
                      <th className={uiStyles.supplyTableHead}>{t('supplies.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warningItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      const isTypeA = item.type === 'predictive_supplies';
                      return (
                        <tr className={uiStyles.supplyTableRow} key={item.id}>
                          <td className={uiStyles.supplyTableCell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <IconPackage size={16} style={{ color: 'var(--havit-muted)' }} />
                              <span style={{ fontWeight: 500 }}>{item.name}</span>
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
                                background: isTypeA ? 'var(--havit-info-soft)' : 'var(--havit-accent-soft)',
                                color: isTypeA ? 'var(--havit-info)' : 'var(--havit-accent-ink)',
                              }}
                            >
                              {isTypeA ? t('supplies.typeA') : t('supplies.typeB')}
                            </span>
                          </td>
                          <td className={uiStyles.supplyTableCell}>
                            <span className={uiStyles.supplyStatusBadge[stockStatus]}>
                              {getStockStatusLabel(t, stockStatus)}
                            </span>
                          </td>
                          <td className={uiStyles.supplyTableCell} style={{ color: 'var(--havit-muted)', fontSize: '0.82rem' }}>
                            {isTypeA ? '5月29日 (5天)' : '—'}
                          </td>
                          <td className={uiStyles.supplyTableCell}>
                            <Button
                              variant="quiet"
                              onClick={() => isTypeA ? setShowCalibrate(item.id) : useOneMutation.mutate(item.id)}
                              disabled={useOneMutation.isPending}
                            >
                              {isTypeA ? t('supplies.goBuy') : t('supplies.addStock')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {warningItems.length === 0 && (
                      <tr>
                        <td className={uiStyles.supplyTableCell} colSpan={5} style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>
                          {t('supplies.noConsumables')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {warningItems.length > 0 && (
                <button className={uiStyles.supplyViewAllLink}>
                  {t('supplies.restockChecklistAll', { count: warningItems.length })}
                </button>
              )}
            </Card>

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
                      <th className={uiStyles.supplyTableHead}>{t('supplies.tracked')}</th>
                      <th className={uiStyles.supplyTableHead}>{t('supplies.currentQty')}</th>
                      <th className={uiStyles.supplyTableHead}>{t('supplies.minThreshold')}</th>
                      <th className={uiStyles.supplyTableHead}>{t('supplies.status')}</th>
                      <th className={uiStyles.supplyTableHead}>{t('supplies.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeBItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr className={uiStyles.supplyTableRow} key={item.id}>
                          <td className={uiStyles.supplyTableCell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <IconPackage size={16} style={{ color: 'var(--havit-muted)' }} />
                              <span style={{ fontWeight: 500 }}>{item.name}</span>
                            </div>
                          </td>
                          <td className={uiStyles.supplyTableCell} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.current_stock ?? '—'}
                          </td>
                          <td className={uiStyles.supplyTableCell} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {item.min_stock_threshold ?? '—'}
                          </td>
                          <td className={uiStyles.supplyTableCell}>
                            <span className={uiStyles.supplyStatusBadge[stockStatus]}>
                              {getStockStatusLabel(t, stockStatus)}
                            </span>
                          </td>
                          <td className={uiStyles.supplyTableCell}>
                            <Button
                              variant="quiet"
                              leftSection={<IconMinus size={12} />}
                              onClick={() => useOneMutation.mutate(item.id)}
                              disabled={useOneMutation.isPending}
                            >
                              {t('supplies.useOneAction')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {typeBItems.length === 0 && (
                      <tr>
                        <td className={uiStyles.supplyTableCell} colSpan={5} style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>
                          {t('supplies.noConsumables')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {typeBItems.length > 0 && (
                <button className={uiStyles.supplyViewAllLink}>
                  {t('supplies.inventoryCountAll', { count: typeBItems.length })}
                </button>
              )}
            </Card>
          </div>

          <div className={uiStyles.supplyChartPlaceholder}>
            <div className={uiStyles.sectionHead} style={{ padding: 0, borderBottom: 0 }}>
              <h3 className={uiStyles.sectionTitle}>{t('supplies.consumptionTrend')}</h3>
              <Button variant="subtle">{t('supplies.last6Months')}</Button>
            </div>
            <div className={uiStyles.supplyChartGrid}>
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
              <div className={uiStyles.supplyChartMeta}>
                <div>
                  <div className={uiStyles.supplyKpiLabel}>{t('supplies.thisMonth')}</div>
                  <div className={uiStyles.supplyChartAmount}>{t('supplies.thisMonthSpend')}</div>
                </div>
                <div className={uiStyles.supplyChartChangeNeg}>
                  <span>{t('supplies.vsLastMonth')} ↓12.5%</span>
                </div>
                <Button variant="quiet" style={{ alignSelf: 'flex-start' }}>
                  {t('supplies.viewPurchaseHistory')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {showCalibrate && (
        <Dialog open title={t('supplies.calibrateTitle')} onClose={() => setShowCalibrate(null)}>
          <Stack>
            <TextField
              label={t('supplies.signal')}
              placeholder={t('supplies.signalPlaceholder')}
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
            />
            <Button
              onClick={() =>
                calibrateMutation.mutate({ itemId: showCalibrate, signal: signal || 'almost_empty' })
              }
              disabled={calibrateMutation.isPending}
            >
              {t('supplies.submitCalibration')}
            </Button>
          </Stack>
        </Dialog>
      )}
    </Stack>
  );
}

