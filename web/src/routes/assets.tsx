import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconPlus,
  IconPackage,
  IconList,
  IconLayoutGrid,
  IconChevronRight,
  IconAlertTriangle,
  IconMapPin,
  IconShieldCheck,
  IconPrinter,
  IconQrcode,
  IconEye,
  IconDots,
  IconSearch,
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
  TreeSelectField,
  uiStyles,
  useToast,
} from '../components/ui';
import { itemsApi, locationsApi, type Item, type Location } from '../api/client';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { CategoryTabs } from '../features/categories/CategoryTabs';

export const Route = createFileRoute('/assets')({
  component: AssetsPage,
});

type AssetTab = string;

interface AssetItem extends Item {
  attachments?: Array<{ url: string; type: string }>;
}

function flatten(
  nodes: Location[] | undefined,
  prefix = '',
): Array<{ value: string; label: string }> {
  if (!nodes) return [];
  const out: Array<{ value: string; label: string }> = [];
  for (const n of nodes) {
    const label = prefix ? `${prefix} → ${n.name}` : n.name;
    out.push({ value: n.id, label });
    out.push(...flatten(n.children, label));
  }
  return out;
}

function getWarrantyStatus(item: Item): 'active' | 'expiring' | 'expired' | 'none' {
  if (!item.warranty_expires_at) return 'none';
  const now = Math.floor(Date.now() / 1000);
  const daysLeft = (item.warranty_expires_at - now) / 86400;
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring';
  return 'active';
}

function formatDate(ts?: number): string {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toISOString().split('T')[0];
}

function formatPrice(price?: number, currency?: string): string {
  if (price == null) return '—';
  if (currency === 'CNY' || currency === '¥') return `¥${price.toLocaleString()}`;
  if (currency === 'USD' || currency === '$') return `$${price.toLocaleString()}`;
  return `${price.toLocaleString()} ${currency ?? ''}`;
}

function AssetsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [opened, setOpened] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    location_id: '',
    serial_number: '',
    warranty_expires_at: '',
    warranty_contact: '',
    purchase_price: '',
    purchase_currency: 'CNY',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'durable', searchQuery],
    queryFn: () => itemsApi.list({
      type: 'durable',
      ...(searchQuery ? { q: searchQuery } : {}),
    }),
  });

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const create = useMutation({
    mutationFn: () =>
      itemsApi.create({
        name: form.name,
        type: 'durable',
        category: form.category || undefined,
        description: form.description || undefined,
        location_id: form.location_id || undefined,
        serial_number: form.serial_number || undefined,
        warranty_expires_at: form.warranty_expires_at
          ? Math.floor(new Date(form.warranty_expires_at).getTime() / 1000)
          : undefined,
        warranty_contact: form.warranty_contact || undefined,
        purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
        purchase_currency: form.purchase_currency || undefined,
      }),
    onSuccess: () => {
      toast.show(t('items.created'));
      queryClient.invalidateQueries({ queryKey: ['items', 'durable'] });
      setForm({
        name: '',
        category: '',
        description: '',
        location_id: '',
        serial_number: '',
        warranty_expires_at: '',
        warranty_contact: '',
        purchase_price: '',
        purchase_currency: 'CNY',
      });
      setOpened(false);
    },
    onError: (e: Error) => toast.show(t('items.createFailed', { error: e.message })),
  });

  const allItems: AssetItem[] = data?.items ?? [];

  const filteredItems = useMemo(() => {
    let items = allItems;
    // Category tab filtering
    if (activeTab !== 'all') {
      items = items.filter((i) => i.category === activeTab);
    }
    if (statusFilter !== 'all') items = items.filter((i) => i.status === statusFilter);
    if (locationFilter !== 'all') items = items.filter((i) => i.location_id === locationFilter);
    return items;
  }, [allItems, activeTab, statusFilter, locationFilter]);

  const stats = useMemo(() => {
    const total = allItems.length;
    const inUse = allItems.filter((i) => i.status === 'in_use').length;
    const warrantyActive = allItems.filter((i) => getWarrantyStatus(i) === 'active').length;
    const warrantyExpiring = allItems.filter((i) => {
      const ws = getWarrantyStatus(i);
      return ws === 'expiring' || ws === 'expired';
    }).length;
    const totalValue = allItems.reduce((sum, i) => sum + (i.purchase_price ?? 0), 0);
    const locations = new Map<string, number>();
    allItems.forEach((i) => {
      if (i.location_id) {
        locations.set(i.location_id, (locations.get(i.location_id) ?? 0) + 1);
      }
    });
    return { total, inUse, warrantyActive, warrantyExpiring, totalValue, locations };
  }, [allItems]);

  const locOptions = flatten(locData?.tree);

  const warrantyAlerts = allItems.filter((i) => {
    const ws = getWarrantyStatus(i);
    return ws === 'expiring' || ws === 'expired';
  }).slice(0, 5);

  const locationBreakdown = Array.from(stats.locations.entries())
    .map(([locId, count]) => {
      const locName = locOptions.find((o) => o.value === locId)?.label ?? locId;
      return { name: locName, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('assets.title')}</h2>
          <p className="page-kicker">{t('assets.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="primary"
            leftSection={<IconPlus size={14} />}
            onClick={() => setOpened(true)}
            disabled={!isOnline}
            title={!isOnline ? t('assets.offlineWarning') : undefined}
          >
            {t('assets.create')}
          </Button>
          <Button variant="subtle" leftSection={<IconPrinter size={14} />}>
            {t('assets.printQR')}
          </Button>
        </div>
      </div>

      <CategoryTabs rootType="physical" value={activeTab} onChange={(v) => setActiveTab(v)} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={uiStyles.edcStatsRow}>
            <div className={uiStyles.edcStatCard}>
              <div className={uiStyles.edcStatIcon.blue}>
                <IconPackage size={20} />
              </div>
              <div className={uiStyles.edcStatMeta}>
                <span className={uiStyles.edcStatLabel}>{t('assets.totalAssets')}</span>
                <strong className={uiStyles.edcStatValue}>{stats.total}</strong>
                <span className={uiStyles.edcStatNote}>{t('assets.totalAssetsHint')}</span>
              </div>
            </div>
            <div className={uiStyles.edcStatCard}>
              <div className={uiStyles.edcStatIcon.green}>
                <IconMapPin size={20} />
              </div>
              <div className={uiStyles.edcStatMeta}>
                <span className={uiStyles.edcStatLabel}>{t('assets.inUseCount')}</span>
                <strong className={uiStyles.edcStatValue}>{stats.inUse}</strong>
                <span className={uiStyles.edcStatNote}>{t('assets.inUseCountHint')}</span>
              </div>
            </div>
            <div className={uiStyles.edcStatCard}>
              <div className={uiStyles.edcStatIcon.orange}>
                <IconShieldCheck size={20} />
              </div>
              <div className={uiStyles.edcStatMeta}>
                <span className={uiStyles.edcStatLabel}>{t('assets.underWarranty')}</span>
                <strong className={uiStyles.edcStatValue}>{stats.warrantyActive}</strong>
                <span className={uiStyles.edcStatNote}>{t('assets.underWarrantyHint')}</span>
              </div>
            </div>
            <div className={uiStyles.edcStatCard}>
              <div className={uiStyles.edcStatIcon.gray}>
                <IconAlertTriangle size={20} />
              </div>
              <div className={uiStyles.edcStatMeta}>
                <span className={uiStyles.edcStatLabel}>{t('assets.needsAttention')}</span>
                <strong className={uiStyles.edcStatValue}>{stats.warrantyExpiring}</strong>
                <span className={uiStyles.edcStatNote}>{t('assets.needsAttentionHint')}</span>
              </div>
            </div>
          </div>

          <div className={uiStyles.edcMainLayout}>
            <div className={uiStyles.edcMainContent}>
              <Card className="surface-card" padded={false}>
                <div className={uiStyles.sectionHead}>
                  <div className={uiStyles.vaFilterRow}>
                    <div className={uiStyles.vaFilterRowLeft}>
                      <span className={uiStyles.searchControl}>
                        <IconSearch size={16} className={uiStyles.searchIcon} />
                        <input
                          className={[uiStyles.input, uiStyles.searchInput].join(' ')}
                          placeholder={t('search.placeholder')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        />
                      </span>
                      <select
                        className={uiStyles.vaFilterSelect}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">{t('assets.allStatuses')}</option>
                        <option value="in_use">{t('assets.inUse')}</option>
                        <option value="stored">{t('assets.stored')}</option>
                        <option value="maintenance">{t('assets.maintenance')}</option>
                      </select>
                      <select
                        className={uiStyles.vaFilterSelect}
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      >
                        <option value="all">{t('assets.allLocations')}</option>
                        {locOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={uiStyles.vaFilterRowRight}>
                      <div className={uiStyles.edcViewToggle}>
                        <button
                          className={uiStyles.edcViewToggleBtn}
                          data-active={viewMode === 'list' || undefined}
                          onClick={() => setViewMode('list')}
                        >
                          <IconList size={14} />
                          {t('assets.listView')}
                        </button>
                        <button
                          className={uiStyles.edcViewToggleBtn}
                          data-active={viewMode === 'cards' || undefined}
                          onClick={() => setViewMode('cards')}
                        >
                          <IconLayoutGrid size={14} />
                          {t('assets.cardView')}
                        </button>
                      </div>
                      <Button variant="subtle">
                        {t('assets.export')}
                      </Button>
                    </div>
                  </div>
                </div>

                {viewMode === 'list' ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className={uiStyles.vaTable}>
                      <thead>
                        <tr>
                          <th className={uiStyles.vaTableHead}>{t('assets.itemName')}</th>
                          <th className={uiStyles.vaTableHead}>{t('assets.location')}</th>
                          <th className={uiStyles.vaTableHead}>{t('assets.status')}</th>
                          <th className={uiStyles.vaTableHead}>{t('assets.warranty')}</th>
                          <th className={uiStyles.vaTableHead}>{t('assets.serialNumber')}</th>
                          <th className={uiStyles.vaTableHead}>{t('assets.purchasePrice')}</th>
                          <th className={uiStyles.vaTableHead}>{t('assets.action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => {
                          const ws = getWarrantyStatus(item);
                          return (
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
                                <span style={{ fontSize: '0.82rem', color: 'var(--havit-muted)' }}>
                                  {locOptions.find((o) => o.value === item.location_id)?.label ?? '—'}
                                </span>
                              </td>
                              <td className={uiStyles.vaTableCell}>
                                <span className={uiStyles.consumableStatusBadge[item.status === 'in_use' ? 'normal' : item.status === 'maintenance' ? 'low' : 'sufficient']}>
                                  {t(`status.${item.status}`, item.status)}
                                </span>
                              </td>
                              <td className={uiStyles.vaTableCell}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    background: ws === 'active'
                                      ? 'var(--havit-success-soft)'
                                      : ws === 'expiring'
                                        ? 'var(--havit-warning-soft)'
                                        : ws === 'expired'
                                          ? 'var(--havit-danger-soft)'
                                          : 'var(--havit-line-soft)',
                                    color: ws === 'active'
                                      ? 'var(--havit-success)'
                                      : ws === 'expiring'
                                        ? 'var(--havit-warning)'
                                        : ws === 'expired'
                                          ? 'var(--havit-danger)'
                                          : 'var(--havit-muted)',
                                  }}
                                >
                                  {ws === 'active' && <IconShieldCheck size={10} />}
                                  {ws === 'expiring' && <IconAlertTriangle size={10} />}
                                  {t(`assets.warranty${ws.charAt(0).toUpperCase() + ws.slice(1)}`)}
                                </span>
                              </td>
                              <td className={uiStyles.vaTableCell} style={{ fontSize: '0.82rem', color: 'var(--havit-muted)', fontVariantNumeric: 'tabular-nums' }}>
                                {item.serial_number ?? '—'}
                              </td>
                              <td className={uiStyles.vaTableCell} style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                {formatPrice(item.purchase_price, item.purchase_currency)}
                              </td>
                              <td className={uiStyles.vaTableCell}>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  <Button
                                    variant="quiet"
                                    leftSection={<IconEye size={12} />}
                                  >
                                    {t('assets.viewDetails')}
                                  </Button>
                                  <button className={uiStyles.iconButton}>
                                    <IconDots size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredItems.length === 0 && (
                          <tr>
                            <td className={uiStyles.vaTableCell} colSpan={7} style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>
                              {t('assets.noItems')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredItems.map((item) => {
                      const ws = getWarrantyStatus(item);
                      return (
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
                                {item.category && (
                                  <span className={uiStyles.vaPlatformBadge}>[{item.category}]</span>
                                )}
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
                              <div style={{ fontSize: '0.78rem', color: 'var(--havit-muted)' }}>
                                {locOptions.find((o) => o.value === item.location_id)?.label ?? '—'}
                              </div>
                            </div>
                            <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                              {formatPrice(item.purchase_price, item.purchase_currency)}
                            </div>
                          </div>
                          <div className={uiStyles.vaMobileCardBadges}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                background: ws === 'active'
                                  ? 'var(--havit-success-soft)'
                                  : ws === 'expiring'
                                    ? 'var(--havit-warning-soft)'
                                    : ws === 'expired'
                                      ? 'var(--havit-danger-soft)'
                                      : 'var(--havit-line-soft)',
                                color: ws === 'active'
                                  ? 'var(--havit-success)'
                                  : ws === 'expiring'
                                    ? 'var(--havit-warning)'
                                    : ws === 'expired'
                                      ? 'var(--havit-danger)'
                                      : 'var(--havit-muted)',
                              }}
                            >
                              {t(`assets.warranty${ws.charAt(0).toUpperCase() + ws.slice(1)}`)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>
                        {t('assets.noItems')}
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
            </div>

            <div className={uiStyles.edcSidebar}>
              <Card className="surface-card">
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>{t('assets.quickActions')}</h3>
                </div>
                <div className={uiStyles.sectionBodyTight}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className={uiStyles.edcQuickAction}>
                      <div className={uiStyles.edcQuickActionIcon}>
                        <IconPlus size={16} />
                      </div>
                      <div className={uiStyles.edcQuickActionMeta}>
                        <span className={uiStyles.edcQuickActionTitle}>{t('assets.addAsset')}</span>
                        <span className={uiStyles.edcQuickActionHint}>{t('assets.addAssetHint')}</span>
                      </div>
                      <IconChevronRight size={16} className={uiStyles.edcQuickActionArrow} />
                    </div>
                    <div className={uiStyles.edcQuickAction}>
                      <div className={uiStyles.edcQuickActionIcon}>
                        <IconPrinter size={16} />
                      </div>
                      <div className={uiStyles.edcQuickActionMeta}>
                        <span className={uiStyles.edcQuickActionTitle}>{t('assets.printQR')}</span>
                        <span className={uiStyles.edcQuickActionHint}>{t('assets.printQRHint')}</span>
                      </div>
                      <IconChevronRight size={16} className={uiStyles.edcQuickActionArrow} />
                    </div>
                    <div className={uiStyles.edcQuickAction}>
                      <div className={uiStyles.edcQuickActionIcon}>
                        <IconQrcode size={16} />
                      </div>
                      <div className={uiStyles.edcQuickActionMeta}>
                        <span className={uiStyles.edcQuickActionTitle}>{t('assets.locationScan')}</span>
                        <span className={uiStyles.edcQuickActionHint}>{t('assets.locationScanHint')}</span>
                      </div>
                      <IconChevronRight size={16} className={uiStyles.edcQuickActionArrow} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="surface-card">
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>{t('assets.warrantyAlerts')}</h3>
                </div>
                <div>
                  {warrantyAlerts.length === 0 ? (
                    <div style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--havit-muted)', fontSize: '0.82rem' }}>
                      {t('assets.noWarrantyInfo')}
                    </div>
                  ) : (
                    warrantyAlerts.map((item) => {
                      const ws = getWarrantyStatus(item);
                      return (
                        <div className={uiStyles.edcReminderItem} key={item.id}>
                          <div className={ws === 'expired' ? uiStyles.edcReminderDotWarn : uiStyles.edcReminderDot} />
                          <div className={uiStyles.edcReminderMeta}>
                            <span className={uiStyles.edcReminderTitle}>{item.name}</span>
                            <span className={uiStyles.edcReminderSub}>
                              {ws === 'expired' ? t('assets.warrantyExpired') : t('assets.warrantyExpiringSoon')}
                              {item.warranty_expires_at ? ` · ${formatDate(item.warranty_expires_at)}` : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              <Card className="surface-card">
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>{t('assets.locationBreakdown')}</h3>
                </div>
                <div>
                  {locationBreakdown.length === 0 ? (
                    <div style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--havit-muted)', fontSize: '0.82rem' }}>
                      —
                    </div>
                  ) : (
                    locationBreakdown.map((loc, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 1.5rem',
                          borderBottom: i < locationBreakdown.length - 1 ? '1px solid var(--havit-line-soft)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', color: 'var(--havit-text)' }}>{loc.name}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--havit-muted)' }}>{loc.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={opened}
        onClose={() => setOpened(false)}
        title={t('assets.create')}
      >
        <Stack>
          <TextField
            label={t('items.name')}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <TextField
            label={t('items.category')}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.currentTarget.value })}
          />
          <TreeSelectField
            label={t('assets.location')}
            tree={locData?.tree ?? []}
            placeholder={t('items.selectLocation')}
            required
            value={form.location_id}
            onChange={(v) => setForm({ ...form, location_id: v })}
          />
          <TextField
            label={t('assets.serialNumberLabel')}
            value={form.serial_number}
            onChange={(e) => setForm({ ...form, serial_number: e.currentTarget.value })}
          />
          <DatePickerField
            label={t('assets.warrantyExpiry')}
            value={form.warranty_expires_at}
            onChange={(v) => setForm({ ...form, warranty_expires_at: v })}
          />
          <TextField
            label={t('assets.warrantyContact')}
            value={form.warranty_contact}
            onChange={(e) => setForm({ ...form, warranty_contact: e.currentTarget.value })}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <TextField
              label={t('assets.purchasePrice')}
              type="number"
              value={form.purchase_price}
              onChange={(e) => setForm({ ...form, purchase_price: e.currentTarget.value })}
              style={{ flex: 1 }}
            />
            <SelectField
              label={t('items.currency')}
              options={[
                { value: 'CNY', label: '¥ CNY' },
                { value: 'USD', label: '$ USD' },
              ]}
              value={form.purchase_currency}
              onChange={(e) => setForm({ ...form, purchase_currency: e.currentTarget.value })}
            />
          </div>
          <TextareaField
            label={t('items.description')}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
          />
          <div className={uiStyles.formActions}>
            <Button variant="quiet" onClick={() => setOpened(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!form.name || !form.location_id || !isOnline || create.isPending}
              title={!isOnline ? t('assets.offlineWarning') : undefined}
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
