import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconPlus,
  IconSettings,
  IconList,
  IconCalendar,
  IconDownload,
  IconBrandSteam,
  IconBrandApple,
  IconBook,
  IconDots,
  IconPackage,
  IconEye,
} from '@tabler/icons-react';
import {
  Button,
  Card,
  Dialog,
  Stack,
  Spinner,
  StackTight,
  Tabs,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import { itemsApi, type Item, type VirtualCredential, type VirtualAddonPurchase } from '../api/client';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export const Route = createFileRoute('/virtual-assets')({
  component: VirtualAssetsPage,
});

type VaTab = 'all' | 'inUse' | 'archived' | 'pendingActivation';

interface VaItem extends Item {
  credentials?: VirtualCredential[];
  addons?: VirtualAddonPurchase[];
}

function getPlatformBadgeClass(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes('steam') || p.includes('gog')) return uiStyles.vaPlatformBadgeSteam;
  if (p.includes('app store') || p.includes('apple')) return uiStyles.vaPlatformBadgeAppStore;
  if (p.includes('kindle') || p.includes('amazon')) return uiStyles.vaPlatformBadgeKindle;
  return uiStyles.vaPlatformBadge;
}

function formatPrice(price?: number, currency?: string): string {
  if (price == null) return '—';
  if (currency === 'CNY' || currency === '¥') return `¥${price}`;
  if (currency === 'USD' || currency === '$') return `$${price}`;
  return `${price} ${currency ?? ''}`;
}

function formatDate(ts?: number): string {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toISOString().split('T')[0];
}

function VirtualAssetsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<VaTab>('all');
  const [opened, setOpened] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  const [form, setForm] = useState({
    name: '',
    platform: '',
    account: '',
    price: '',
    currency: 'CNY',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'virtual'],
    queryFn: () => itemsApi.list({ type: 'virtual' }),
  });

  const create = useMutation({
    mutationFn: () =>
      itemsApi.create({
        name: form.name,
        type: 'virtual',
      }),
    onSuccess: () => {
      toast.show(t('items.created'));
      queryClient.invalidateQueries({ queryKey: ['items', 'virtual'] });
      setForm({ name: '', platform: '', account: '', price: '', currency: 'CNY' });
      setOpened(false);
    },
    onError: (e: Error) => toast.show(t('items.createFailed', { error: e.message })),
  });

  const allItems: VaItem[] = data?.items ?? [];

  const filteredItems = useMemo(() => {
    if (activeTab === 'inUse') return allItems.filter((i) => i.status === 'in_use');
    if (activeTab === 'archived') return allItems.filter((i) => i.status === 'archived');
    if (activeTab === 'pendingActivation') return allItems.filter((i) => i.status === 'pending' || i.status === 'inactive');
    return allItems;
  }, [allItems, activeTab]);

  const stats = useMemo(() => {
    const total = allItems.length;
    const totalValue = allItems.reduce((sum, i) => sum + (i.purchase_price ?? 0), 0);
    const inUseCount = allItems.filter((i) => i.status === 'in_use').length;
    const archivedCount = allItems.filter((i) => i.status === 'archived').length;
    const pendingCount = allItems.filter((i) => i.status === 'pending' || i.status === 'inactive').length;
    return { total, totalValue, inUseCount, archivedCount, pendingCount };
  }, [allItems]);

  const tabItems = [
    { key: 'all', label: t('virtualAssets.all') },
    { key: 'inUse', label: t('virtualAssets.inUse') },
    { key: 'archived', label: t('virtualAssets.archived') },
    { key: 'pendingActivation', label: t('virtualAssets.pendingActivation') },
  ];

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('virtualAssets.title')}</h2>
          <p className="page-kicker">{t('virtualAssets.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="primary"
            leftSection={<IconPlus size={14} />}
            onClick={() => setOpened(true)}
            disabled={!isOnline}
          >
            {t('virtualAssets.create')}
          </Button>
          <Button variant="subtle" leftSection={<IconSettings size={14} />}>
            {t('virtualAssets.settings')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as VaTab)} tabs={tabItems} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={uiStyles.vaKpiStrip}>
            <div className={uiStyles.vaKpiTile}>
              <span className={uiStyles.vaKpiIcon.blue}>
                <IconPackage size={18} />
              </span>
              <div className={uiStyles.vaKpiMeta}>
                <span className={uiStyles.vaKpiLabel}>{t('virtualAssets.totalAssets')}</span>
                <span className={uiStyles.vaKpiValue}>{stats.total}</span>
                <span className={uiStyles.vaKpiNote}>{t('virtualAssets.totalAssetsHint')}</span>
              </div>
            </div>
            <div className={uiStyles.vaKpiTile}>
              <span className={uiStyles.vaKpiIcon.green}>
                <IconBrandSteam size={18} />
              </span>
              <div className={uiStyles.vaKpiMeta}>
                <span className={uiStyles.vaKpiLabel}>{t('virtualAssets.inUse')}</span>
                <span className={uiStyles.vaKpiValue}>{stats.inUseCount}</span>
                <span className={uiStyles.vaKpiNote}>{t('virtualAssets.inUseHint')}</span>
              </div>
            </div>
            <div className={uiStyles.vaKpiTile}>
              <span className={uiStyles.vaKpiIcon.teal}>
                <IconBook size={18} />
              </span>
              <div className={uiStyles.vaKpiMeta}>
                <span className={uiStyles.vaKpiLabel}>{t('virtualAssets.archived')}</span>
                <span className={uiStyles.vaKpiValue}>{stats.archivedCount}</span>
                <span className={uiStyles.vaKpiNote}>{t('virtualAssets.archivedHint')}</span>
              </div>
            </div>
            <div className={uiStyles.vaKpiTile}>
              <span className={uiStyles.vaKpiIcon.orange}>
                <IconBrandApple size={18} />
              </span>
              <div className={uiStyles.vaKpiMeta}>
                <span className={uiStyles.vaKpiLabel}>{t('virtualAssets.pendingActivation')}</span>
                <span className={uiStyles.vaKpiValue}>{stats.pendingCount}</span>
                <span className={uiStyles.vaKpiNote}>{t('virtualAssets.pendingActivationHint')}</span>
              </div>
            </div>
          </div>

          <Card className="surface-card" padded={false}>
            <div className={uiStyles.sectionHead}>
              <div className={uiStyles.vaFilterRow}>
                <div className={uiStyles.vaFilterRowLeft}>
                  <select className={uiStyles.vaFilterSelect}>
                    <option>{t('virtualAssets.allStatus')}</option>
                  </select>
                  <select className={uiStyles.vaFilterSelect}>
                    <option>{t('virtualAssets.allCategories')}</option>
                  </select>
                  <select className={uiStyles.vaFilterSelect}>
                    <option>{t('virtualAssets.allUsers')}</option>
                  </select>
                  <select className={uiStyles.vaFilterSelect}>
                    <option>{t('virtualAssets.sortByExpiration')}</option>
                  </select>
                </div>
                <div className={uiStyles.vaFilterRowRight}>
                  <div className={uiStyles.vaViewToggle}>
                    <button
                      className={uiStyles.vaViewToggleBtn}
                      data-active={viewMode === 'list' || undefined}
                      onClick={() => setViewMode('list')}
                    >
                      <IconList size={14} />
                      {t('virtualAssets.listView')}
                    </button>
                    <button
                      className={uiStyles.vaViewToggleBtn}
                      data-active={viewMode === 'cards' || undefined}
                      onClick={() => setViewMode('cards')}
                    >
                      <IconCalendar size={14} />
                      {t('virtualAssets.calendarView')}
                    </button>
                  </div>
                  <Button variant="subtle" leftSection={<IconDownload size={14} />}>
                    {t('virtualAssets.export')}
                  </Button>
                </div>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div style={{ overflowX: 'auto' }}>
                <table className={uiStyles.vaTable}>
                  <thead>
                    <tr>
                      <th className={uiStyles.vaTableHead}>{t('virtualAssets.itemName')}</th>
                      <th className={uiStyles.vaTableHead}>{t('virtualAssets.platformAccount')}</th>
                      <th className={uiStyles.vaTableHead}>{t('virtualAssets.purchaseDate')}</th>
                      <th className={uiStyles.vaTableHead}>{t('virtualAssets.price')}</th>
                      <th className={uiStyles.vaTableHead}>{t('virtualAssets.statusTags')}</th>
                      <th className={uiStyles.vaTableHead}>{t('virtualAssets.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr className={uiStyles.vaTableRow} key={item.id}>
                        <td className={uiStyles.vaTableCell}>
                          <div className={uiStyles.vaItemInfo}>
                            <div className={uiStyles.vaItemThumb}>
                              <IconPackage size={16} />
                            </div>
                            <div>
                              <Link
                                to="/items/$itemId"
                                params={{ itemId: item.id }}
                                className={uiStyles.vaItemName}
                                style={{ color: 'inherit', textDecoration: 'none' }}
                              >
                                {item.name}
                              </Link>
                              {item.category && (
                                <span className={uiStyles.vaItemCategory}>{item.category}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={uiStyles.vaTableCell}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className={getPlatformBadgeClass(item.category ?? '')}>
                              {item.category ?? '—'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--havit-muted)' }}>
                              {item.serial_number ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className={uiStyles.vaTableCell} style={{ fontSize: '0.82rem', color: 'var(--havit-muted)' }}>
                          {formatDate(item.purchase_date)}
                        </td>
                        <td className={uiStyles.vaTableCell} style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {formatPrice(item.purchase_price, item.purchase_currency)}
                        </td>
                        <td className={uiStyles.vaTableCell}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span className={uiStyles.vaDlcBadgeMulti}>{t('virtualAssets.multiDLC')}</span>
                            <span className={uiStyles.vaDlcBadge}>{t('virtualAssets.steamGGOG')}</span>
                          </div>
                        </td>
                        <td className={uiStyles.vaTableCell}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <Button
                              variant="quiet"
                              leftSection={<IconEye size={12} />}
                            >
                              {t('virtualAssets.viewDetails')}
                            </Button>
                            <button className={uiStyles.iconButton}>
                              <IconDots size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td className={uiStyles.vaTableCell} colSpan={6} style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>
                          {t('virtualAssets.noItems')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredItems.map((item) => (
                  <div className={uiStyles.vaMobileCard} key={item.id}>
                    <div className={uiStyles.vaMobileCardHeader}>
                      <div className={uiStyles.vaItemThumb}>
                        <IconPackage size={18} />
                      </div>
                      <div className={uiStyles.vaMobileCardMeta}>
                        <Link
                          to="/items/$itemId"
                          params={{ itemId: item.id }}
                          className={uiStyles.vaItemName}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {item.name}
                        </Link>
                        <div className={uiStyles.vaMobileCardBadges}>
                          <span className={getPlatformBadgeClass(item.category ?? '')}>
                            [{item.category ?? '—'}]
                          </span>
                          {item.serial_number && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--havit-muted)' }}>
                              {item.serial_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className={uiStyles.vaMobileCardDate}>
                          {t('virtualAssets.purchaseDate')} {formatDate(item.purchase_date)}
                        </div>
                      </div>
                      <div className={uiStyles.vaMobileCardPrice}>
                        {formatPrice(item.purchase_price, item.purchase_currency)}
                      </div>
                    </div>
                    <div className={uiStyles.vaMobileCardBadges}>
                      <span className={uiStyles.vaDlcBadgeMulti}>{t('virtualAssets.multiDLC')}</span>
                      <span className={uiStyles.vaDlcBadge}>{t('virtualAssets.steamGGOG')}</span>
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>
                    {t('virtualAssets.noItems')}
                  </div>
                )}
              </div>
            )}

            {filteredItems.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.5rem',
                borderTop: '1px solid var(--havit-line-soft)',
                fontSize: '0.82rem',
                color: 'var(--havit-muted)',
              }}>
                <span>共 {filteredItems.length} 项</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className={uiStyles.iconButton}>&lt;</button>
                  <button
                    className={uiStyles.iconButton}
                    style={{ background: 'var(--havit-accent-soft)', color: 'var(--havit-accent-ink)' }}
                  >
                    1
                  </button>
                  <button className={uiStyles.iconButton}>&gt;</button>
                </div>
              </div>
            )}
          </Card>

          <div className={uiStyles.vaBottomCards}>
            <div className={uiStyles.vaBottomCard}>
              <h4 className={uiStyles.vaBottomCardTitle}>{t('virtualAssets.assetOverview')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <div className={uiStyles.vaBottomStatLabel}>{t('virtualAssets.assetOverviewTotal')}</div>
                  <div className={uiStyles.vaBottomStatValue}>{stats.total}</div>
                </div>
                <div>
                  <div className={uiStyles.vaBottomStatLabel}>{t('virtualAssets.assetOverviewValue')}</div>
                  <div className={uiStyles.vaBottomStatValue}>¥{stats.totalValue.toLocaleString()}</div>
                  <div className={uiStyles.vaBottomStatNote}>{t('virtualAssets.noConversion')}</div>
                </div>
              </div>
            </div>

            <div className={uiStyles.vaBottomCard}>
              <h4 className={uiStyles.vaBottomCardTitle}>{t('virtualAssets.platformDistribution')}</h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1rem 0',
              }}>
                <div style={{
                  width: '8rem',
                  height: '8rem',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    var(--havit-info) 0% 35%,
                    var(--havit-accent) 35% 55%,
                    var(--havit-warning) 55% 75%,
                    var(--havit-violet) 75% 85%,
                    var(--havit-muted) 85% 100%
                  )`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: '5rem',
                    height: '5rem',
                    borderRadius: '50%',
                    background: 'var(--havit-panel)',
                    display: 'grid',
                    placeItems: 'center',
                  }}>
                    <IconPackage size={20} style={{ color: 'var(--havit-muted)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '999px', background: 'var(--havit-info)' }} />
                    <span>Steam</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '999px', background: 'var(--havit-accent)' }} />
                    <span>App Store</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '999px', background: 'var(--havit-warning)' }} />
                    <span>PlayStation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '999px', background: 'var(--havit-violet)' }} />
                    <span>Nintendo</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '999px', background: 'var(--havit-muted)' }} />
                    <span>Other</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={uiStyles.vaBottomCard}>
              <h4 className={uiStyles.vaBottomCardTitle}>{t('virtualAssets.addonStats')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div className={uiStyles.vaBottomStatLabel}>{t('virtualAssets.recentAddon')}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--havit-text)' }}>
                    Cyberpunk 2077: Phantom Liberty (CNY 99.0)
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div className={uiStyles.vaBottomStatLabel}>{t('virtualAssets.addonCount')}</div>
                    <div className={uiStyles.vaBottomStatValue}>8</div>
                  </div>
                  <div>
                    <div className={uiStyles.vaBottomStatLabel}>{t('virtualAssets.addonTotalSpend')}</div>
                    <div className={uiStyles.vaBottomStatValue}>¥890.00</div>
                    <div className={uiStyles.vaBottomStatNote}>$120.00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={opened}
        onClose={() => setOpened(false)}
        title={t('virtualAssets.create')}
      >
        <Stack>
          <TextField
            label={t('items.name')}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <TextField
            label={t('virtualAssets.platformAccount')}
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.currentTarget.value })}
          />
          <div className={uiStyles.formActions}>
            <Button variant="quiet" onClick={() => setOpened(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!form.name || !isOnline || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </Stack>
  );
}
