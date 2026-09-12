import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconBriefcase,
  IconChevronRight,
  IconClock,
  IconDots,
  IconEye,
  IconHome,
  IconLayoutGrid,
  IconList,
  IconPackage,
  IconPlus,
  IconRun,
  IconSearch,
  type TablerIcon,
} from '@tabler/icons-react';
import { Stack } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { ButtonGroup } from '../../components/ui/button-group';
import { Card } from '../../components/ui/card';
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
import { Spinner } from '../../components/ui/spinner';
import { TabsNav } from '../../components/ui/tabs-nav';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import {
  essentialsBulkApi,
  itemsApi,
  locationsApi,
  suppliesExtendedApi,
  type Item,
} from '../../api/client';
import { useDevice } from '../../lib/device';
import { LocationPickerField } from '../locations/LocationPickerField';
import { DepartureList } from './DepartureList';
import { DynamicNodes } from './DynamicNodes';
import { ReturnLog } from './ReturnLog';
import {
  flattenLocations,
  formatRelative,
  getStatusLabel,
  getStatusType,
  STATUS_TONE,
  type StatusType,
} from './shared';
import * as s from './EssentialsDesktop.css';

type ViewMode = 'list' | 'cards';
type EssentialsTab = string;

function DonutChart({
  segments,
  total,
  size = 104,
  strokeWidth = 16,
}: {
  segments: Array<{ value: number; color: string }>;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  if (total === 0) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulated = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: '0 0 auto' }}>
      {segments.map((seg, i) => {
        if (seg.value <= 0) return null;
        const percent = seg.value / total;
        const dashLength = circumference * percent;
        const dashOffset = circumference * accumulated;
        accumulated += percent;

        return (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={-dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        );
      })}
      <text
        x={center}
        y={center + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--havit-ink)"
        fontSize="22"
        fontWeight="700"
        fontFamily="var(--havit-font-serif)"
      >
        {total}
      </text>
    </svg>
  );
}

