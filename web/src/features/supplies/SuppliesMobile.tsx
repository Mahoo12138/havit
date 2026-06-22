import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle, IconCheck, IconMinus, IconPackage, IconPlus,
  IconShoppingBag, IconTrendingUp, IconX,
} from '@tabler/icons-react';
import { Button, Spinner, Tabs, TextField, TreeSelectField, useToast } from '../../components/ui';
import { itemsApi, locationsApi, suppliesExtendedApi, type Item, type Location } from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import * as s from '../assets/assetsMobile.css';

type SupplyTab = 'overview' | 'typeA' | 'typeB' | 'restock';

const DAY = 24 * 60 * 60;

function getStockStatus(item: Item): 'normal' | 'sufficient' | 'low' | 'below' {
  if (item.current_stock == null || item.min_stock_threshold == null) return 'normal';
  if (item.current_stock <= 0) return 'below';
  if (item.current_stock <= item.min_stock_threshold) return 'low';
  if (item.current_stock <= item.min_stock_threshold * 2) return 'sufficient';
  return 'normal';
}

export function SuppliesMobile() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SupplyTab>('overview');
  const [addOpen, setAddOpen] = useState(false);

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

  const locations = useQuery({ queryKey: ['locations'], queryFn: () => locationsApi.tree() });

  const items = supplies.data ?? [];
  const typeAItems = items.filter((i) => i.type === 'predictive_supplies');
  const typeBItems = items.filter((i) => i.type === 'tracked_spares');

  const warningItems = items.filter((it) => {
    if (it.type === 'tracked_spares') { const s = getStockStatus(it); return s === 'low' || s === 'below'; }
    return false;
  });

  const useOne = useMutation({
    mutationFn: (itemId: string) => suppliesExtendedApi.useOne(itemId),
    onSuccess: (next) => {
      qc.setQueryData(['item', next.id], next);
      qc.invalidateQueries({ queryKey: ['items', 'supplies'] });
      toast.show(t('supplies.stockAdjusted'));
    },
  });

  const tabItems = [
    { key: 'overview', label: t('supplies.overview') },
    { key: 'typeA', label: t('supplies.typeAEvent') },
    { key: 'typeB', label: t('supplies.typeBCount') },
    { key: 'restock', label: t('supplies.restockList') },
  ];

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'typeA': return typeAItems;
      case 'typeB': return typeBItems;
      case 'restock': return warningItems;
      default: return items;
    }
  }, [activeTab, items, typeAItems, typeBItems, warningItems]);

  if (supplies.isLoading) return <div className={s.page}><Spinner /></div>;

  return (
    <div className={s.page}>
      {/* KPI strip */}
      <div className={s.statsScroll}>
        <KpiTile icon={IconPackage} value={items.length} label={t('supplies.totalConsumables')} tone="teal" />
        <KpiTile icon={IconShoppingBag} value={warningItems.length} label={t('supplies.needRestock')} tone="red" />
        <KpiTile icon={IconAlertTriangle} value={items.length - warningItems.length} label={t('supplies.stockSufficient')} tone="green" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as SupplyTab)} tabs={tabItems} />

      {/* Item count */}
      <div style={{ fontSize: '0.78rem', color: 'var(--havit-muted)', fontWeight: 500 }}>
        {filteredItems.length} {t('common.items')}
      </div>

      {/* Card list */}
      {filteredItems.length === 0 ? (
        <div className={s.emptyState}>{t('supplies.noConsumables')}</div>
      ) : (
        <div className={s.cardList}>
          {filteredItems.map((item) => {
            const isTypeA = item.type === 'predictive_supplies';
            const stockStatus = getStockStatus(item);
            const stock = item.current_stock ?? 0;
            return (
              <div key={item.id} className={s.card} onClick={() => navigate({ to: '/supplies/$itemId', params: { itemId: item.id } })} style={{ cursor: 'pointer' }}>
                <div className={s.cardHeader}>
                  <span className={s.cardThumb}><IconPackage size={18} /></span>
                  <div className={s.cardMeta}>
                    <span className={s.cardName}>{item.name}</span>
                    <span className={s.cardSub}>
                      {isTypeA ? t('supplies.typeA') : t('supplies.typeB')}
                      {item.category ? ` · ${item.category}` : ''}
                    </span>
                  </div>
                  <span style={{
                    display: 'inline-flex', padding: '2px 8px', borderRadius: '999px',
                    fontSize: '0.72rem', fontWeight: 600,
                    background: stockStatus === 'low' || stockStatus === 'below'
                      ? 'var(--havit-danger-soft)' : stockStatus === 'sufficient'
                        ? 'var(--havit-success-soft)' : 'var(--havit-line-soft)',
                    color: stockStatus === 'low' || stockStatus === 'below'
                      ? 'var(--havit-danger)' : stockStatus === 'sufficient'
                        ? 'var(--havit-success)' : 'var(--havit-muted)',
                  }}>
                    {stock} {t('common.pieces')}
                  </span>
                </div>
                {!isTypeA && stock > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                    <Button variant="quiet" leftSection={<IconMinus size={12} />} onClick={() => useOne.mutate(item.id)} disabled={!isOnline || useOne.isPending}>
                      {t('supplies.useOneAction')}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button type="button" className={s.fab} onClick={() => setAddOpen(true)} disabled={!isOnline} aria-label={t('supplies.addItem')}>
        <IconPlus size={22} />
      </button>

      {/* Simplified create overlay */}
      {addOpen && (
        <MobileAddOverlay
          locationTree={locations.data?.tree ?? []}
          isOnline={isOnline}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

function KpiTile({ icon: Icon, value, label, tone }: { icon: any; value: number; label: string; tone: 'teal' | 'green' | 'orange' | 'red' }) {
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

function MobileAddOverlay({ locationTree, isOnline, onClose }: { locationTree: Location[]; isOnline: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [stock, setStock] = useState('1');

  const create = useMutation({
    mutationFn: () => itemsApi.create({ name: name.trim(), type: 'tracked_spares', location_id: locationId || undefined, current_stock: Number(stock) || 0, min_stock_threshold: 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['items', 'supplies'] }); toast.show(t('supplies.addSupplyCreated')); onClose(); },
    onError: (e: Error) => toast.show(t('supplies.actionFailed', { error: e.message })),
  });

  return (
    <div className={s.overlay}>
      <div className={s.overlayHeader}>
        <h3 className={s.overlayTitle}>{t('supplies.addSupplyTitle')}</h3>
        <button type="button" className={s.overlayClose} onClick={onClose}><IconX size={18} /></button>
      </div>
      <div className={s.overlayBody}>
        <TextField label={t('supplies.supplyName')} placeholder={t('supplies.supplyNamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required />
        <TreeSelectField label={t('supplies.supplyLocation')} placeholder={t('supplies.supplyLocationPlaceholder')} tree={locationTree} value={locationId} onChange={setLocationId} />
        <TextField label={t('supplies.initialStock')} type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
        <div className={s.overlayActions}>
          <Button variant="quiet" onClick={onClose}>{t('supplies.cancel')}</Button>
          <Button disabled={!isOnline || !name.trim() || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? t('common.loading') : t('supplies.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
