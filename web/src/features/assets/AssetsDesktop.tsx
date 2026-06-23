import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  IconPlus, IconPackage, IconList, IconLayoutGrid, IconChevronRight,
  IconAlertTriangle, IconMapPin, IconShieldCheck, IconPrinter, IconQrcode,
  IconEye, IconDots, IconSearch,
} from '@tabler/icons-react';
import {
  Card, Dialog, Spinner, Stack, StackTight, uiStyles,
} from '../../components/ui';

import { Button } from '../../components/ui/button';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { SelectField } from '../../components/ui/select-field';
import { TextareaField } from '../../components/ui/textarea-field';
import { TextField } from '../../components/ui/text-field';
import { TreeSelectField } from '../../components/ui/tree-select-field';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { CategoryTabs } from '../../features/categories/CategoryTabs';
import { useAssetsData, getWarrantyStatus, formatDate, formatPrice } from './useAssetsData';

type AssetTab = string;

export function AssetsDesktop() {
  const data = useAssetsData();
  const { t, isLoading, allItems, locData, locOptions, stats, warrantyAlerts, locationBreakdown, searchQuery, setSearchQuery, form, setForm, create } = data;
  const isOnline = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [opened, setOpened] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeTab !== 'all') items = items.filter((i) => i.category === activeTab);
    if (statusFilter !== 'all') items = items.filter((i) => i.status === statusFilter);
    if (locationFilter !== 'all') items = items.filter((i) => i.location_id === locationFilter);
    return items;
  }, [allItems, activeTab, statusFilter, locationFilter]);

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('assets.title')}</h2>
          <p className="page-kicker">{t('assets.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button variant="primary" leftSection={<IconPlus size={14} />} onClick={() => setOpened(true)} disabled={!isOnline} title={!isOnline ? t('assets.offlineWarning') : undefined}>
            {t('assets.create')}
          </Button>
          <Button variant="primary" leftSection={<IconPrinter size={14} />}>
            {t('assets.printQR')}
          </Button>
        </div>
      </div>

      <CategoryTabs rootType="physical" value={activeTab} onChange={(v) => setActiveTab(v)} />

      {isLoading ? <Spinner /> : (
        <>
          <div className={uiStyles.essentialsStatsRow}>
            <StatCard icon={IconPackage} tone="blue" label={t('assets.totalAssets')} value={stats.total} note={t('assets.totalAssetsHint')} />
            <StatCard icon={IconMapPin} tone="green" label={t('assets.inUseCount')} value={stats.inUse} note={t('assets.inUseCountHint')} />
            <StatCard icon={IconShieldCheck} tone="orange" label={t('assets.underWarranty')} value={stats.warrantyActive} note={t('assets.underWarrantyHint')} />
            <StatCard icon={IconAlertTriangle} tone="gray" label={t('assets.needsAttention')} value={stats.warrantyExpiring} note={t('assets.needsAttentionHint')} />
          </div>

          <div className={uiStyles.essentialsMainLayout}>
            <div className={uiStyles.essentialsMainContent}>
              <Card className="surface-card" padded={false}>
                <div className={uiStyles.sectionHead}>
                  <div className={uiStyles.vaFilterRow}>
                    <div className={uiStyles.vaFilterRowLeft}>
                      <span className={uiStyles.searchControl}>
                        <IconSearch size={16} className={uiStyles.searchIcon} />
                        <input className={[uiStyles.input, uiStyles.searchInput].join(' ')} placeholder={t('search.placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.currentTarget.value)} />
                      </span>
                      <SelectField label={t('assets.status')} options={[{ value: 'all', label: t('assets.allStatuses') }, { value: 'in_use', label: t('assets.inUse') }, { value: 'stored', label: t('assets.stored') }, { value: 'maintenance', label: t('assets.maintenance') }]} value={statusFilter} onChange={(e) => setStatusFilter(e.currentTarget.value)} />
                      <SelectField label={t('assets.location')} options={[{ value: 'all', label: t('assets.allLocations') }, ...locOptions]} value={locationFilter} onChange={(e) => setLocationFilter(e.currentTarget.value)} />
                    </div>
                    <div className={uiStyles.vaFilterRowRight}>
                      <div className={uiStyles.essentialsViewToggle}>
                        <Button variant="subtle" className={uiStyles.essentialsViewToggleBtn} data-active={viewMode === 'list' || undefined} onClick={() => setViewMode('list')}><IconList size={14} />{t('assets.listView')}</Button>
                        <Button variant="subtle" className={uiStyles.essentialsViewToggleBtn} data-active={viewMode === 'cards' || undefined} onClick={() => setViewMode('cards')}><IconLayoutGrid size={14} />{t('assets.cardView')}</Button>
                      </div>
                      <Button variant="subtle">{t('assets.export')}</Button>
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
                                  <div className={uiStyles.vaItemThumb}><IconPackage size={16} /></div>
                                  <div>
                                    <Link to="/items/$itemId" params={{ itemId: item.id }} className={uiStyles.vaItemName} style={{ color: 'inherit', textDecoration: 'none' }}>{item.name}</Link>
                                    {item.category && <span className={uiStyles.vaItemCategory}>{item.category}</span>}
                                  </div>
                                </div>
                              </td>
                              <td className={uiStyles.vaTableCell}>
                                <span style={{ fontSize: '0.82rem', color: 'var(--havit-muted)' }}>{locOptions.find((o) => o.value === item.location_id)?.label ?? '—'}</span>
                              </td>
                              <td className={uiStyles.vaTableCell}>
                                <span className={uiStyles.supplyStatusBadge[item.status === 'in_use' ? 'normal' : item.status === 'maintenance' ? 'low' : 'sufficient']}>{t(`status.${item.status}`, item.status)}</span>
                              </td>
                              <td className={uiStyles.vaTableCell}><WarrantyBadge ws={ws} t={t} /></td>
                              <td className={uiStyles.vaTableCell} style={{ fontSize: '0.82rem', color: 'var(--havit-muted)', fontVariantNumeric: 'tabular-nums' }}>{item.serial_number ?? '—'}</td>
                              <td className={uiStyles.vaTableCell} style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(item.purchase_price, item.purchase_currency)}</td>
                              <td className={uiStyles.vaTableCell}>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  <Button variant="quiet" leftSection={<IconEye size={12} />}>{t('assets.viewDetails')}</Button>
                                  <Button variant="subtle" className={uiStyles.iconButton}><IconDots size={14} /></Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredItems.length === 0 && (
                          <tr><td className={uiStyles.vaTableCell} colSpan={7} style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>{t('assets.noItems')}</td></tr>
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
                            <div className={uiStyles.vaItemThumb}><IconPackage size={18} /></div>
                            <div className={uiStyles.vaMobileCardMeta}>
                              <Link to="/items/$itemId" params={{ itemId: item.id }} className={uiStyles.vaItemName} style={{ color: 'inherit', textDecoration: 'none' }}>{item.name}</Link>
                              <div className={uiStyles.vaMobileCardBadges}>
                                {item.category && <span className={uiStyles.vaPlatformBadge}>[{item.category}]</span>}
                                {item.serial_number && <span style={{ fontSize: '0.72rem', color: 'var(--havit-muted)' }}>{item.serial_number}</span>}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--havit-muted)' }}>{locOptions.find((o) => o.value === item.location_id)?.label ?? '—'}</div>
                            <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(item.purchase_price, item.purchase_currency)}</div>
                          </div>
                          <div className={uiStyles.vaMobileCardBadges}><WarrantyBadge ws={ws} t={t} /></div>
                        </div>
                      );
                    })}
                    {filteredItems.length === 0 && <div style={{ textAlign: 'center', color: 'var(--havit-muted)', padding: '2rem' }}>{t('assets.noItems')}</div>}
                  </div>
                )}

                {filteredItems.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', borderTop: '1px solid var(--havit-line-soft)', fontSize: '0.82rem', color: 'var(--havit-muted)' }}>
                    <span>共 {filteredItems.length} 项</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Button variant="subtle" className={uiStyles.iconButton}>&lt;</Button>
                      <Button variant="subtle" className={uiStyles.iconButton} style={{ background: 'var(--havit-accent-soft)', color: 'var(--havit-accent-ink)' }}>1</Button>
                      <Button variant="subtle" className={uiStyles.iconButton}>&gt;</Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className={uiStyles.essentialsSidebar}>
              <Card className="surface-card">
                <div className={uiStyles.sectionHead}><h3 className={uiStyles.sectionTitle}>{t('assets.quickActions')}</h3></div>
                <div className={uiStyles.sectionBodyTight}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <QuickAction icon={IconPlus} title={t('assets.addAsset')} hint={t('assets.addAssetHint')} />
                    <QuickAction icon={IconPrinter} title={t('assets.printQR')} hint={t('assets.printQRHint')} />
                    <QuickAction icon={IconQrcode} title={t('assets.locationScan')} hint={t('assets.locationScanHint')} />
                  </div>
                </div>
              </Card>

              <Card className="surface-card">
                <div className={uiStyles.sectionHead}><h3 className={uiStyles.sectionTitle}>{t('assets.warrantyAlerts')}</h3></div>
                <div>
                  {warrantyAlerts.length === 0 ? (
                    <div style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--havit-muted)', fontSize: '0.82rem' }}>{t('assets.noWarrantyInfo')}</div>
                  ) : warrantyAlerts.map((item) => {
                    const ws = getWarrantyStatus(item);
                    return (
                      <div className={uiStyles.essentialsReminderItem} key={item.id}>
                        <div className={ws === 'expired' ? uiStyles.essentialsReminderDotWarn : uiStyles.essentialsReminderDot} />
                        <div className={uiStyles.essentialsReminderMeta}>
                          <span className={uiStyles.essentialsReminderTitle}>{item.name}</span>
                          <span className={uiStyles.essentialsReminderSub}>
                            {ws === 'expired' ? t('assets.warrantyExpired') : t('assets.warrantyExpiringSoon')}
                            {item.warranty_expires_at ? ` · ${formatDate(item.warranty_expires_at)}` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="surface-card">
                <div className={uiStyles.sectionHead}><h3 className={uiStyles.sectionTitle}>{t('assets.locationBreakdown')}</h3></div>
                <div>
                  {locationBreakdown.length === 0 ? (
                    <div style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--havit-muted)', fontSize: '0.82rem' }}>—</div>
                  ) : locationBreakdown.map((loc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.5rem', borderBottom: i < locationBreakdown.length - 1 ? '1px solid var(--havit-line-soft)' : 'none' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--havit-text)' }}>{loc.name}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--havit-muted)' }}>{loc.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      <Dialog open={opened} onClose={() => setOpened(false)} title={t('assets.create')}>
        <Stack>
          <TextField label={t('items.name')} required value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} />
          <TextField label={t('items.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.currentTarget.value })} />
          <TreeSelectField label={t('assets.location')} tree={locData?.tree ?? []} placeholder={t('items.selectLocation')} required value={form.location_id} onChange={(v) => setForm({ ...form, location_id: v })} />
          <TextField label={t('assets.serialNumberLabel')} value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.currentTarget.value })} />
          <DatePickerField label={t('assets.warrantyExpiry')} value={form.warranty_expires_at} onChange={(v) => setForm({ ...form, warranty_expires_at: v })} />
          <TextField label={t('assets.warrantyContact')} value={form.warranty_contact} onChange={(e) => setForm({ ...form, warranty_contact: e.currentTarget.value })} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <TextField label={t('assets.purchasePrice')} type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.currentTarget.value })} style={{ flex: 1 }} />
            <SelectField label={t('items.currency')} options={[{ value: 'CNY', label: '¥ CNY' }, { value: 'USD', label: '$ USD' }]} value={form.purchase_currency} onChange={(e) => setForm({ ...form, purchase_currency: e.currentTarget.value })} />
          </div>
          <TextareaField label={t('items.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.currentTarget.value })} />
          <div className={uiStyles.formActions}>
            <Button variant="quiet" onClick={() => setOpened(false)}>{t('common.cancel')}</Button>
            <Button disabled={!form.name || !form.location_id || !isOnline || create.isPending} title={!isOnline ? t('assets.offlineWarning') : undefined} onClick={() => create.mutate()}>
              {create.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </Stack>
  );
}

/* ── sub-components ── */

function StatCard({ icon: Icon, tone, label, value, note }: { icon: any; tone: 'blue' | 'green' | 'orange' | 'gray'; label: string; value: number; note: string }) {
  return (
    <div className={uiStyles.essentialsStatCard}>
      <div className={uiStyles.essentialsStatIcon[tone]}><Icon size={20} /></div>
      <div className={uiStyles.essentialsStatMeta}>
        <span className={uiStyles.essentialsStatLabel}>{label}</span>
        <strong className={uiStyles.essentialsStatValue}>{value}</strong>
        <span className={uiStyles.essentialsStatNote}>{note}</span>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) {
  return (
    <div className={uiStyles.essentialsQuickAction}>
      <div className={uiStyles.essentialsQuickActionIcon}><Icon size={16} /></div>
      <div className={uiStyles.essentialsQuickActionMeta}>
        <span className={uiStyles.essentialsQuickActionTitle}>{title}</span>
        <span className={uiStyles.essentialsQuickActionHint}>{hint}</span>
      </div>
      <IconChevronRight size={16} className={uiStyles.essentialsQuickActionArrow} />
    </div>
  );
}

function WarrantyBadge({ ws, t }: { ws: string; t: (key: string) => string }) {
  const bgMap: Record<string, string> = { active: 'var(--havit-success-soft)', expiring: 'var(--havit-warning-soft)', expired: 'var(--havit-danger-soft)' };
  const colorMap: Record<string, string> = { active: 'var(--havit-success)', expiring: 'var(--havit-warning)', expired: 'var(--havit-danger)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px',
      borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600,
      background: bgMap[ws] ?? 'var(--havit-line-soft)',
      color: colorMap[ws] ?? 'var(--havit-muted)',
    }}>
      {ws === 'active' && <IconShieldCheck size={10} />}
      {ws === 'expiring' && <IconAlertTriangle size={10} />}
      {t(`assets.warranty${ws.charAt(0).toUpperCase() + ws.slice(1)}`)}
    </span>
  );
}
