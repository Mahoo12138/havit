import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconHome,
  IconPackage,
  IconList,
  IconLayoutGrid,
  IconChevronRight,
  IconAlertTriangle,
  IconClock,
  IconBriefcase,
  IconRun,
  IconCheck,
  IconPlus,
  IconCheckbox,
} from '@tabler/icons-react';
import {
  Button,
  Card,
  Dialog,
  SelectField,
  Spinner,
  Stack,
  StackTight,
  Tabs,
  uiStyles,
  useToast,
} from '../components/ui';
import { essentialsBulkApi, itemsApi, suppliesExtendedApi, locationsApi } from '../api/client';

export const Route = createFileRoute('/essentials')({
  component: EssentialsPage,
});

type ViewMode = 'list' | 'cards';
type EssentialsTab = 'myEssentials' | 'departure' | 'returnLog' | 'dynamicNodes';

interface Item {
  id: string;
  name: string;
  category?: string;
  type: string;
  status: string;
  location_id?: string;
  home_base_location_id?: string;
  current_status_tag?: string;
  tags?: Array<{ id: string; name: string; color?: string }>;
}

function getStatusType(item: Item): 'carry' | 'bag' | 'home' | 'away' {
  if (!item.home_base_location_id) return 'home';
  if (item.location_id === item.home_base_location_id) return 'home';
  if (item.current_status_tag === '@随身携带' || item.current_status_tag === 'carry') return 'carry';
  if (item.current_status_tag === '@通勤包' || item.current_status_tag === 'travel_bag') return 'bag';
  return 'away';
}

function getStatusLabel(t: ReturnType<typeof useTranslation>['t'], item: Item): string {
  const type = getStatusType(item);
  if (type === 'carry') return t('essentials.carry');
  if (type === 'bag') return t('essentials.travelBag');
  if (type === 'home') return t('essentials.homeBaseShort');
  return t('essentials.notOnPersonShort');
}

function DonutChart({
  segments,
  size = 120,
  strokeWidth = 20,
}: {
  segments: Array<{ value: number; color: string }>;
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulated = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
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
        y={center - 6}
        textAnchor="middle"
        fill="var(--havit-ink)"
        fontSize="22"
        fontWeight="700"
        fontFamily="var(--havit-font-sans)"
      >
        {total}
      </text>
      <text
        x={center}
        y={center + 14}
        textAnchor="middle"
        fill="var(--havit-muted)"
        fontSize="11"
        fontFamily="var(--havit-font-sans)"
      >
        总数
      </text>
    </svg>
  );
}

function EssentialsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [activeTab, setActiveTab] = useState<EssentialsTab>('myEssentials');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'essentials'],
    queryFn: () => itemsApi.list({ type: 'essentials' }),
  });

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const returnHomeMutation = useMutation({
    mutationFn: (id: string) => suppliesExtendedApi.returnHome(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items', 'essentials'] }),
  });

  const packAllMutation = useMutation({
    mutationFn: (locationId: string) => essentialsBulkApi.packAll(locationId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['items', 'essentials'] });
      setPackDialogOpen(false);
      toast.show(t('essentials.packedAll', { count: res.moved }));
    },
  });

  const items: Item[] = data?.items ?? [];

  const carryCount = items.filter((i) => getStatusType(i) === 'carry').length;
  const bagCount = items.filter((i) => getStatusType(i) === 'bag').length;
  const homeCount = items.filter((i) => getStatusType(i) === 'home').length;
  const awayCount = items.filter((i) => getStatusType(i) === 'away').length;

  const filteredItems =
    statusFilter === 'all'
      ? items
      : items.filter((i) => getStatusType(i) === statusFilter);

  const locationOptions: Array<{ value: string; label: string }> = [];
  if (locData?.tree) {
    const walk = (nodes: typeof locData.tree, depth = 0) => {
      for (const node of nodes) {
        locationOptions.push({ value: node.id, label: '  '.repeat(depth) + node.name });
        if (node.children) walk(node.children, depth + 1);
      }
    };
    walk(locData.tree);
  }

  const donutSegments = [
    { value: carryCount, color: 'var(--havit-accent)' },
    { value: bagCount, color: 'var(--havit-info)' },
    { value: homeCount + awayCount, color: 'var(--havit-line)' },
  ];

  const tabItems = [
    { key: 'myEssentials', label: t('essentials.myEdc') },
    { key: 'departure', label: t('essentials.departureList') },
    { key: 'returnLog', label: t('essentials.returnLog') },
    { key: 'dynamicNodes', label: t('essentials.dynamicNodes') },
  ];

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('essentials.title')}</h2>
          <p className="page-kicker">{t('essentials.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="primary"
            leftSection={<IconPlus size={14} />}
          >
            {t('essentials.addItem')}
          </Button>
          <Button variant="subtle">
            {t('essentials.batchOps')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as EssentialsTab)} tabs={tabItems} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={uiStyles.essentialsStatsRow}>
            <div className={uiStyles.essentialsStatCard}>
              <div className={uiStyles.essentialsStatIcon.blue}>
                <IconBriefcase size={20} />
              </div>
              <div className={uiStyles.essentialsStatMeta}>
                <span className={uiStyles.essentialsStatLabel}>{t('essentials.totalItems')}</span>
                <strong className={uiStyles.essentialsStatValue}>{items.length}</strong>
                <span className={uiStyles.essentialsStatNote}>
                  {t('essentials.baselineSet', { count: items.length })}
                </span>
              </div>
            </div>
            <div className={uiStyles.essentialsStatCard}>
              <div className={uiStyles.essentialsStatIcon.green}>
                <IconRun size={20} />
              </div>
              <div className={uiStyles.essentialsStatMeta}>
                <span className={uiStyles.essentialsStatLabel}>{t('essentials.currentlyWithYou')}</span>
                <strong className={uiStyles.essentialsStatValue}>{carryCount + bagCount}</strong>
                <span className={uiStyles.essentialsStatNote}>
                  {t('essentials.percentCarry', {
                    percent: items.length > 0
                      ? Math.round(((carryCount + bagCount) / items.length) * 100)
                      : 0,
                  })}
                </span>
              </div>
            </div>
            <div className={uiStyles.essentialsStatCard}>
              <div className={uiStyles.essentialsStatIcon.orange}>
                <IconAlertTriangle size={20} />
              </div>
              <div className={uiStyles.essentialsStatMeta}>
                <span className={uiStyles.essentialsStatLabel}>{t('essentials.notOnPerson')}</span>
                <strong className={uiStyles.essentialsStatValue}>{items.length - carryCount - bagCount}</strong>
                <span className={uiStyles.essentialsStatNote}>{t('essentials.pleaseCheckBaseline')}</span>
              </div>
            </div>
            <div className={uiStyles.essentialsStatCard}>
              <div className={uiStyles.essentialsStatIcon.gray}>
                <IconClock size={20} />
              </div>
              <div className={uiStyles.essentialsStatMeta}>
                <span className={uiStyles.essentialsStatLabel}>{t('essentials.lastConfirmed')}</span>
                <strong className={uiStyles.essentialsStatValue}>{t('essentials.todayAt', { time: '08:30' })}</strong>
                <span className={uiStyles.essentialsStatNote}>{t('essentials.overdueConfirm', { count: 3 })}</span>
              </div>
            </div>
          </div>

          <div className={uiStyles.essentialsMainLayout}>
            <div className={uiStyles.essentialsMainContent}>
              <Card className="surface-card">
                <div style={{ padding: `${uiStyles.sectionHead ? '' : '0'}` }}>
                  <div className={uiStyles.sectionHead}>
                    <h3 className={uiStyles.sectionTitle}>{t('essentials.edcItems')}</h3>
                    <div className={uiStyles.essentialsToolbarRight}>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                          padding: '4px 8px',
                          border: `1px solid var(--havit-line)`,
                          borderRadius: 'var(--havit-radius2)',
                          background: 'var(--havit-panel)',
                          fontSize: '0.82rem',
                          color: 'var(--havit-text)',
                        }}
                      >
                        <option value="all">{t('essentials.allStatus')}</option>
                        <option value="carry">{t('essentials.carry')}</option>
                        <option value="bag">{t('essentials.travelBag')}</option>
                        <option value="home">{t('essentials.homeBaseShort')}</option>
                        <option value="away">{t('essentials.notOnPersonShort')}</option>
                      </select>
                      <div className={uiStyles.essentialsViewToggle}>
                        <button
                          className={uiStyles.essentialsViewToggleBtn}
                          data-active={viewMode === 'list' || undefined}
                          onClick={() => setViewMode('list')}
                        >
                          <IconList size={14} />
                          {t('essentials.listView')}
                        </button>
                        <button
                          className={uiStyles.essentialsViewToggleBtn}
                          data-active={viewMode === 'cards' || undefined}
                          onClick={() => setViewMode('cards')}
                        >
                          <IconLayoutGrid size={14} />
                          {t('essentials.cardView')}
                        </button>
                      </div>
                    </div>
                  </div>
                  {viewMode === 'list' ? (
                    <div>
                      <div
                        className={uiStyles.essentialsItemRow}
                        style={{
                          borderBottom: `1px solid var(--havit-line)`,
                          background: 'var(--havit-bg-soft)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: 'var(--havit-muted)',
                          letterSpacing: '0.02em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <span>{t('essentials.item')}</span>
                        <span>{t('essentials.homeBase')}</span>
                        <span>{t('essentials.currentStatus')}</span>
                        <span>{t('essentials.lastConfirmedCol')}</span>
                        <span>{t('essentials.action')}</span>
                      </div>
                      {filteredItems.map((item) => {
                        const statusType = getStatusType(item);
                        return (
                          <div className={uiStyles.essentialsItemRow} key={item.id}>
                            <div className={uiStyles.essentialsItemInfo}>
                              <div className={uiStyles.essentialsItemThumb}>
                                <IconPackage size={18} />
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className={uiStyles.essentialsItemName}>{item.name}</span>
                                  {item.current_status_tag && (
                                    <span
                                      className={
                                        item.current_status_tag === '常用'
                                          ? uiStyles.essentialsTagBadgeCommon
                                          : item.current_status_tag === '必备'
                                            ? uiStyles.essentialsTagBadgeEssential
                                            : item.current_status_tag === '阅读'
                                              ? uiStyles.essentialsTagBadgeRead
                                              : uiStyles.essentialsTagBadgeCommon
                                      }
                                    >
                                      {item.current_status_tag}
                                    </span>
                                  )}
                                </div>
                                {item.category && (
                                  <span className={uiStyles.essentialsItemCategory}>{item.category}</span>
                                )}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--havit-muted)' }}>
                              {item.home_base_location_id ?? '—'}
                            </span>
                            <span className={uiStyles.essentialsStatusBadge[statusType]}>
                              {getStatusLabel(t, item)}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--havit-muted)' }}>
                              今天 08:30
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className={uiStyles.iconButton}
                                title={t('essentials.returnHome')}
                                disabled={statusType === 'home' || returnHomeMutation.isPending}
                                onClick={() => returnHomeMutation.mutate(item.id)}
                              >
                                <IconHome size={14} />
                              </button>
                              <button className={uiStyles.iconButton} title="More">
                                <span style={{ fontSize: '1rem', lineHeight: 1 }}>···</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {filteredItems.length === 0 && (
                        <div className="empty-state">{t('essentials.noEdc')}</div>
                      )}
                    </div>
                  ) : (
                    <div className={uiStyles.essentialsChecklistStrip}>
                      {filteredItems.map((item) => {
                        const statusType = getStatusType(item);
                        return (
                          <div className={uiStyles.essentialsChecklistItem} key={item.id}>
                            <div className={uiStyles.essentialsChecklistThumb}>
                              <IconPackage size={20} />
                            </div>
                            <span className={uiStyles.essentialsChecklistName}>{item.name}</span>
                            <span className={uiStyles.essentialsStatusBadge[statusType]} style={{ fontSize: '0.72rem' }}>
                              {getStatusLabel(t, item)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: `${uiStyles.stack ? '' : ''} 1.5rem`,
                      borderTop: `1px solid var(--havit-line-soft)`,
                      fontSize: '0.82rem',
                      color: 'var(--havit-muted)',
                    }}
                  >
                    <span>共 {filteredItems.length} 项</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className={uiStyles.iconButton}>&lt;</button>
                      <button
                        className={uiStyles.iconButton}
                        style={{ background: 'var(--havit-accent-soft)', color: 'var(--havit-accent-ink)' }}
                      >
                        1
                      </button>
                      <button className={uiStyles.iconButton}>2</button>
                      <button className={uiStyles.iconButton}>3</button>
                      <button className={uiStyles.iconButton}>&gt;</button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className={uiStyles.essentialsSidebar}>
              <Card className="surface-card">
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>{t('essentials.quickActions')}</h3>
                </div>
                <div className={uiStyles.sectionBodyTight}>
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  >
                    <div className={uiStyles.essentialsQuickAction}>
                      <div className={uiStyles.essentialsQuickActionIcon}>
                        <IconCheckbox size={16} />
                      </div>
                      <div className={uiStyles.essentialsQuickActionMeta}>
                        <span className={uiStyles.essentialsQuickActionTitle}>{t('essentials.departureChecklistAction')}</span>
                        <span className={uiStyles.essentialsQuickActionHint}>{t('essentials.departureChecklistActionHint')}</span>
                      </div>
                      <IconChevronRight size={16} className={uiStyles.essentialsQuickActionArrow} />
                    </div>
                    <div className={uiStyles.essentialsQuickAction}>
                      <div className={uiStyles.essentialsQuickActionIcon}>
                        <IconRun size={16} />
                      </div>
                      <div className={uiStyles.essentialsQuickActionMeta}>
                        <span className={uiStyles.essentialsQuickActionTitle}>{t('essentials.markAllCarryAction')}</span>
                        <span className={uiStyles.essentialsQuickActionHint}>{t('essentials.markAllCarryActionHint')}</span>
                      </div>
                      <IconChevronRight size={16} className={uiStyles.essentialsQuickActionArrow} />
                    </div>
                    <div className={uiStyles.essentialsQuickAction}>
                      <div className={uiStyles.essentialsQuickActionIcon} style={{ background: 'var(--havit-line-soft)', color: 'var(--havit-muted)' }}>
                        <IconHome size={16} />
                      </div>
                      <div className={uiStyles.essentialsQuickActionMeta}>
                        <span className={uiStyles.essentialsQuickActionTitle}>{t('essentials.returnAllAction')}</span>
                        <span className={uiStyles.essentialsQuickActionHint}>{t('essentials.returnAllActionHint')}</span>
                      </div>
                      <IconChevronRight size={16} className={uiStyles.essentialsQuickActionArrow} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="surface-card">
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>{t('essentials.statusDistribution')}</h3>
                </div>
                <div className={uiStyles.essentialsDonut}>
                  <DonutChart segments={donutSegments} />
                  <div className={uiStyles.essentialsDonutLegend}>
                    <div className={uiStyles.essentialsDonutLegendItem}>
                      <span className={uiStyles.essentialsDonutLegendDot} style={{ background: 'var(--havit-accent)' }} />
                      <span>{t('essentials.carry')}</span>
                      <span className={uiStyles.essentialsDonutLegendValue}>
                        {carryCount} ({carryCount > 0 ? Math.round((carryCount / items.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className={uiStyles.essentialsDonutLegendItem}>
                      <span className={uiStyles.essentialsDonutLegendDot} style={{ background: 'var(--havit-info)' }} />
                      <span>{t('essentials.travelBag')}</span>
                      <span className={uiStyles.essentialsDonutLegendValue}>
                        {bagCount} ({bagCount > 0 ? Math.round((bagCount / items.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className={uiStyles.essentialsDonutLegendItem}>
                      <span className={uiStyles.essentialsDonutLegendDot} style={{ background: 'var(--havit-line)' }} />
                      <span>{t('essentials.otherLocation')}</span>
                      <span className={uiStyles.essentialsDonutLegendValue}>
                        {homeCount} ({homeCount > 0 ? Math.round((homeCount / items.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className={uiStyles.essentialsDonutLegendItem}>
                      <span className={uiStyles.essentialsDonutLegendDot} style={{ background: 'var(--havit-warning)' }} />
                      <span>{t('essentials.notOnPersonShort')}</span>
                      <span className={uiStyles.essentialsDonutLegendValue}>
                        {awayCount} ({awayCount > 0 ? Math.round((awayCount / items.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="surface-card">
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>{t('essentials.lastConfirmReminder')}</h3>
                </div>
                <div>
                  <div className={uiStyles.essentialsReminderItem}>
                    <div className={uiStyles.essentialsReminderDot} />
                    <div className={uiStyles.essentialsReminderMeta}>
                      <span className={uiStyles.essentialsReminderTitle}>{t('essentials.overdue7Days')}</span>
                      <span className={uiStyles.essentialsReminderSub}>Kindle Paperwhite {t('essentials.departureList')} 2 {t('essentials.departureList').includes('清单') ? '件' : 'items'}</span>
                    </div>
                  </div>
                  <div className={uiStyles.essentialsReminderItem}>
                    <div className={uiStyles.essentialsReminderDotWarn} />
                    <div className={uiStyles.essentialsReminderMeta}>
                      <span className={uiStyles.essentialsReminderTitle}>{t('essentials.overdue3to7Days')}</span>
                      <span className={uiStyles.essentialsReminderSub}>充电宝 Anker 1 {t('essentials.departureList').includes('清单') ? '件' : 'item'}</span>
                    </div>
                  </div>
                  <div className={uiStyles.essentialsReminderItem}>
                    <div className={uiStyles.essentialsReminderDotInfo} />
                    <div className={uiStyles.essentialsReminderMeta}>
                      <span className={uiStyles.essentialsReminderTitle}>{t('essentials.confirmedToday')}</span>
                      <span className={uiStyles.essentialsReminderSub}>墨镜 Ray-Ban {t('essentials.departureList').includes('清单') ? '等 3 件' : 'etc. 3 items'}</span>
                    </div>
                  </div>
                  <div style={{ padding: `${uiStyles.stack ? '' : ''} 0.75rem 1rem`, textAlign: 'center' }}>
                    <button
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: 'var(--havit-accent)',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {t('essentials.viewAllReminders')}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card className="surface-card">
            <div className={uiStyles.sectionHead}>
              <h3 className={uiStyles.sectionTitle}>
                {t('essentials.departureChecklistCount', { count: carryCount + bagCount })}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="subtle" leftSection={<IconCheckbox size={14} />}>
                  {t('essentials.selectAll')}
                </Button>
                <Button variant="subtle" leftSection={<IconRun size={14} />}>
                  {t('essentials.markAllCarry')}
                </Button>
                <Button variant="primary" leftSection={<IconCheck size={14} />}>
                  {t('essentials.iveGotAll')}
                </Button>
              </div>
            </div>
            <div style={{ padding: uiStyles.stack ? undefined : undefined }}>
              <p
                style={{
                  margin: 0,
                  padding: `0 1.5rem 0.5rem`,
                  fontSize: '0.85rem',
                  color: 'var(--havit-muted)',
                }}
              >
                {t('essentials.departureChecklistHint')}
              </p>
              <div className={uiStyles.essentialsChecklistStrip}>
                {items
                  .filter((i) => getStatusType(i) === 'carry' || getStatusType(i) === 'bag')
                  .map((item) => {
                    const statusType = getStatusType(item);
                    return (
                      <div className={uiStyles.essentialsChecklistItem} key={item.id}>
                        <div className={uiStyles.essentialsChecklistThumb}>
                          <IconPackage size={20} />
                        </div>
                        <span className={uiStyles.essentialsChecklistName}>{item.name}</span>
                        <span className={uiStyles.essentialsStatusBadge[statusType]} style={{ fontSize: '0.72rem' }}>
                          {getStatusLabel(t, item)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>
        </>
      )}

      <Dialog
        open={packDialogOpen}
        onClose={() => setPackDialogOpen(false)}
        title={t('essentials.packAll')}
      >
        <Stack>
          <SelectField
            label={t('essentials.packDestination')}
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.currentTarget.value)}
            options={locationOptions}
            placeholder={t('essentials.selectLocation')}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="subtle" onClick={() => setPackDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              leftSection={<IconPackage size={14} />}
              disabled={!selectedLocationId || packAllMutation.isPending}
              onClick={() => packAllMutation.mutate(selectedLocationId)}
            >
              {t('essentials.packConfirm')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </Stack>
  );
}
