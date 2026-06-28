import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconBook,
  IconBrandApple,
  IconBrandSteam,
  IconDots,
  IconDownload,
  IconEye,
  IconLayoutGrid,
  IconList,
  IconPackage,
  IconPlus,
  IconSearch,
  IconSettings,
  type TablerIcon,
} from '@tabler/icons-react';
import { Stack } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog-compat';
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
import { itemsApi, type Item, type VirtualAddonPurchase, type VirtualCredential } from '../../api/client';
import { useDevice } from '../../lib/device';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { CategoryTabs } from '../categories/CategoryTabs';
import { useToast } from '../../components/ui/use-toast';
import * as s from './VirtualAssetsDesktop.css';

type VaTab = string;
type KpiTone = keyof typeof s.kpiIcon;

interface VaItem extends Item {
  credentials?: VirtualCredential[];
  addons?: VirtualAddonPurchase[];
}

function formatPrice(price?: number, currency?: string): string {
  if (price == null) return '—';
  if (currency === 'CNY' || currency === '¥') return `¥${price}`;
  if (currency === 'USD' || currency === '$') return `$${price}`;
  return `${price} ${currency ?? ''}`;
}

function formatDate(ts?: number): string {
  if (!ts) return '—';
  const date = new Date(ts * 1000);
  return date.toISOString().split('T')[0];
}

function platformTone(platform?: string): keyof typeof s.badge {
  const value = (platform ?? '').toLowerCase();
  if (value.includes('steam') || value.includes('gog')) return 'blue';
  if (value.includes('apple') || value.includes('app store')) return 'neutral';
  if (value.includes('kindle') || value.includes('amazon')) return 'amber';
  return 'green';
}