export function EssentialsDesktop() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const device = useDevice();

  const [activeTab, setActiveTab] = useState<EssentialsTab>('myEssentials');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpened, setCreateOpened] = useState(false);
  const [packOpened, setPackOpened] = useState(false);
  const [form, setForm] = useState({ name: '', home_base_location_id: '' });
  const [packLocationId, setPackLocationId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'essentials'],
    queryFn: () => itemsApi.list({ type: 'essentials' }),
  });

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const invalidateEssentials = () =>
    queryClient.invalidateQueries({ queryKey: ['items', 'essentials'] });

  const returnHome = useMutation({
    mutationFn: (id: string) => suppliesExtendedApi.returnHome(id),
    onSuccess: () => {
      toast.show(t('essentials.returnedHome'));
      invalidateEssentials();
    },
    onError: (error: Error) => toast.show(t('essentials.returnFailed', { error: error.message })),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, tag }: { id: string; tag: string }) =>
      suppliesExtendedApi.setEssentialsStatus(id, { current_status_tag: tag }),
    onSuccess: () => invalidateEssentials(),
  });

  const returnAll = useMutation({
    mutationFn: () => essentialsBulkApi.returnAll(),
    onSuccess: () => {
      toast.show(t('essentials.returnedHome'));
      invalidateEssentials();
    },
  });

  const packAll = useMutation({
    mutationFn: (locationId: string) => essentialsBulkApi.packAll(locationId),
    onSuccess: (res) => {
      toast.show(t('essentials.packedAll', { count: res.moved }));
      invalidateEssentials();
      setPackOpened(false);
      setPackLocationId('');
    },
  });

  const create = useMutation({
    mutationFn: () =>
      itemsApi.create({
        name: form.name,
        type: 'essentials',
        home_base_location_id: form.home_base_location_id || undefined,
      }),
    onSuccess: () => {
      toast.show(t('items.created'));
      invalidateEssentials();
      setForm({ name: '', home_base_location_id: '' });
      setCreateOpened(false);
    },
    onError: (error: Error) => toast.show(t('items.createFailed', { error: error.message })),
  });

  const items: Item[] = data?.items ?? [];
  const locOptions = useMemo(() => flattenLocations(locData?.tree), [locData?.tree]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = items;
    if (statusFilter !== 'all') result = result.filter((item) => getStatusType(item) === statusFilter);
    if (query) {
      result = result.filter((item) => {
        const haystack = [item.name, item.category].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }
    return result;
  }, [items, searchQuery, statusFilter]);

  const carryCount = items.filter((i) => getStatusType(i) === 'carry').length;
  const bagCount = items.filter((i) => getStatusType(i) === 'bag').length;
  const homeCount = items.filter((i) => getStatusType(i) === 'home').length;
  const awayCount = items.filter((i) => getStatusType(i) === 'away').length;
  const withYouCount = carryCount + bagCount;

  const pendingItems = useMemo(
    () => items.filter((i) => getStatusType(i) !== 'carry' && getStatusType(i) !== 'bag')
      .sort((a, b) => a.updated_at - b.updated_at)
      .slice(0, 5),
    [items],
  );

  const lastConfirmedTs = items.reduce((latest, i) => Math.max(latest, i.updated_at), 0);
  const overdueCount = items.filter((i) => Date.now() / 1000 - i.updated_at > 3 * 86400).length;

  const effectiveViewMode: ViewMode = device === 'mobile' ? 'cards' : viewMode;

  const tabItems = [
    { key: 'myEssentials', label: t('essentials.myEdc') },
    { key: 'departure', label: t('essentials.departureList') },
    { key: 'returnLog', label: t('essentials.returnLog') },
    { key: 'dynamicNodes', label: t('essentials.dynamicNodes') },
  ];

  const donutSegments = [
    { value: carryCount, color: 'var(--havit-success)' },
    { value: bagCount, color: 'var(--havit-info)' },
    { value: awayCount, color: 'var(--havit-warning)' },
    { value: homeCount, color: 'var(--havit-line)' },
  ];

  const donutLegend: Array<{ tone: keyof typeof s.donutLegendDot; label: string; count: number }> = [
    { tone: 'success', label: t('essentials.carry'), count: carryCount },
    { tone: 'info', label: t('essentials.travelBag'), count: bagCount },
    { tone: 'warning', label: t('essentials.notOnPersonShort'), count: awayCount },
    { tone: 'neutral', label: t('essentials.homeBaseShort'), count: homeCount },
  ];

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.titleBlock}>
          <h2 className={s.title}>{t('essentials.title')}</h2>
          <p className={s.subtitle}>{t('essentials.description')}</p>
        </div>
        <div className={s.actions}>
          <Button
            variant="outline"
            leftSection={<IconHome size={14} />}
            onClick={() => returnAll.mutate()}
            disabled={withYouCount === 0 || returnAll.isPending}
          >
            {t('essentials.returnAllAction')}
          </Button>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateOpened(true)}>
            {t('essentials.addItem')}
          </Button>
        </div>
      </header>

      <TabsNav value={activeTab} onChange={(value) => setActiveTab(value as EssentialsTab)} tabs={tabItems} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {activeTab === 'myEssentials' && (
            <>
          <section className={s.statsGrid} aria-label={t('essentials.title')}>
            <StatCard icon={IconBriefcase} tone="blue" label={t('essentials.totalItems')} value={items.length} note={t('essentials.baselineSet', { count: items.length })} />
            <StatCard icon={IconRun} tone="green" label={t('essentials.currentlyWithYou')} value={withYouCount} note={t('essentials.percentCarry', { percent: items.length > 0 ? Math.round((withYouCount / items.length) * 100) : 0 })} />
            <StatCard icon={IconAlertTriangle} tone="orange" label={t('essentials.notOnPerson')} value={homeCount + awayCount} note={t('essentials.pleaseCheckBaseline')} />
            <StatCard icon={IconClock} tone="gray" label={t('essentials.lastConfirmed')} value={formatRelative(t, lastConfirmedTs)} note={t('essentials.overdueConfirm', { count: overdueCount })} />
          </section>

          <section className={s.bodyGrid}>
            <Card className={s.ledgerCard} padded={false}>
              <div className={s.toolbar}>
                <div className={s.toolbarLeft}>
                  <span className={s.searchWrap}>
                    <IconSearch size={16} className={s.searchIcon} />
                    <Input
                      className={s.searchInput}
                      placeholder={t('essentials.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.currentTarget.value)}
                    />
                  </span>
                  <FilterSelect
                    label={t('items.status')}
                    options={[
                      { value: 'all', label: t('essentials.allStatus') },
                      { value: 'carry', label: t('essentials.carry') },
                      { value: 'bag', label: t('essentials.travelBag') },
                      { value: 'home', label: t('essentials.homeBaseShort') },
                      { value: 'away', label: t('essentials.notOnPersonShort') },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />
                </div>
                <div className={s.toolbarRight}>
                  <ButtonGroup aria-label={t('essentials.cardView')}>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      data-active={effectiveViewMode === 'list' || undefined}
                      onClick={() => setViewMode('list')}
                      aria-label={t('essentials.listView')}
                    >
                      <IconList size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      data-active={effectiveViewMode === 'cards' || undefined}
                      onClick={() => setViewMode('cards')}
                      aria-label={t('essentials.cardView')}
                    >
                      <IconLayoutGrid size={14} />
                    </Button>
                  </ButtonGroup>
                </div>
              </div>

              {effectiveViewMode === 'list' ? (
                <EssentialsTable
                  items={filteredItems}
                  locOptions={locOptions}
                  t={t}
                  returnHome={returnHome}
                  setStatus={setStatus}
                  onViewDetails={(itemId) => navigate({ to: '/items/$itemId', params: { itemId } })}
                />
              ) : (
                <EssentialsCards items={filteredItems} locOptions={locOptions} t={t} />
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
                <h3 className={s.sideTitle}>{t('essentials.quickActions')}</h3>
                <div className={s.sideList}>
                  <QuickAction icon={IconPlus} title={t('essentials.addItem')} hint={t('essentials.addHint')} onClick={() => setCreateOpened(true)} />
                  <QuickAction icon={IconBriefcase} title={t('essentials.packAll')} hint={t('essentials.packAllHint')} onClick={() => setPackOpened(true)} />
                  <QuickAction icon={IconHome} title={t('essentials.returnAllAction')} hint={t('essentials.returnAllActionHint')} onClick={() => returnAll.mutate()} />
                </div>
              </Card>

              <Card className={s.sideCard}>
                <h3 className={s.sideTitle}>{t('essentials.statusDistribution')}</h3>
                <div className={s.donutWrap}>
                  <DonutChart segments={donutSegments} total={items.length} />
                  <div className={s.donutLegend}>
                    {donutLegend.map((entry) => (
                      <div className={s.donutLegendItem} key={entry.tone}>
                        <span className={s.donutLegendDot[entry.tone]} />
                        <span>{entry.label}</span>
                        <span className={s.donutLegendValue}>
                          {entry.count} ({items.length > 0 ? Math.round((entry.count / items.length) * 100) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className={s.sideCard}>
                <h3 className={s.sideTitle}>{t('essentials.lastConfirmReminder')}</h3>
                <div className={s.sideList}>
                  {pendingItems.length === 0 ? (
                    <div className={s.empty}>—</div>
                  ) : pendingItems.map((item) => (
                    <div className={s.compactRow} key={item.id}>
                      <div className={s.compactMeta}>
                        <span className={s.compactTitle}>{item.name}</span>
                        <span className={s.compactSub}>{formatRelative(t, item.updated_at)}</span>
                      </div>
                      <span className={s.badge[STATUS_TONE[getStatusType(item)]]}>{getStatusLabel(t, item)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          </section>
            </>
          )}
          {activeTab === 'departure' && <DepartureList items={items} />}
          {activeTab === 'returnLog' && <ReturnLog />}
          {activeTab === 'dynamicNodes' && <DynamicNodes items={items} />}
        </>
      )}

      <Dialog open={createOpened} onClose={() => setCreateOpened(false)} title={t('essentials.addItem')}>
        <Stack>
          <TextField label={t('items.name')} required value={form.name} onChange={(event) => setForm({ ...form, name: event.currentTarget.value })} />
          <LocationPickerField
            label={t('essentials.homeBaseShort')}
            tree={locData?.tree}
            placeholder={t('items.selectLocation')}
            value={form.home_base_location_id}
            onChange={(value) => setForm({ ...form, home_base_location_id: value })}
            includeVirtualLocations={false}
          />
          <div className={s.formActions}>
            <Button variant="outline" onClick={() => setCreateOpened(false)}>{t('common.cancel')}</Button>
            <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </Stack>
      </Dialog>

      <Dialog open={packOpened} onClose={() => setPackOpened(false)} title={t('essentials.packAll')}>
        <Stack>
          <LocationPickerField
            label={t('essentials.packDestination')}
            tree={locData?.tree}
            placeholder={t('essentials.selectLocation')}
            value={packLocationId}
            onChange={setPackLocationId}
            includeVirtualLocations={false}
          />
          <div className={s.formActions}>
            <Button variant="outline" onClick={() => setPackOpened(false)}>{t('common.cancel')}</Button>
            <Button disabled={!packLocationId || packAll.isPending} onClick={() => packAll.mutate(packLocationId)}>
              {packAll.isPending ? t('common.loading') : t('essentials.packConfirm')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value, note }: {
  icon: TablerIcon;
  tone: keyof typeof s.statIcon;
  label: string;
  value: number | string;
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

function EssentialsTable({ items, locOptions, t, returnHome, setStatus, onViewDetails }: {
  items: Item[];
  locOptions: Array<{ value: string; label: string }>;
  t: ReturnType<typeof useTranslation>['t'];
  returnHome: UseMutationResult<Item, Error, string>;
  setStatus: UseMutationResult<Item, Error, { id: string; tag: string }>;
  onViewDetails: (itemId: string) => void;
}) {
  return (
    <div className={s.tableScroll}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.tableHead}>{t('essentials.item')}</th>
            <th className={s.tableHead}>{t('essentials.homeBase')}</th>
            <th className={s.tableHead}>{t('essentials.currentStatus')}</th>
            <th className={s.tableHead}>{t('essentials.lastConfirmedCol')}</th>
            <th className={s.tableHead}>{t('essentials.action')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const statusType = getStatusType(item);
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
                <td className={`${s.tableCell} ${s.muted}`}>
                  {locOptions.find((option) => option.value === item.home_base_location_id)?.label ?? '—'}
                </td>
                <td className={s.tableCell}>
                  <span className={s.badge[STATUS_TONE[statusType]]}>{getStatusLabel(t, item)}</span>
                </td>
                <td className={`${s.tableCell} ${s.muted}`}>{formatRelative(t, item.updated_at)}</td>
                <td className={s.tableCell}>
                  <div className={s.actionGroup}>
                    <EssentialsActionMenu
                      item={item}
                      statusType={statusType}
                      t={t}
                      returnHome={returnHome}
                      setStatus={setStatus}
                      onViewDetails={onViewDetails}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td className={s.tableCell} colSpan={5}>
                <div className={s.empty}>{t('essentials.noEdc')}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EssentialsActionMenu({ item, statusType, t, returnHome, setStatus, onViewDetails }: {
  item: Item;
  statusType: StatusType;
  t: ReturnType<typeof useTranslation>['t'];
  returnHome: UseMutationResult<Item, Error, string>;
  setStatus: UseMutationResult<Item, Error, { id: string; tag: string }>;
  onViewDetails: (itemId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const busy = returnHome.isPending || setStatus.isPending;

  function changeStatus(tag: string) {
    setStatus.mutate({ id: item.id, tag }, { onSuccess: () => setOpen(false) });
  }

  function handleReturnHome() {
    returnHome.mutate(item.id, { onSuccess: () => setOpen(false) });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={s.iconMenuButton} aria-label={t('essentials.action')}>
        <IconDots size={14} />
      </PopoverTrigger>
      <PopoverContent className={s.actionMenu} align="end" sideOffset={6}>
        <button type="button" className={s.actionItem} onClick={() => { onViewDetails(item.id); setOpen(false); }}>
          <IconEye size={14} />
          <span>{t('essentials.viewDetails')}</span>
        </button>
        <button
          type="button"
          className={s.actionItem}
          onClick={() => changeStatus('carry')}
          disabled={busy || statusType === 'carry'}
        >
          <span className={s.actionDot} />
          <span>{t('essentials.markAs', { status: t('essentials.carry') })}</span>
        </button>
        <button
          type="button"
          className={s.actionItem}
          onClick={() => changeStatus('travel_bag')}
          disabled={busy || statusType === 'bag'}
        >
          <span className={s.actionDot} />
          <span>{t('essentials.markAs', { status: t('essentials.travelBag') })}</span>
        </button>
        <button
          type="button"
          className={s.actionItem}
          onClick={handleReturnHome}
          disabled={busy || statusType === 'home' || !item.home_base_location_id}
        >
          <IconHome size={14} />
          <span>{t('essentials.returnHome')}</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}

function EssentialsCards({ items, locOptions, t }: {
  items: Item[];
  locOptions: Array<{ value: string; label: string }>;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  if (items.length === 0) return <div className={s.empty}>{t('essentials.noEdc')}</div>;

  return (
    <div className={s.cardsGrid}>
      {items.map((item) => {
        const statusType = getStatusType(item);
        return (
          <article className={s.essCard} key={item.id}>
            <div className={s.cardHeader}>
              <div className={s.itemThumb}><IconPackage size={18} /></div>
              <div className={s.itemMeta}>
                <Link to="/items/$itemId" params={{ itemId: item.id }} className={s.itemName}>{item.name}</Link>
                <span className={s.itemSub}>{item.category ?? t('common.uncategorized')}</span>
              </div>
            </div>
            <div className={s.cardFooter}>
              <span className={s.compactSub}>
                {locOptions.find((option) => option.value === item.home_base_location_id)?.label ?? '—'}
              </span>
              <span className={s.badge[STATUS_TONE[statusType]]}>{getStatusLabel(t, item)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
