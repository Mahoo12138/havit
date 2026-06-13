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
import { edcBulkApi, itemsApi, itemsExtendedApi, locationsApi } from '../api/client';

export const Route = createFileRoute('/edc')({
  component: EDCPage,
});

type ViewMode = 'list' | 'cards';
type EdcTab = 'myEdc' | 'departure' | 'returnLog' | 'dynamicNodes';

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
  if (type === 'carry') return t('edc.carry');
  if (type === 'bag') return t('edc.travelBag');
  if (type === 'home') return t('edc.homeBaseShort');
  return t('edc.notOnPersonShort');
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

function EDCPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [packDialogOpen, setPackDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [activeTab, setActiveTab] = useState<EdcTab>('myEdc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'edc'],
    queryFn: () => itemsApi.list({ type: 'edc' }),
  });

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const returnHomeMutation = useMutation({
    mutationFn: (id: string) => itemsExtendedApi.returnHome(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items', 'edc'] }),
  });

  const packAllMutation = useMutation({
    mutationFn: (locationId: string) => edcBulkApi.packAll(locationId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['items', 'edc'] });
      setPackDialogOpen(false);
      toast.show(t('edc.packedAll', { count: res.moved }));
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
    { key: 'myEdc', label: t('edc.myEdc') },
    { key: 'departure', label: t('edc.departureList') },
    { key: 'returnLog', label: t('edc.returnLog') },
    { key: 'dynamicNodes', label: t('edc.dynamicNodes') },
  ];

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('edc.title')}</h2>
          <p className="page-kicker">{t('edc.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="primary"
            leftSection={<IconPlus size={14} />}
          >
            {t('edc.addItem')}
          </Button>
          <Button variant="subtle">
            {t('edc.batchOps')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as EdcTab)} tabs={tabItems} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={uiStyles.edcStatsRow}>
            <div className={uiStyles.edcStatCard}>
              <div className={uiStyles.edcStatIcon.blue}>
                <IconBriefcase size={20} />
              </div>
              <div className={uiStyles.edcStatMeta}>
                <span className={uiStyles.edcStatLabel}>{t('edc.totalItems')}</span>
                <strong className={uiStyles.edcStatValue}>{items.length}</strong>
                <span className={uiStyles.edcStatNote}>
                  {t('edc.baselineSet', { count: items.length })}
                </span>
              </div>
            </div>
            <div className={uiStyles.edcStatCard}>
              <div className={uiStyles.edcStatIcon.green}>
                <IconRun size={20} />
              </div>
              <div className={uiStyles.edcStatMeta}>
                <span className={uiStyles.edcStatLabel}>{t('edc.currentlyWithYou')}</span>
                <strong className={uiStyles.edcStatValue}>{carryCount + bagCount}</strong>
                <span className={uiStyles.edcStatNote}>
                  {t('edc.percentCarry', {
                    percent: items.length > 0
                      ? Math.round(((carryCount + bagCount) / items.length) * 100)
                      : 0,
                  })}
                </span>
              </div>
            </div>
            <div className={uiStyles.edcStatCard}>
              <div className={uiStyles.edcStatIcon.orange}>
                <IconAlertTriangle size={20} />
              </div>
              <div className={uiStyles.edcStatMeta}>
                <span className={uiStyles.edcStatLabel}>{t('edc.notOnPerson')}</span>
                <strong className={uiStyles.edcStatValue}>{items.length - carryCount - bagCount}</strong>
                <span className={uiStyles.edcStatNote}>{t('edc.pleaseCheckBaseline')}</span>
              </div>
            </div>
            <div className={uiStyles.edcStatCard}>
              <div className={uiStyles.edcStatIcon.gray}>
                <IconClock size={20} />
              </div>
              <div className={uiStyles.edcStatMeta}>
                <span className={uiStyles.edcStatLabel}>{t('edc.lastConfirmed')}</span>
                <strong className={uiStyles.edcStatValue}>{t('edc.todayAt', { time: '08:30' })}</strong>
                <span className={uiStyles.edcStatNote}>{t('edc.overdueConfirm', { count: 3 })}</span>
              </div>
            </div>
          </div>

          <div className={uiStyles.edcMainLayout}>
            <div className={uiStyles.edcMainContent}>
              <Card className="surface-card">
                <div style={{ padding: `${uiStyles.sectionHead ? '' : '0'}` }}>
                  <div className={uiStyles.sectionHead}>
                    <h3 className={uiStyles.sectionTitle}>{t('edc.edcItems')}</h3>
                    <div className={uiStyles.edcToolbarRight}>
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
                        <option value="all">{t('edc.allStatus')}</option>
                        <option value="carry">{t('edc.carry')}</option>
                        <option value="bag">{t('edc.travelBag')}</option>
                        <option value="home">{t('edc.homeBaseShort')}</option>
                        <option value="away">{t('edc.notOnPersonShort')}</option>
                      </select>
                      <div className={uiStyles.edcViewToggle}>
                        <button
                          className={uiStyles.edcViewToggleBtn}
                          data-active={viewMode === 'list' || undefined}
                          onClick={() => setViewMode('list')}
                        >
                          <IconList size={14} />
                          {t('edc.listView')}
                        </button>
                        <button
                          className={uiStyles.edcViewToggleBtn}
                          data-active={viewMode === 'cards' || undefined}
                          onClick={() => setViewMode('cards')}
                        >
                          <IconLayoutGrid size={14} />
                          {t('edc.cardView')}
                        </button>
                      </div>
                    </div>
                  </div>
                  {viewMode === 'list' ? (
                    <div>
                      <div
                        className={uiStyles.edcItemRow}
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
                        <span>{t('edc.item')}</span>
                        <span>{t('edc.homeBase')}</span>
                        <span>{t('edc.currentStatus')}</span>
                        <span>{t('edc.lastConfirmedCol')}</span>
                        <span>{t('edc.action')}</span>
                      </div>
                      {filteredItems.map((item) => {
                        const statusType = getStatusType(item);
                        return (
                          <div className={uiStyles.edcItemRow} key={item.id}>
                            <div className={uiStyles.edcItemInfo}>
                              <div className={uiStyles.edcItemThumb}>
                                <IconPackage size={18} />
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className={uiStyles.edcItemName}>{item.name}</span>
                                  {item.current_status_tag && (
                                    <span
                                      className={
                                        item.current_status_tag === '常用'
                                          ? uiStyles.edcTagBadgeCommon
                                          : item.current_status_tag === '必备'
                                            ? uiStyles.edcTagBadgeEssential
                                            : item.current_status_tag === '阅读'
                                              ? uiStyles.edcTagBadgeRead
                                              : uiStyles.edcTagBadgeCommon
                                      }
                                    >
                                      {item.current_status_tag}
                                    </span>
                                  )}
                                </div>
                                {item.category && (
                                  <span className={uiStyles.edcItemCategory}>{item.category}</span>
                                )}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--havit-muted)' }}>
                              {item.home_base_location_id ?? '—'}
                            </span>
                            <span className={uiStyles.edcStatusBadge[statusType]}>
                              {getStatusLabel(t, item)}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--havit-muted)' }}>
                              今天 08:30
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className={uiStyles.iconButton}
                                title={t('edc.returnHome')}
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
                        <div className="empty-state">{t('edc.noEdc')}</div>
                      )}
                    </div>
                  ) : (
                    <div className={uiStyles.edcChecklistStrip}>
                      {filteredItems.map((item) => {
                        const statusType = getStatusType(item);
                        return (
                          <div className={uiStyles.edcChecklistItem} key={item.id}>
                            <div className={uiStyles.edcChecklistThumb}>
                              <IconPackage size={20} />
                            </div>
                            <span className={uiStyles.edcChecklistName}>{item.name}</span>
                            <span className={uiStyles.edcStatusBadge[statusType]} style={{ fontSize: '0.72rem' }}>
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

            <div className={uiStyles.edcSidebar}>
              <Card className="surface-card">
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>{t('edc.quickActions')}</h3>
                </div>
                <div className={uiStyles.sectionBodyTight}>
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  >
                    <div className={uiStyles.edcQuickAction}>
                      <div className={uiStyles.edcQuickActionIcon}>
                        <IconCheckbox size={16} />
                      </div>
                      <div className={uiStyles.edcQuickActionMeta}>
                        <span className={uiStyles.edcQuickActionTitle}>{t('edc.departureChecklistAction')}</span>
                        <span className={uiStyles.edcQuickActionHint}>{t('edc.departureChecklistActionHint')}</span>
                      </div>
                      <IconChevronRight size={16} className={uiStyles.edcQuickActionArrow} />
                    </div>
                    <div className={uiStyles.edcQuickAction}>
                      <div className={uiStyles.edcQuickActionIcon}>
                        <IconRun size={16} />
                      </div>
                      <div className={uiStyles.edcQuickActionMeta}>
                        <span className={uiStyles.edcQuickActionTitle}>{t('edc.markAllCarryAction')}</span>
                        <span className={uiStyles.edcQuickActionHint}>{t('edc.markAllCarryActionHint')}</span>
                      </div>
                      <IconChevronRight size={16} className={uiStyles.edcQuickActionArrow} />
                    </div>
                    <div className={uiStyles.edcQuickAction}>
                      <div className={uiStyles.edcQuickActionIcon} style={{ background: 'var(--havit-line-soft)', color: 'var(--havit-muted)' }}>
                        <IconHome size={16} />
                      </div>
                      <div className={uiStyles.edcQuickActionMeta}>
                        <span className={uiStyles.edcQuickActionTitle}>{t('edc.returnAllAction')}</span>
                        <span className={uiStyles.edcQuickActionHint}>{t('edc.returnAllActionHint')}</span>
                      </div>
                      <IconChevronRight size={16} className={uiStyles.edcQuickActionArrow} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="surface-card">
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>{t('edc.statusDistribution')}</h3>
                </div>
                <div className={uiStyles.edcDonut}>
                  <DonutChart segments={donutSegments} />
                  <div className={uiStyles.edcDonutLegend}>
                    <div className={uiStyles.edcDonutLegendItem}>
                      <span className={uiStyles.edcDonutLegendDot} style={{ background: 'var(--havit-accent)' }} />
                      <span>{t('edc.carry')}</span>
                      <span className={uiStyles.edcDonutLegendValue}>
                        {carryCount} ({carryCount > 0 ? Math.round((carryCount / items.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className={uiStyles.edcDonutLegendItem}>
                      <span className={uiStyles.edcDonutLegendDot} style={{ background: 'var(--havit-info)' }} />
                      <span>{t('edc.travelBag')}</span>
                      <span className={uiStyles.edcDonutLegendValue}>
                        {bagCount} ({bagCount > 0 ? Math.round((bagCount / items.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className={uiStyles.edcDonutLegendItem}>
                      <span className={uiStyles.edcDonutLegendDot} style={{ background: 'var(--havit-line)' }} />
                      <span>{t('edc.otherLocation')}</span>
                      <span className={uiStyles.edcDonutLegendValue}>
                        {homeCount} ({homeCount > 0 ? Math.round((homeCount / items.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className={uiStyles.edcDonutLegendItem}>
                      <span className={uiStyles.edcDonutLegendDot} style={{ background: 'var(--havit-warning)' }} />
                      <span>{t('edc.notOnPersonShort')}</span>
                      <span className={uiStyles.edcDonutLegendValue}>
                        {awayCount} ({awayCount > 0 ? Math.round((awayCount / items.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="surface-card">
                <div className={uiStyles.sectionHead}>
                  <h3 className={uiStyles.sectionTitle}>{t('edc.lastConfirmReminder')}</h3>
                </div>
                <div>
                  <div className={uiStyles.edcReminderItem}>
                    <div className={uiStyles.edcReminderDot} />
                    <div className={uiStyles.edcReminderMeta}>
                      <span className={uiStyles.edcReminderTitle}>{t('edc.overdue7Days')}</span>
                      <span className={uiStyles.edcReminderSub}>Kindle Paperwhite {t('edc.departureList')} 2 {t('edc.departureList').includes('清单') ? '件' : 'items'}</span>
                    </div>
                  </div>
                  <div className={uiStyles.edcReminderItem}>
                    <div className={uiStyles.edcReminderDotWarn} />
                    <div className={uiStyles.edcReminderMeta}>
                      <span className={uiStyles.edcReminderTitle}>{t('edc.overdue3to7Days')}</span>
                      <span className={uiStyles.edcReminderSub}>充电宝 Anker 1 {t('edc.departureList').includes('清单') ? '件' : 'item'}</span>
                    </div>
                  </div>
                  <div className={uiStyles.edcReminderItem}>
                    <div className={uiStyles.edcReminderDotInfo} />
                    <div className={uiStyles.edcReminderMeta}>
                      <span className={uiStyles.edcReminderTitle}>{t('edc.confirmedToday')}</span>
                      <span className={uiStyles.edcReminderSub}>墨镜 Ray-Ban {t('edc.departureList').includes('清单') ? '等 3 件' : 'etc. 3 items'}</span>
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
                      {t('edc.viewAllReminders')}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card className="surface-card">
            <div className={uiStyles.sectionHead}>
              <h3 className={uiStyles.sectionTitle}>
                {t('edc.departureChecklistCount', { count: carryCount + bagCount })}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="subtle" leftSection={<IconCheckbox size={14} />}>
                  {t('edc.selectAll')}
                </Button>
                <Button variant="subtle" leftSection={<IconRun size={14} />}>
                  {t('edc.markAllCarry')}
                </Button>
                <Button variant="primary" leftSection={<IconCheck size={14} />}>
                  {t('edc.iveGotAll')}
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
                {t('edc.departureChecklistHint')}
              </p>
              <div className={uiStyles.edcChecklistStrip}>
                {items
                  .filter((i) => getStatusType(i) === 'carry' || getStatusType(i) === 'bag')
                  .map((item) => {
                    const statusType = getStatusType(item);
                    return (
                      <div className={uiStyles.edcChecklistItem} key={item.id}>
                        <div className={uiStyles.edcChecklistThumb}>
                          <IconPackage size={20} />
                        </div>
                        <span className={uiStyles.edcChecklistName}>{item.name}</span>
                        <span className={uiStyles.edcStatusBadge[statusType]} style={{ fontSize: '0.72rem' }}>
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
        title={t('edc.packAll')}
      >
        <Stack>
          <SelectField
            label={t('edc.packDestination')}
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.currentTarget.value)}
            options={locationOptions}
            placeholder={t('edc.selectLocation')}
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
              {t('edc.packConfirm')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </Stack>
  );
}