export function VirtualAssetsDesktop() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const device = useDevice();
  const [activeTab, setActiveTab] = useState<VaTab>('all');
  const [opened, setOpened] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const effectiveViewMode = device === 'mobile' ? 'cards' : viewMode;

  const [form, setForm] = useState({
    name: '',
    platform: '',
    account: '',
    price: '',
    currency: 'CNY',
  });

  useEffect(() => {
    function handlePrimaryAction(event: Event) {
      const custom = event as CustomEvent<{ path: string; handled: boolean }>;
      if (!custom.detail?.path.startsWith('/virtual-assets')) return;
      custom.detail.handled = true;
      if (isOnline) setOpened(true);
    }

    window.addEventListener('havit:mobile-primary-action', handlePrimaryAction);
    return () => window.removeEventListener('havit:mobile-primary-action', handlePrimaryAction);
  }, [isOnline]);

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
    onError: (error: Error) => toast.show(t('items.createFailed', { error: error.message })),
  });

  const allItems: VaItem[] = data?.items ?? [];

  const categoryOptions = useMemo(() => {
    const categories = new Set(allItems.map((item) => item.category).filter(Boolean));
    return Array.from(categories).map((category) => ({ value: category as string, label: category as string }));
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let items = allItems;
    if (activeTab !== 'all') items = items.filter((item) => item.category === activeTab);
    if (statusFilter !== 'all') items = items.filter((item) => item.status === statusFilter);
    if (query) {
      items = items.filter((item) => {
        const haystack = [item.name, item.category, item.serial_number].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }
    return items;
  }, [activeTab, allItems, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = allItems.length;
    const totalValue = allItems.reduce((sum, item) => sum + (item.purchase_price ?? 0), 0);
    const inUseCount = allItems.filter((item) => item.status === 'in_use').length;
    const archivedCount = allItems.filter((item) => item.status === 'archived').length;
    const pendingCount = allItems.filter((item) => item.status === 'pending' || item.status === 'inactive').length;
    return { total, totalValue, inUseCount, archivedCount, pendingCount };
  }, [allItems]);

  const recentItems = filteredItems.slice(0, 3);

  return (
    <div className={s.page}>
      <header className={s.desktopHeader}>
        <div className={s.titleBlock}>
          <h2 className={s.title}>{t('virtualAssets.title')}</h2>
          <p className={s.subtitle}>{t('virtualAssets.description')}</p>
        </div>
        <div className={s.headerActions}>
          <Button variant="outline" leftSection={<IconSettings size={14} />}>{t('virtualAssets.settings')}</Button>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setOpened(true)} disabled={!isOnline}>
            {t('virtualAssets.create')}
          </Button>
        </div>
      </header>

      <CategoryTabs rootType="virtual" value={activeTab} onChange={(value) => setActiveTab(value)} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <section className={s.kpiGrid} aria-label={t('virtualAssets.assetOverview')}>
            <KpiTile icon={IconPackage} tone="blue" label={t('virtualAssets.totalAssets')} value={stats.total} note={t('virtualAssets.totalAssetsHint')} />
            <KpiTile icon={IconBrandSteam} tone="green" label={t('virtualAssets.inUse')} value={stats.inUseCount} note={t('virtualAssets.inUseHint')} />
            <KpiTile icon={IconBook} tone="teal" label={t('virtualAssets.archived')} value={stats.archivedCount} note={t('virtualAssets.archivedHint')} />
            <KpiTile icon={IconBrandApple} tone="orange" label={t('virtualAssets.pendingActivation')} value={stats.pendingCount} note={t('virtualAssets.pendingActivationHint')} />
          </section>

          <Card className={s.ledgerCard} padded={false}>
            <div className={s.toolbar}>
              <div className={s.toolbarLeft}>
                <span className={s.searchWrap}>
                  <IconSearch size={16} className={s.searchIcon} />
                  <Input
                    className={s.searchInput}
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.currentTarget.value)}
                  />
                </span>
                <FilterSelect
                  label={t('items.status')}
                  options={[
                    { value: 'all', label: t('virtualAssets.allStatus') },
                    { value: 'in_use', label: t('virtualAssets.inUse') },
                    { value: 'archived', label: t('virtualAssets.archived') },
                    { value: 'inactive', label: t('virtualAssets.pendingActivation') },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <FilterSelect
                  label={t('items.category')}
                  options={[{ value: 'all', label: t('virtualAssets.allCategories') }, ...categoryOptions]}
                  value={activeTab}
                  onChange={setActiveTab}
                />
              </div>
              <div className={s.toolbarRight}>
                <div className={s.viewToggle}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={s.viewToggleButton}
                    data-active={effectiveViewMode === 'list' || undefined}
                    onClick={() => setViewMode('list')}
                    aria-label={t('virtualAssets.listView')}
                  >
                    <IconList size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={s.viewToggleButton}
                    data-active={effectiveViewMode === 'cards' || undefined}
                    onClick={() => setViewMode('cards')}
                    aria-label={t('virtualAssets.calendarView')}
                  >
                    <IconLayoutGrid size={14} />
                  </Button>
                </div>
                <Button variant="outline" size="sm" leftSection={<IconDownload size={14} />}>{t('virtualAssets.export')}</Button>
              </div>
            </div>

            {effectiveViewMode === 'list' ? (
              <VirtualAssetTable items={filteredItems} t={t} />
            ) : (
              <VirtualAssetCards items={filteredItems} t={t} className={s.cardListDesktop} />
            )}
            <VirtualAssetCards items={filteredItems} t={t} className={s.cardList} />

            {filteredItems.length > 0 && (
              <div className={s.footerBar}>
                <span>共 {filteredItems.length} 项</span>
                <div className={s.pagination}>
                  <Button variant="ghost" size="icon-xs" aria-label="Previous page">&lt;</Button>
                  <Button variant="outline" size="icon-xs">1</Button>
                  <Button variant="ghost" size="icon-xs" aria-label="Next page">&gt;</Button>
                </div>
              </div>
            )}
          </Card>

          <section className={s.insightsGrid}>
            <Card className={s.insightCard}>
              <h3 className={s.insightTitle}>{t('virtualAssets.assetOverview')}</h3>
              <div className={s.insightSub}>{t('virtualAssets.noConversion')}</div>
              <div className={s.miniList}>
                <div className={s.miniRow}>
                  <span className={s.muted}>{t('virtualAssets.assetOverviewTotal')}</span>
                  <span className={s.price}>{stats.total}</span>
                  <span />
                </div>
                <div className={s.miniRow}>
                  <span className={s.muted}>{t('virtualAssets.assetOverviewValue')}</span>
                  <span className={s.price}>¥{stats.totalValue.toLocaleString()}</span>
                  <span className={s.badge.neutral}>CNY</span>
                </div>
                {recentItems.map((item) => (
                  <div className={s.miniRow} key={item.id}>
                    <span className={s.itemName}>{item.name}</span>
                    <span className={s.muted}>{formatDate(item.purchase_date)}</span>
                    <span className={s.price}>{formatPrice(item.purchase_price, item.purchase_currency)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className={s.insightCard}>
              <h3 className={s.insightTitle}>{t('virtualAssets.platformDistribution')}</h3>
              <div className={s.distribution}>
                <div className={s.donut}>
                  <div className={s.donutInner}><IconPackage size={20} /></div>
                </div>
                <div className={s.legend}>
                  <span className={s.legendItem}><span className={s.legendDot.blue} />Steam / GOG</span>
                  <span className={s.legendItem}><span className={s.legendDot.teal} />App Store</span>
                  <span className={s.legendItem}><span className={s.legendDot.amber} />PlayStation</span>
                  <span className={s.legendItem}><span className={s.legendDot.violet} />Other</span>
                </div>
              </div>
            </Card>
          </section>
        </>
      )}

      <Dialog open={opened} onClose={() => setOpened(false)} title={t('virtualAssets.create')}>
        <Stack>
          <TextField label={t('items.name')} required value={form.name} onChange={(event) => setForm({ ...form, name: event.currentTarget.value })} />
          <TextField label={t('virtualAssets.platformAccount')} value={form.platform} onChange={(event) => setForm({ ...form, platform: event.currentTarget.value })} />
          <div className={s.formActions}>
            <Button variant="outline" onClick={() => setOpened(false)}>{t('common.cancel')}</Button>
            <Button disabled={!form.name || !isOnline || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </div>
  );
}

function KpiTile({ icon: Icon, tone, label, value, note }: {
  icon: TablerIcon;
  tone: KpiTone;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className={s.kpiTile}>
      <div className={s.kpiMeta}>
        <span className={s.kpiLabel}>{label}</span>
        <strong className={s.kpiValue}>{value}</strong>
        <span className={s.kpiNote}>{note}</span>
      </div>
      <span className={s.kpiIcon[tone]}><Icon size={18} /></span>
    </article>
  );
}

function VirtualAssetTable({ items, t }: { items: VaItem[]; t: (key: string, params?: any) => string }) {
  return (
    <div className={s.tableScroll}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.tableHead}>{t('virtualAssets.itemName')}</th>
            <th className={s.tableHead}>{t('virtualAssets.platformAccount')}</th>
            <th className={s.tableHead}>{t('virtualAssets.purchaseDate')}</th>
            <th className={s.tableHead}>{t('virtualAssets.price')}</th>
            <th className={s.tableHead}>{t('virtualAssets.statusTags')}</th>
            <th className={s.tableHead}>{t('virtualAssets.action')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr className={s.tableRow} key={item.id}>
              <td className={s.tableCell}>
                <div className={s.itemInfo}>
                  <div className={s.itemThumb}><IconPackage size={16} /></div>
                  <div className={s.itemMeta}>
                    <Link to="/items/$itemId" params={{ itemId: item.id }} className={s.itemName}>{item.name}</Link>
                    <span className={s.itemSub}>{item.category ?? '—'}</span>
                  </div>
                </div>
              </td>
              <td className={s.tableCell}>
                <div className={s.itemMeta}>
                  <span className={s.badge[platformTone(item.category)]}>{item.category ?? '—'}</span>
                  <span className={s.itemSub}>{item.serial_number ?? '—'}</span>
                </div>
              </td>
              <td className={`${s.tableCell} ${s.muted}`}>{formatDate(item.purchase_date)}</td>
              <td className={`${s.tableCell} ${s.price}`}>{formatPrice(item.purchase_price, item.purchase_currency)}</td>
              <td className={s.tableCell}>
                <div className={s.badges}>
                  <span className={s.badge.blue}>{t('virtualAssets.multiDLC')}</span>
                  <span className={s.badge.amber}>{t('virtualAssets.steamGGOG')}</span>
                </div>
              </td>
              <td className={s.tableCell}>
                <div className={s.actionGroup}>
                  <Button variant="outline" size="sm" leftSection={<IconEye size={12} />}>{t('virtualAssets.viewDetails')}</Button>
                  <Button variant="ghost" size="icon-sm" aria-label={t('virtualAssets.action')}><IconDots size={14} /></Button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td className={s.tableCell} colSpan={6}>
                <div className={s.empty}>{t('virtualAssets.noItems')}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
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

function VirtualAssetCards({ items, t, className }: { items: VaItem[]; t: (key: string, params?: any) => string; className: string }) {
  if (items.length === 0) return <div className={`${className} ${s.empty}`}>{t('virtualAssets.noItems')}</div>;

  return (
    <div className={className}>
      {items.map((item) => (
        <Link key={item.id} to="/items/$itemId" params={{ itemId: item.id }} className={s.assetCard}>
          <div className={s.cardHeader}>
            <span className={s.itemThumb}><IconPackage size={18} /></span>
            <span className={s.itemMeta}>
              <span className={s.itemName}>{item.name}</span>
              <span className={s.itemSub}>{item.category ?? '—'}{item.serial_number ? ` · ${item.serial_number}` : ''}</span>
            </span>
            <span className={s.price}>{formatPrice(item.purchase_price, item.purchase_currency)}</span>
          </div>
          <div className={s.cardBody}>
            <span className={s.muted}>{formatDate(item.purchase_date)}</span>
            <span className={s.badges}>
              <span className={s.badge[platformTone(item.category)]}>{item.category ?? '—'}</span>
              <span className={s.badge.blue}>{t('virtualAssets.multiDLC')}</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
