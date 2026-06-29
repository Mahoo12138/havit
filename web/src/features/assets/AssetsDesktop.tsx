import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  IconArchive,
  IconAlertTriangle,
  IconChevronRight,
  IconDots,
  IconDownload,
  IconEye,
  IconLayoutGrid,
  IconList,
  IconMapPin,
  IconPackage,
  IconPlus,
  IconPrinter,
  IconQrcode,
  IconSearch,
  IconShieldCheck,
  type TablerIcon,
} from '@tabler/icons-react';
import { Button } from '../../components/ui/button';
import { ButtonGroup } from '../../components/ui/button-group';
import { Card } from '../../components/ui/card';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { Dialog } from '../../components/ui/dialog-compat';
import { Input } from '../../components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { TextareaField } from '../../components/ui/textarea-field';
import { TextField } from '../../components/ui/text-field';
import { TreeSelectField } from '../../components/ui/tree-select-field';
import { CategoryTabs } from '../../features/categories/CategoryTabs';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { formatDate, formatPrice, getWarrantyStatus, useAssetsData } from './useAssetsData';
import * as s from './AssetsDesktop.css';

type AssetTab = string;
type StatTone = keyof typeof s.statIcon;

export function AssetsDesktop() {
  const data = useAssetsData();
  const {
    t,
    isLoading,
    allItems,
    locData,
    locOptions,
    categoryOptions,
    defaultCurrency,
    stats,
    warrantyAlerts,
    locationBreakdown,
    searchQuery,
    setSearchQuery,
    form,
    setForm,
    create,
    updateStatus,
    archive,
  } = data;
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [opened, setOpened] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeTab !== 'all') items = items.filter((item) => item.category === activeTab);
    if (statusFilter !== 'all') items = items.filter((item) => item.status === statusFilter);
    if (locationFilter !== 'all') items = items.filter((item) => item.location_id === locationFilter);
    return items;
  }, [activeTab, allItems, locationFilter, statusFilter]);

  function handleExport() {
    const headers = [
      t('assets.itemName'),
      t('assets.location'),
      t('assets.status'),
      t('assets.warranty'),
      t('assets.serialNumber'),
      t('assets.purchasePrice'),
    ];
    const rows = filteredItems.map((item) => [
      item.name,
      locOptions.find((option) => option.value === item.location_id)?.label ?? '',
      t(`status.${item.status}`, item.status),
      t(`assets.warranty${getWarrantyStatus(item).charAt(0).toUpperCase() + getWarrantyStatus(item).slice(1)}`),
      item.serial_number ?? '',
      formatPrice(item.purchase_price, item.purchase_currency),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assets-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.titleBlock}>
          <h2 className={s.title}>{t('assets.title')}</h2>
          <p className={s.subtitle}>{t('assets.description')}</p>
        </div>
        <div className={s.actions}>
          <Button
            variant="outline"
            leftSection={<IconPrinter size={14} />}
            onClick={() => navigate({ to: '/qr-print' })}
          >
            {t('assets.printQR')}
          </Button>
          <Button
            leftSection={<IconPlus size={14} />}
            onClick={() => setOpened(true)}
            disabled={!isOnline}
            title={!isOnline ? t('assets.offlineWarning') : undefined}
          >
            {t('assets.create')}
          </Button>
        </div>
      </header>

      <CategoryTabs rootType="physical" value={activeTab} onChange={(value) => setActiveTab(value)} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <section className={s.statsGrid} aria-label={t('assets.overview')}>
            <StatCard icon={IconPackage} tone="blue" label={t('assets.totalAssets')} value={stats.total} note={t('assets.totalAssetsHint')} />
            <StatCard icon={IconMapPin} tone="green" label={t('assets.inUseCount')} value={stats.inUse} note={t('assets.inUseCountHint')} />
            <StatCard icon={IconShieldCheck} tone="orange" label={t('assets.underWarranty')} value={stats.warrantyActive} note={t('assets.underWarrantyHint')} />
            <StatCard icon={IconAlertTriangle} tone="red" label={t('assets.needsAttention')} value={stats.warrantyExpiring} note={t('assets.needsAttentionHint')} />
          </section>

          <section className={s.bodyGrid}>
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
                    label={t('assets.status')}
                    options={[
                      { value: 'all', label: t('assets.allStatuses') },
                      { value: 'in_stock', label: t('status.in_stock') },
                      { value: 'in_use', label: t('assets.inUse') },
                      { value: 'idle', label: t('status.idle') },
                      { value: 'borrowed', label: t('status.borrowed') },
                    ]}
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
                <div className={s.toolbarRight}>
                  <ButtonGroup aria-label={t('assets.cardView')}>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      data-active={viewMode === 'list' || undefined}
                      onClick={() => setViewMode('list')}
                      aria-label={t('assets.listView')}
                    >
                      <IconList size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      data-active={viewMode === 'cards' || undefined}
                      onClick={() => setViewMode('cards')}
                      aria-label={t('assets.cardView')}
                    >
                      <IconLayoutGrid size={14} />
                    </Button>
                  </ButtonGroup>
                  <Button
                    variant="outline"
                    size="sm"
                    leftSection={<IconDownload size={14} />}
                    onClick={handleExport}
                    disabled={filteredItems.length === 0}
                  >
                    {t('assets.export')}
                  </Button>
                </div>
              </div>

              {viewMode === 'list' ? (
                <AssetTable
                  items={filteredItems}
                  locOptions={locOptions}
                  t={t}
                  isOnline={isOnline}
                  updateStatus={updateStatus}
                  archive={archive}
                  onViewDetails={(itemId) => navigate({ to: '/items/$itemId', params: { itemId } })}
                />
              ) : (
                <AssetCards items={filteredItems} locOptions={locOptions} t={t} />
              )}

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

            <aside className={s.sideColumn}>
              <Card className={s.sideCard}>
                <h3 className={s.sideTitle}>{t('assets.quickActions')}</h3>
                <div className={s.sideList}>
                  <QuickAction icon={IconPlus} title={t('assets.addAsset')} hint={t('assets.addAssetHint')} onClick={() => setOpened(true)} />
                  <QuickAction icon={IconPrinter} title={t('assets.printQR')} hint={t('assets.printQRHint')} onClick={() => navigate({ to: '/qr-print' })} />
                  <QuickAction icon={IconQrcode} title={t('assets.locationScan')} hint={t('assets.locationScanHint')} onClick={() => navigate({ to: '/location-scan' })} />
                </div>
              </Card>

              <Card className={s.sideCard}>
                <h3 className={s.sideTitle}>{t('assets.warrantyAlerts')}</h3>
                <div className={s.sideList}>
                  {warrantyAlerts.length === 0 ? (
                    <div className={s.empty}>{t('assets.noWarrantyInfo')}</div>
                  ) : warrantyAlerts.map((item) => {
                    const ws = getWarrantyStatus(item);
                    return (
                      <div className={s.compactRow} key={item.id}>
                        <div className={s.compactMeta}>
                          <span className={s.compactTitle}>{item.name}</span>
                          <span className={s.compactSub}>
                            {ws === 'expired' ? t('assets.warrantyExpired') : t('assets.warrantyExpiringSoon')}
                            {item.warranty_expires_at ? ` · ${formatDate(item.warranty_expires_at)}` : ''}
                          </span>
                        </div>
                        <WarrantyBadge ws={ws} t={t} />
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className={`${s.sideCard} ${s.sideCardWide}`}>
                <div className={s.sideHeader}>
                  <h3 className={s.sideTitle}>{t('assets.locationBreakdown')}</h3>
                  <Link to="/locations" className={s.sideLink}>
                    {t('assets.viewLocations')}
                    <IconChevronRight size={14} />
                  </Link>
                </div>
                <div className={s.sideList}>
                  {locationBreakdown.length === 0 ? (
                    <div className={s.empty}>—</div>
                  ) : locationBreakdown.map((location, index) => (
                    <div className={s.compactRow} key={`${location.name}-${index}`}>
                      <span className={s.compactTitle}>{location.name}</span>
                      <span className={s.price}>{location.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          </section>
        </>
      )}

      <Dialog open={opened} onClose={() => setOpened(false)} title={t('assets.create')}>
        <div className={s.formGrid}>
          <TextField label={t('items.name')} required value={form.name} onChange={(event) => setForm({ ...form, name: event.currentTarget.value })} />
          <TreeSelectField label={t('assets.location')} tree={locData?.tree ?? []} placeholder={t('items.selectLocation')} required value={form.location_id} onChange={(value) => setForm({ ...form, location_id: value })} />
          <SelectField label={t('items.category')} placeholder={t('assets.selectCategory')} options={categoryOptions} value={form.category} onChange={(event) => setForm({ ...form, category: event.currentTarget.value })} />
          <SelectField
            label={t('items.status')}
            options={[
              { value: 'in_stock', label: t('status.in_stock') },
              { value: 'in_use', label: t('status.in_use') },
              { value: 'idle', label: t('status.idle') },
            ]}
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.currentTarget.value })}
          />
          <TextField label={t('assets.serialNumberLabel')} value={form.serial_number} onChange={(event) => setForm({ ...form, serial_number: event.currentTarget.value })} />
          <DatePickerField label={t('itemDetail.purchasedAt')} value={form.purchase_date} onChange={(value) => setForm({ ...form, purchase_date: value })} />
          <DatePickerField label={t('assets.warrantyExpiry')} value={form.warranty_expires_at} onChange={(value) => setForm({ ...form, warranty_expires_at: value })} />
          <TextField label={t('assets.purchasePriceWithCurrency', { currency: defaultCurrency })} type="number" value={form.purchase_price} onChange={(event) => setForm({ ...form, purchase_price: event.currentTarget.value })} />
          <div className={s.formWide}>
            <TextareaField label={t('assets.notes')} placeholder={t('assets.notesPlaceholder')} value={form.description} onChange={(event) => setForm({ ...form, description: event.currentTarget.value })} />
          </div>
          <div className={s.formActions}>
            <Button variant="outline" onClick={() => setOpened(false)}>{t('common.cancel')}</Button>
            <Button disabled={!form.name || !form.location_id || !isOnline || create.isPending} title={!isOnline ? t('assets.offlineWarning') : undefined} onClick={() => create.mutate(undefined, { onSuccess: () => setOpened(false) })}>
              {create.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function AssetTable({ items, locOptions, t, isOnline, updateStatus, archive, onViewDetails }: {
  items: ReturnType<typeof useAssetsData>['allItems'];
  locOptions: ReturnType<typeof useAssetsData>['locOptions'];
  t: ReturnType<typeof useAssetsData>['t'];
  isOnline: boolean;
  updateStatus: ReturnType<typeof useAssetsData>['updateStatus'];
  archive: ReturnType<typeof useAssetsData>['archive'];
  onViewDetails: (itemId: string) => void;
}) {
  return (
    <div className={s.tableScroll}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.tableHead}>{t('assets.itemName')}</th>
            <th className={s.tableHead}>{t('assets.location')}</th>
            <th className={s.tableHead}>{t('assets.status')}</th>
            <th className={s.tableHead}>{t('assets.warranty')}</th>
            <th className={s.tableHead}>{t('assets.serialNumber')}</th>
            <th className={s.tableHead}>{t('assets.purchasePrice')}</th>
            <th className={s.tableHead}>{t('assets.action')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const ws = getWarrantyStatus(item);
            return (
              <tr className={s.tableRow} key={item.id}>
                <td className={s.tableCell}>
                  <div className={s.itemInfo}>
                    <div className={s.itemThumb}><IconPackage size={16} /></div>
                    <div className={s.itemMeta}>
                      <Link to="/items/$itemId" params={{ itemId: item.id }} className={s.itemName}>{item.name}</Link>
                      <span className={s.itemSub}>{item.category ?? t('common.uncategorized')}</span>
                    </div>
                  </div>
                </td>
                <td className={`${s.tableCell} ${s.muted}`}>{locOptions.find((option) => option.value === item.location_id)?.label ?? '—'}</td>
                <td className={s.tableCell}><StatusBadge status={item.status} t={t} /></td>
                <td className={s.tableCell}><WarrantyBadge ws={ws} t={t} /></td>
                <td className={`${s.tableCell} ${s.muted} ${s.mono}`}>{item.serial_number ?? '—'}</td>
                <td className={`${s.tableCell} ${s.price}`}>{formatPrice(item.purchase_price, item.purchase_currency)}</td>
                <td className={s.tableCell}>
                  <div className={s.actionGroup}>
                    <AssetActionMenu
                      item={item}
                      t={t}
                      isOnline={isOnline}
                      updateStatus={updateStatus}
                      archive={archive}
                      onViewDetails={onViewDetails}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td className={s.tableCell} colSpan={7}>
                <div className={s.empty}>{t('assets.noItems')}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AssetActionMenu({ item, t, isOnline, updateStatus, archive, onViewDetails }: {
  item: ReturnType<typeof useAssetsData>['allItems'][number];
  t: ReturnType<typeof useAssetsData>['t'];
  isOnline: boolean;
  updateStatus: ReturnType<typeof useAssetsData>['updateStatus'];
  archive: ReturnType<typeof useAssetsData>['archive'];
  onViewDetails: (itemId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const busy = updateStatus.isPending || archive.isPending;

  function changeStatus(status: string) {
    updateStatus.mutate({ id: item.id, status }, { onSuccess: () => setOpen(false) });
  }

  function handleArchive() {
    if (!window.confirm(t('assets.confirmArchive', { name: item.name }))) return;
    archive.mutate(item.id, { onSuccess: () => setOpen(false) });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={s.iconMenuButton} aria-label={t('assets.action')}>
        <IconDots size={14} />
      </PopoverTrigger>
      <PopoverContent className={s.actionMenu} align="end" sideOffset={6}>
        <button type="button" className={s.actionItem} onClick={() => { onViewDetails(item.id); setOpen(false); }}>
          <IconEye size={14} />
          <span>{t('assets.viewDetails')}</span>
        </button>
        {[
          { value: 'in_stock', label: t('status.in_stock') },
          { value: 'in_use', label: t('status.in_use') },
          { value: 'idle', label: t('status.idle') },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            className={s.actionItem}
            onClick={() => changeStatus(option.value)}
            disabled={!isOnline || busy || item.status === option.value}
          >
            <span className={s.actionDot} />
            <span>{t('assets.markAs', { status: option.label })}</span>
          </button>
        ))}
        <button
          type="button"
          className={`${s.actionItem} ${s.actionDanger}`}
          onClick={handleArchive}
          disabled={!isOnline || busy}
        >
          <IconArchive size={14} />
          <span>{t('items.archive')}</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}

function AssetCards({ items, locOptions, t }: {
  items: ReturnType<typeof useAssetsData>['allItems'];
  locOptions: ReturnType<typeof useAssetsData>['locOptions'];
  t: ReturnType<typeof useAssetsData>['t'];
}) {
  if (items.length === 0) return <div className={s.empty}>{t('assets.noItems')}</div>;

  return (
    <div className={s.cardsGrid}>
      {items.map((item) => {
        const ws = getWarrantyStatus(item);
        return (
          <article className={s.assetCard} key={item.id}>
            <div className={s.cardHeader}>
              <div className={s.itemThumb}><IconPackage size={18} /></div>
              <div className={s.itemMeta}>
                <Link to="/items/$itemId" params={{ itemId: item.id }} className={s.itemName}>{item.name}</Link>
                <span className={s.itemSub}>{item.category ?? t('common.uncategorized')}</span>
              </div>
            </div>
            <div className={s.compactRow}>
              <span className={s.compactSub}>{locOptions.find((option) => option.value === item.location_id)?.label ?? '—'}</span>
              <StatusBadge status={item.status} t={t} />
            </div>
            <div className={s.cardFooter}>
              <WarrantyBadge ws={ws} t={t} />
              <span className={s.price}>{formatPrice(item.purchase_price, item.purchase_currency)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value, note }: {
  icon: TablerIcon;
  tone: StatTone;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className={s.statCard}>
      <div className={s.statMeta}>
        <span className={s.statLabel}>{label}</span>
        <strong className={s.statValue}>{value}</strong>
        <span className={s.statNote}>{note}</span>
      </div>
      <span className={s.statIcon[tone]}><Icon size={18} /></span>
    </article>
  );
}

function QuickAction({ icon: Icon, title, hint, onClick }: {
  icon: TablerIcon;
  title: string;
  hint: string;
  onClick?: () => void;
}) {
  return (
    <Button type="button" variant="ghost" className={s.quickAction} onClick={onClick}>
      <span className={s.quickIcon}><Icon size={15} /></span>
      <span className={s.quickMeta}>
        <span className={s.quickTitle}>{title}</span>
        <span className={s.quickHint}>{hint}</span>
      </span>
      <IconChevronRight size={15} className={s.muted} />
    </Button>
  );
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useAssetsData>['t'] }) {
  const tone = status === 'in_use' ? 'success' : status === 'maintenance' ? 'warning' : 'neutral';
  return <span className={s.badge[tone]}>{t(`status.${status}`, status)}</span>;
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

function WarrantyBadge({ ws, t }: { ws: string; t: ReturnType<typeof useAssetsData>['t'] }) {
  const tone = ws === 'active' ? 'success' : ws === 'expiring' ? 'warning' : ws === 'expired' ? 'danger' : 'neutral';
  return (
    <span className={s.badge[tone]}>
      {ws === 'active' && <IconShieldCheck size={10} />}
      {ws === 'expiring' && <IconAlertTriangle size={10} />}
      {t(`assets.warranty${ws.charAt(0).toUpperCase() + ws.slice(1)}`)}
    </span>
  );
}

function csvEscape(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
