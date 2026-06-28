import { useEffect, useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  IconPackage, IconMapPin, IconShieldCheck, IconAlertTriangle,
  IconSearch, IconFilter, IconX,
} from '@tabler/icons-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Spinner } from '../../components/ui/spinner';
import { TextField } from '../../components/ui/text-field';
import { TreeSelectField } from '../../components/ui/tree-select-field';
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
  const [locationFilter, setLocationFilter] = useState('all');
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
    if (locationFilter !== 'all') items = items.filter((i) => i.location_id === locationFilter);
    return items;
  }, [allItems, activeTab, locationFilter, statusFilter]);

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
          <Input className={s.searchInput} placeholder={t('search.placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.currentTarget.value)} />
        </span>
        <Button type="button" variant="ghost" size="icon" className={s.filterBtn} onClick={() => setShowFilters(!showFilters)} aria-label={t('assets.status')}>
          <IconFilter size={16} />
        </Button>
      </div>

      {showFilters && (
        <div className={s.filterPanel}>
          <FilterSelect
            label={t('assets.status')}
            options={[{ value: 'all', label: t('assets.allStatuses') }, { value: 'in_use', label: t('assets.inUse') }, { value: 'stored', label: t('assets.stored') }, { value: 'maintenance', label: t('assets.maintenance') }]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterSelect
            label={t('assets.location')}
            options={[{ value: 'all', label: t('assets.allLocations') }, ...locOptions]}
            value={locationFilter}
            onChange={setLocationFilter}
          />
        </div>
      )}

      {/* Item count */}
      <div className={s.itemCount}>
        <span>{t('assets.overview')}</span>
        <strong>{filteredItems.length} {t('common.items')}</strong>
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
            <Button type="button" variant="ghost" size="icon" className={s.overlayClose} onClick={() => setShowCreate(false)} aria-label={t('common.close')}>
              <IconX size={18} />
            </Button>
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
  return (
    <div className={s.statTile}>
      <span className={`${s.statIcon} ${s.statIconTone[tone]}`}><Icon size={16} /></span>
      <span className={s.statValue}>{value}</span>
      <span className={s.statLabel}>{label}</span>
    </div>
  );
}

function MobileWarrantyBadge({ ws, t }: { ws: string; t: (key: string) => string }) {
  const tone = ws === 'active' || ws === 'expiring' || ws === 'expired' ? ws : 'none';
  return (
    <span className={s.warrantyBadge[tone]}>
      {t(`assets.warranty${ws.charAt(0).toUpperCase() + ws.slice(1)}`)}
    </span>
  );
}

function FilterSelect({ label, options, value, onChange }: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (typeof nextValue === 'string') onChange(nextValue);
      }}
      items={options}
    >
      <SelectTrigger className={s.filterSelectTrigger} size="sm" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
