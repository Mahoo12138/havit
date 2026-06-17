import { useEffect, useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  IconPackage, IconMapPin, IconShieldCheck, IconAlertTriangle,
  IconSearch, IconFilter, IconX,
} from '@tabler/icons-react';
import { SelectField, Spinner, TextField, TreeSelectField } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { CategoryTabs } from '../../features/categories/CategoryTabs';
import { useAssetsData, getWarrantyStatus, formatPrice } from './useAssetsData';
import * as s from './assetsMobile.css';

type AssetTab = string;

export function AssetsMobile() {
  const data = useAssetsData();
  const { t, isLoading, allItems, locData, locOptions, stats, searchQuery, setSearchQuery, form, setForm, create } = data;
  const isOnline = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    function handlePrimaryAction(event: Event) {
      const custom = event as CustomEvent<{ path: string; handled: boolean }>;
      if (!custom.detail?.path.startsWith('/assets')) return;
      custom.detail.handled = true;
      if (isOnline) setShowCreate(true);
    }

    window.addEventListener('havit:mobile-primary-action', handlePrimaryAction);
    return () => window.removeEventListener('havit:mobile-primary-action', handlePrimaryAction);
  }, [isOnline]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeTab !== 'all') items = items.filter((i) => i.category === activeTab);
    if (statusFilter !== 'all') items = items.filter((i) => i.status === statusFilter);
    return items;
  }, [allItems, activeTab, statusFilter]);

  if (isLoading) return <div className={s.page}><Spinner /></div>;

  return (
    <div className={s.page}>
      {/* Stats horizontal scroll */}
      <div className={s.statsScroll}>
        <StatTile icon={IconPackage} value={stats.total} label={t('assets.totalAssets')} tone="teal" />
        <StatTile icon={IconMapPin} value={stats.inUse} label={t('assets.inUseCount')} tone="green" />
        <StatTile icon={IconShieldCheck} value={stats.warrantyActive} label={t('assets.underWarranty')} tone="orange" />
        <StatTile icon={IconAlertTriangle} value={stats.warrantyExpiring} label={t('assets.needsAttention')} tone="red" />
      </div>

      {/* Category tabs */}
      <CategoryTabs rootType="physical" value={activeTab} onChange={(v) => setActiveTab(v)} />

      {/* Search + filter toggle */}
      <div className={s.filterBar}>
        <span className={s.searchWrap}>
          <IconSearch size={16} className={s.searchIcon} />
          <input className={s.searchInput} placeholder={t('search.placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.currentTarget.value)} />
        </span>
        <button type="button" className={s.filterBtn} onClick={() => setShowFilters(!showFilters)} aria-label={t('assets.status')}>
          <IconFilter size={16} />
        </button>
      </div>

      {showFilters && (
        <div className={s.filterPanel}>
          <SelectField
            label={t('assets.status')}
            options={[{ value: 'all', label: t('assets.allStatuses') }, { value: 'in_use', label: t('assets.inUse') }, { value: 'stored', label: t('assets.stored') }, { value: 'maintenance', label: t('assets.maintenance') }]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.currentTarget.value)}
          />
        </div>
      )}

      {/* Item count */}
      <div className={s.itemCount}>
        {filteredItems.length} {t('common.items')}
      </div>

      {/* Card list */}
      {filteredItems.length === 0 ? (
        <div className={s.emptyState}>{t('assets.noItems')}</div>
      ) : (
        <div className={s.cardList}>
          {filteredItems.map((item) => {
            const ws = getWarrantyStatus(item);
            return (
              <Link key={item.id} to="/items/$itemId" params={{ itemId: item.id }} className={s.card}>
                <div className={s.cardHeader}>
                  <span className={s.cardThumb}><IconPackage size={18} /></span>
                  <div className={s.cardMeta}>
                    <span className={s.cardName}>{item.name}</span>
                    <span className={s.cardSub}>
                      {item.category ?? t('common.uncategorized')}
                      {item.serial_number ? ` · ${item.serial_number}` : ''}
                    </span>
                  </div>
                  <span className={s.cardPrice}>{formatPrice(item.purchase_price, item.purchase_currency)}</span>
                </div>
                <div className={s.cardFooter}>
                  <span className={s.cardLocation}>
                    <IconMapPin size={12} />
                    {locOptions.find((o) => o.value === item.location_id)?.label ?? '—'}
                  </span>
                  <MobileWarrantyBadge ws={ws} t={t} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create overlay */}
      {showCreate && (
        <div className={s.overlay}>
          <div className={s.overlayHeader}>
            <h3 className={s.overlayTitle}>{t('assets.create')}</h3>
            <button type="button" className={s.overlayClose} onClick={() => setShowCreate(false)} aria-label={t('common.close')}>
              <IconX size={18} />
            </button>
          </div>
          <div className={s.overlayBody}>
            <TextField label={t('items.name')} required value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} />
            <TextField label={t('items.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.currentTarget.value })} />
            <TreeSelectField label={t('assets.location')} tree={locData?.tree ?? []} placeholder={t('items.selectLocation')} required value={form.location_id} onChange={(v) => setForm({ ...form, location_id: v })} />
            <TextField label={t('assets.serialNumberLabel')} value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.currentTarget.value })} />
            <TextField label={t('assets.purchasePrice')} type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.currentTarget.value })} />
            <div className={s.overlayActions}>
              <Button variant="quiet" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
              <Button disabled={!form.name || !form.location_id || !isOnline || create.isPending} onClick={() => { create.mutate(); setShowCreate(false); }}>
                {create.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, value, label, tone }: { icon: any; value: number; label: string; tone: 'teal' | 'green' | 'orange' | 'red' }) {
  const bgMap = { teal: 'var(--havit-accent-soft)', green: 'var(--havit-success-soft)', orange: 'var(--havit-warning-soft)', red: 'var(--havit-danger-soft)' };
  const colorMap = { teal: 'var(--havit-accent-ink)', green: 'var(--havit-success)', orange: 'var(--havit-warning)', red: 'var(--havit-danger)' };
  return (
    <div className={s.statTile}>
      <span className={s.statIcon} style={{ background: bgMap[tone], color: colorMap[tone] }}><Icon size={16} /></span>
      <span className={s.statValue}>{value}</span>
      <span className={s.statLabel}>{label}</span>
    </div>
  );
}

function MobileWarrantyBadge({ ws, t }: { ws: string; t: (key: string) => string }) {
  const bgMap: Record<string, string> = { active: 'var(--havit-success-soft)', expiring: 'var(--havit-warning-soft)', expired: 'var(--havit-danger-soft)' };
  const colorMap: Record<string, string> = { active: 'var(--havit-success)', expiring: 'var(--havit-warning)', expired: 'var(--havit-danger)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px',
      borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600,
      background: bgMap[ws] ?? 'var(--havit-line-soft)',
      color: colorMap[ws] ?? 'var(--havit-muted)',
    }}>
      {t(`assets.warranty${ws.charAt(0).toUpperCase() + ws.slice(1)}`)}
    </span>
  );
}
