import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClipboardList,
  IconDownload,
  IconEye,
  IconFilter,
  IconFileExport,
  IconMapPin,
  IconPackage,
  IconSearch,
  IconShoppingCart,
  IconUser,
} from '@tabler/icons-react';
import { Button, buttonVariants } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog-compat';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { Input } from '../../components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  usePaginationRange,
} from '../../components/ui/pagination';
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
import { uiStyles } from '../../components/ui';
import { useToast } from '../../components/ui/use-toast';
import { themeVars } from '../../styles/theme.css';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import {
  abnormalApi,
  itemsApi,
  preferencesApi,
  suppliesExtendedApi,
  tagsApi,
  type AbnormalListItem,
} from '../../api/client';
import * as s from './abnormalMobile.css';

const PAGE_SIZE = 10;

// 可登记异常的物品状态（已退出台账的物品不能再新增异常）
const ACTIVE_ITEM_STATUSES = new Set(['in_stock', 'in_use', 'borrowed', 'idle', 'for_sale']);

const PROCESSING_STATUS_OPTIONS = [
  { key: 'reporting', labelKey: 'abnormal.progressReporting' },
  { key: 'searching', labelKey: 'abnormal.progressSearching' },
  { key: 'pending_compensation', labelKey: 'abnormal.progressPendingCompensation' },
  { key: 'compensated', labelKey: 'abnormal.progressCompensated' },
  { key: 'scrapped', labelKey: 'abnormal.progressScrapped' },
  { key: 'closed', labelKey: 'abnormal.progressClosed' },
];

const TYPE_OPTIONS = [
  { key: 'lost', labelKey: 'abnormal.typeLost' },
  { key: 'stolen', labelKey: 'abnormal.typeStolen' },
  { key: 'unreturned', labelKey: 'abnormal.typeUnreturned' },
  { key: 'damaged', labelKey: 'abnormal.typeDamaged' },
];

// 处理进度图表配色：跟随主题变量以同时适配明暗两套面板
const PROGRESS_COLORS: Record<string, string> = {
  reporting: 'var(--havit-info)',
  searching: 'var(--havit-info)',
  pending_compensation: 'var(--havit-amber)',
  compensated: 'var(--havit-success)',
  scrapped: 'var(--havit-muted)',
  closed: 'var(--havit-success)',
};

const FLOW_STAGE_ORDER = ['reporting', 'searching', 'pending_compensation', 'compensated', 'scrapped', 'closed'];

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string) {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * 异常资产管理 · 移动端实现。
 *
 * 桌面版把「主表格 + 侧栏快览列表」并排展示；窄屏下这两块都放不下，
 * 因此移动端统一收敛为一条卡片流：每张卡承载一件异常资产的全部字段，
 * 桌面侧栏那份快览列表则上移为一行分类计数（quickCounts）。
 */
export function AbnormalMobile() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<null | 'found' | 'replenish' | 'claim' | 'flow' | 'add' | 'status'>(null);
  const [pickedRecordId, setPickedRecordId] = useState('');
  const [addForm, setAddForm] = useState({ itemId: '', type: 'lost', date: '', loss: '', notes: '' });

  const offset = (page - 1) * PAGE_SIZE;

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['abnormal', 'list', typeFilter, statusFilter, page],
    queryFn: () =>
      abnormalApi.list({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['abnormal', 'stats'],
    queryFn: abnormalApi.stats,
  });

  const { data: trendData } = useQuery({
    queryKey: ['abnormal', 'trend'],
    queryFn: abnormalApi.trend,
  });

  const { data: progressData } = useQuery({
    queryKey: ['abnormal', 'progress'],
    queryFn: abnormalApi.progress,
  });

  const { data: valuation } = useQuery({
    queryKey: ['abnormal', 'valuation'],
    queryFn: abnormalApi.valuation,
  });

  // 弹窗用的全量记录（不受分页/筛选影响），仅在对应弹窗打开时拉取
  const pickerOpen = dialog === 'found' || dialog === 'replenish' || dialog === 'claim';
  const { data: allRecordsData } = useQuery({
    queryKey: ['abnormal', 'list', 'all'],
    queryFn: () => abnormalApi.list({ limit: 500 }),
    enabled: pickerOpen || dialog === 'status',
  });

  // 新增异常弹窗：可选的仍在台账中的物品 + 默认币种；全量物品同时用于「占总资产」KPI
  const addDialogOpen = dialog === 'add';
  const { data: itemsData } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list(),
  });
  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.get(),
    enabled: addDialogOpen,
  });
  const defaultCurrency = preferences?.default_currency || 'CNY';

  // 底部导航的「+」浮标：接管后打开新增异常
  useEffect(() => {
    function handlePrimaryAction(event: Event) {
      const custom = event as CustomEvent<{ path: string; handled: boolean }>;
      if (!custom.detail?.path.startsWith('/abnormal')) return;
      custom.detail.handled = true;
      if (isOnline) {
        setPickedRecordId('');
        setDialog('add');
      }
    }

    window.addEventListener('havit:mobile-primary-action', handlePrimaryAction);
    return () => window.removeEventListener('havit:mobile-primary-action', handlePrimaryAction);
  }, [isOnline]);

  const invalidateAbnormal = () => {
    queryClient.invalidateQueries({ queryKey: ['abnormal'] });
  };

  const closeDialog = () => {
    setDialog(null);
    setPickedRecordId('');
  };

  const markFoundMutation = useMutation({
    mutationFn: async (record: AbnormalListItem) => {
      await itemsApi.update(record.item_id, { status: 'in_stock' });
      await abnormalApi.updateProgress(record.abnormal_id, { processing_status: 'closed' });
    },
    onSuccess: () => {
      invalidateAbnormal();
      closeDialog();
      toast.show(t('abnormal.toastFound'));
    },
    onError: (error) => toast.show(t('abnormal.actionFailed', { error: errorText(error) })),
  });

  const replenishMutation = useMutation({
    mutationFn: async (record: AbnormalListItem) => {
      const tagName = t('abnormal.replenishTag');
      const tags = await tagsApi.list();
      let tag = tags.tags.find((tg) => tg.name === tagName);
      if (!tag) tag = await tagsApi.create({ name: tagName });
      const item = await itemsApi.get(record.item_id);
      const tagIds = (item.tags ?? []).map((tg) => tg.id);
      if (tagIds.includes(tag.id)) return 'exists' as const;
      await itemsApi.replaceTags(record.item_id, [...tagIds, tag.id]);
      return 'added' as const;
    },
    onSuccess: (result) => {
      invalidateAbnormal();
      closeDialog();
      toast.show(
        result === 'exists'
          ? t('abnormal.toastReplenishExists', { tag: t('abnormal.replenishTag') })
          : t('abnormal.toastReplenish', { tag: t('abnormal.replenishTag') }),
      );
    },
    onError: (error) => toast.show(t('abnormal.actionFailed', { error: errorText(error) })),
  });

  const claimMutation = useMutation({
    mutationFn: async (record: AbnormalListItem) => {
      const blob = await suppliesExtendedApi.claimPdf(record.item_id);
      downloadBlob(blob, `${record.name}-insurance-claim.pdf`);
    },
    onSuccess: () => closeDialog(),
    onError: (error) => toast.show(t('abnormal.toastClaimFailed', { error: errorText(error) })),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      abnormalApi.updateProgress(id, { processing_status: status }),
    onSuccess: () => {
      invalidateAbnormal();
      closeDialog();
    },
    onError: (error) => toast.show(t('abnormal.actionFailed', { error: errorText(error) })),
  });

  const addMutation = useMutation({
    mutationFn: ({ itemId, type, date, loss, notes }: typeof addForm) => {
      const body: Parameters<typeof suppliesExtendedApi.exit>[1] = { exit_type: type };
      if (date) body.exit_date = Math.floor(new Date(date).getTime() / 1000);
      if (loss) {
        body.exit_price = Number(loss);
        body.exit_currency = defaultCurrency;
      }
      if (notes.trim()) body.exit_notes = notes.trim();
      return suppliesExtendedApi.exit(itemId, body);
    },
    onSuccess: () => {
      invalidateAbnormal();
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setAddForm({ itemId: '', type: 'lost', date: '', loss: '', notes: '' });
      closeDialog();
      toast.show(t('abnormal.toastAdded'));
    },
    onError: (error) => toast.show(t('abnormal.actionFailed', { error: errorText(error) })),
  });

  const items = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const trend = trendData?.trend ?? [];
  const progress = progressData?.progress ?? [];
  const progressTotal = progress.reduce((sum, p) => sum + p.count, 0);

  const allRecords = allRecordsData?.items ?? [];
  const foundRecords = allRecords.filter(
    (r) => (r.abnormal_type === 'lost' || r.abnormal_type === 'unreturned') && r.processing_status !== 'closed',
  );
  const replenishRecords = allRecords.filter(
    (r) =>
      (r.abnormal_type === 'lost' || r.abnormal_type === 'stolen' || r.abnormal_type === 'damaged') &&
      r.processing_status !== 'closed',
  );
  const claimRecords = allRecords.filter((r) => r.abnormal_type === 'stolen');
  const activeItems = (itemsData?.items ?? []).filter((item) => ACTIVE_ITEM_STATUSES.has(item.status));
  const totalAssets = itemsData?.items?.length ?? 0;
  const pickedRecord = allRecords.find((r) => r.abnormal_id === pickedRecordId);

  /** 卡片列表：桌面版靠服务端分页，移动端点进来给一份本地关键词过滤 */
  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.name, item.serial_number, item.location_name, item.responsible_person]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [items, searchQuery]);

  async function handleExportCsv() {
    try {
      const data = await abnormalApi.list({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        limit: 1000,
      });
      const header = [
        t('abnormal.colAsset'),
        t('abnormal.colType'),
        t('abnormal.colAbnormalTime'),
        t('abnormal.colLocation'),
        t('abnormal.colResponsible'),
        t('abnormal.colProgress'),
        t('abnormal.colUpdatedAt'),
        t('abnormal.valuationTotal'),
        t('abnormal.valuationRecoverable'),
      ];
      const rows = data.items.map((item) => [
        item.name,
        typeLabel(item.abnormal_type),
        formatDate(item.exit_date),
        item.location_name ?? '',
        item.responsible_person ?? '',
        progressLabel(item.processing_status),
        formatDate(item.updated_at),
        item.estimated_loss != null ? String(item.estimated_loss) : '',
        item.recoverable_amount != null ? String(item.recoverable_amount) : '',
      ]);
      const csv =
        '\uFEFF' +
        [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n') +
        '\r\n';
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'abnormal-records.csv');
    } catch (error) {
      toast.show(t('abnormal.toastExportFailed', { error: errorText(error) }));
    }
  }

  function recordOptions(records: AbnormalListItem[]) {
    return records.map((r) => ({
      value: r.abnormal_id,
      label: `${r.name} · ${typeLabel(r.abnormal_type)} · ${formatDate(r.exit_date)}`,
    }));
  }

  const kpiTiles = useMemo(() => {
    const s0 = stats ?? { total: 0, lost: 0, stolen: 0, unreturned: 0, damaged: 0 };
    // 占总资产的分母是台账物品总数，与仪表盘口径一致；分母为零时显示 0
    const pct = totalAssets > 0 ? ((s0.total / totalAssets) * 100).toFixed(1) : '0';
    const ratio = (n: number) => (s0.total > 0 ? `${((n / s0.total) * 100).toFixed(1)}%` : '0%');
    return [
      {
        icon: IconAlertTriangle,
        tone: 'red' as const,
        label: t('abnormal.kpiTotal'),
        value: s0.total,
        sub: t('abnormal.kpiOfTotal', { pct }),
        wide: true,
      },
      { icon: IconSearch, tone: 'blue' as const, label: t('abnormal.kpiLost'), value: s0.lost, sub: ratio(s0.lost) },
      {
        icon: IconFileExport,
        tone: 'orange' as const,
        label: t('abnormal.kpiStolen'),
        value: s0.stolen,
        sub: ratio(s0.stolen),
      },
      {
        icon: IconClipboardList,
        tone: 'violet' as const,
        label: t('abnormal.kpiUnreturned'),
        value: s0.unreturned,
        sub: ratio(s0.unreturned),
      },
      {
        icon: IconPackage,
        tone: 'neutral' as const,
        label: t('abnormal.kpiDamaged'),
        value: s0.damaged,
        sub: ratio(s0.damaged),
      },
    ];
  }, [stats, totalAssets, t]);

  function formatDate(ts?: number): string {
    if (!ts) return '-';
    const d = new Date(ts * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatCurrency(value?: number, currency?: string): string {
    if (value == null) return '-';
    const sym = currency === 'CNY' ? '¥' : currency ?? '¥';
    return `${sym}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function getProgressBadgeClass(status: string): string {
    return uiStyles.abnormalProgressBadge[status as keyof typeof uiStyles.abnormalProgressBadge] ?? uiStyles.abnormalProgressBadge.pending;
  }

  function progressLabel(status: string): string {
    const opt = PROCESSING_STATUS_OPTIONS.find((o) => o.key === status);
    return opt ? t(opt.labelKey) : status;
  }

  function typeLabel(type: string): string {
    const opt = TYPE_OPTIONS.find((o) => o.key === type);
    return opt ? t(opt.labelKey) : type;
  }

  const hasFilter = Boolean(typeFilter || statusFilter);

  return (
    <div className={s.page}>
      {/* KPI 磁贴 */}
      <div className={s.statsScroll}>
        {kpiTiles.map((tile) => (
          <div key={tile.label} className={`${s.statTile} ${tile.wide ? s.statTileWide : ''}`}>
            <span className={`${s.statIcon} ${s.statIconTone[tile.tone]}`}>
              <tile.icon size={16} />
            </span>
            <span className={s.statValue}>{tile.value}</span>
            <span className={s.statLabel}>
              {tile.label} · {tile.sub}
            </span>
          </div>
        ))}
      </div>

      {/* 提示条 */}
      <div className={s.alertBanner}>
        <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span className={s.alertText}>{t('abnormal.alertBanner')}</span>
        <button
          type="button"
          className={s.alertLink}
          onClick={() => {
            setPickedRecordId('');
            setDialog('flow');
          }}
        >
          {t('abnormal.learnMore')}
        </button>
      </div>

      {/* 搜索 + 筛选 */}
      <div className={s.filterBar}>
        <span className={s.searchWrap}>
          <IconSearch size={16} className={s.searchIcon} />
          <Input
            className={s.searchInput}
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-testid="abnormal-filter-toggle"
          className={`${s.filterBtn} ${hasFilter ? s.filterBtnActive : ''}`}
          onClick={() => setShowFilters((prev) => !prev)}
          aria-label={t('abnormal.filterAllTypes')}
          aria-expanded={showFilters}
        >
          <IconFilter size={16} />
        </Button>
      </div>

      {showFilters && (
        <div className={s.filterPanel}>
          <FilterSelect
            label={t('abnormal.filterAllTypes')}
            options={[{ value: '', label: t('abnormal.filterAllTypes') }, ...TYPE_OPTIONS.map((o) => ({ value: o.key, label: t(o.labelKey) }))]}
            value={typeFilter}
            onChange={(next) => {
              setTypeFilter(next);
              setPage(1);
            }}
          />
          <FilterSelect
            label={t('abnormal.filterAllStatus')}
            options={[
              { value: '', label: t('abnormal.filterAllStatus') },
              ...PROCESSING_STATUS_OPTIONS.map((o) => ({ value: o.key, label: t(o.labelKey) })),
            ]}
            value={statusFilter}
            onChange={(next) => {
              setStatusFilter(next);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* 快览计数（桌面侧栏列表的移动端等价物） */}
      {stats && (
        <div className={s.quickCounts}>
          {TYPE_OPTIONS.map((o) => (
            <span key={o.key} className={s.quickCount}>
              <span className={s.legendDot} style={{ background: TYPE_DOT_COLORS[o.key] }} />
              {t(o.labelKey)}
              <strong>{stats[o.key as keyof typeof stats]}</strong>
            </span>
          ))}
        </div>
      )}

      {/* 记录卡片列表 */}
      {listLoading ? (
        <div className={s.centered}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className={s.listHead}>
            <span className={s.listCount}>
              {t('abnormal.totalItems', { count: total })}
              {searchQuery.trim() ? ` · ${visibleItems.length} ${t('common.items')}` : ''}
            </span>
            <Button variant="subtle" size="xs" onClick={handleExportCsv}>
              <IconDownload size={13} />
              {t('abnormal.exportReport')}
            </Button>
          </div>

          {visibleItems.length === 0 ? (
            <div className={s.emptyState}>{t('abnormal.noRecords')}</div>
          ) : (
            <div className={s.cardList}>
              {visibleItems.map((item) => (
                <article className={s.card} key={item.abnormal_id}>
                  <div className={s.cardHeader}>
                    {item.photo_url ? (
                      <img src={item.photo_url} alt="" className={s.cardThumb} />
                    ) : (
                      <span className={s.cardThumbPlaceholder}>{item.name.charAt(0)}</span>
                    )}
                    <div className={s.cardMeta}>
                      <div className={s.cardNameRow}>
                        <span className={s.cardName}>{item.name}</span>
                      </div>
                      <span className={s.cardSub}>
                        {typeLabel(item.abnormal_type)}
                        {item.serial_number ? ` · SN ${item.serial_number}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className={s.cardFacts}>
                    <Fact icon={IconMapPin} label={t('abnormal.colLocation')} value={item.location_name ?? '-'} />
                    <Fact icon={IconUser} label={t('abnormal.colResponsible')} value={item.responsible_person ?? '-'} />
                    <Fact label={t('abnormal.colAbnormalTime')} value={formatDate(item.exit_date)} />
                    <Fact label={t('abnormal.colUpdatedAt')} value={formatDate(item.updated_at)} />
                  </div>

                  <div className={s.cardFooter}>
                    <div className={s.cardLoss}>
                      <span className={s.cardLossLabel}>{t('abnormal.valuationTotal')}</span>
                      <span className={s.cardLossValue}>
                        {formatCurrency(item.estimated_loss, item.estimated_loss_currency)}
                      </span>
                    </div>
                    <div className={s.cardActions}>
                      <button
                        type="button"
                        className={s.progressBtn}
                        onClick={() => {
                          setPickedRecordId(item.abnormal_id);
                          setDialog('status');
                        }}
                      >
                        <span className={getProgressBadgeClass(item.processing_status)}>
                          {progressLabel(item.processing_status)}
                        </span>
                      </button>
                      <Link
                        to="/items/$itemId"
                        params={{ itemId: item.item_id }}
                        className={buttonVariants({ variant: 'subtle', size: 'icon-xs' })}
                        title={t('abnormal.viewItem')}
                        aria-label={t('abnormal.viewItem')}
                      >
                        <IconEye size={13} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && <AbnormalPager page={page} totalPages={totalPages} onChange={setPage} />}
        </>
      )}

      {/* 底部洞察 */}
      <div className={s.insightList}>
        <InsightCard title={t('abnormal.quickActions')}>
          <div className={s.quickGrid}>
            {[
              {
                icon: <IconCircleCheck size={16} />,
                label: t('abnormal.actionMarkFound'),
                onClick: () => {
                  setPickedRecordId('');
                  setDialog('found');
                },
              },
              {
                icon: <IconShoppingCart size={16} />,
                label: t('abnormal.actionReplenish'),
                onClick: () => {
                  setPickedRecordId('');
                  setDialog('replenish');
                },
              },
              {
                icon: <IconFileExport size={16} />,
                label: t('abnormal.actionExportClaim'),
                onClick: () => {
                  setPickedRecordId('');
                  setDialog('claim');
                },
              },
              {
                icon: <IconClipboardList size={16} />,
                label: t('abnormal.actionViewFlow'),
                onClick: () => {
                  setPickedRecordId('');
                  setDialog('flow');
                },
              },
            ].map((action) => (
              <button type="button" className={s.quickBtn} key={action.label} onClick={action.onClick}>
                <span className={s.quickIcon}>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </InsightCard>

        <InsightCard title={t('abnormal.trendTitle')} meta={t('abnormal.trendWindow')}>
          <TrendLineChart
            data={trend}
            locale={i18n.language}
            emptyLabel={t('abnormal.noTrendData')}
            ariaLabel={`${t('abnormal.trendTitle')} · ${t('abnormal.trendWindow')}`}
          />
        </InsightCard>

        <InsightCard title={t('abnormal.progressTitle')} meta={t('abnormal.totalItems', { count: progressTotal })}>
          {progressTotal === 0 ? (
            <div className={s.donutSolo}>
              <DonutChart segments={[]} totalLabel={t('abnormal.progressTotal')} size={112} />
            </div>
          ) : (
            <div className={s.donutRow}>
              <DonutChart
                segments={progress.map((p) => ({
                  label: progressLabel(p.status),
                  value: p.count,
                  color: PROGRESS_COLORS[p.status] ?? PROGRESS_COLORS.scrapped,
                }))}
                totalLabel={t('abnormal.progressTotal')}
                size={112}
              />
              <div className={s.legend}>
                {progress
                  .filter((p) => p.count > 0)
                  .map((p) => (
                    <div key={p.status} className={s.legendItem}>
                      <span
                        className={s.legendDot}
                        style={{ background: PROGRESS_COLORS[p.status] ?? PROGRESS_COLORS.scrapped }}
                      />
                      <span>{progressLabel(p.status)}</span>
                      <span className={s.legendCount}>{p.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </InsightCard>

        <InsightCard title={t('abnormal.valuationTitle')}>
          <div className={s.valuationRows}>
            <div className={s.valuationRow}>
              <span className={s.valuationLabel}>{t('abnormal.valuationTotal')}</span>
              <span className={s.valuationLeader} />
              <span className={s.valuationValue}>
                {formatCurrency(valuation?.total_estimated, valuation?.estimated_currency)}
              </span>
            </div>
            <div className={s.valuationRow}>
              <span className={s.valuationLabel}>{t('abnormal.valuationRecoverable')}</span>
              <span className={s.valuationLeader} />
              <span className={s.valuationValue} style={{ color: themeVars.success }}>
                {formatCurrency(valuation?.recoverable_amount, valuation?.recoverable_currency)}
              </span>
            </div>
          </div>
        </InsightCard>
      </div>

      {/* ── 弹窗 ───────────────────────────────────────────────────────────── */}

      <Dialog open={dialog === 'status'} onClose={closeDialog} title={t('abnormal.colProgress')}>
        <div className={s.sheetBody}>
          {pickedRecord && (
            <p className={s.sheetHint}>
              {pickedRecord.name} · {typeLabel(pickedRecord.abnormal_type)}
            </p>
          )}
          <div className={s.quickGrid}>
            {PROCESSING_STATUS_OPTIONS.map((opt) => {
              const active = pickedRecord?.processing_status === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={s.quickBtn}
                  disabled={updateMutation.isPending}
                  style={
                    active
                      ? {
                          borderColor: themeVars.accent,
                          background: themeVars.accentSoft,
                          color: themeVars.accentInk,
                        }
                      : undefined
                  }
                  onClick={() =>
                    pickedRecordId && updateMutation.mutate({ id: pickedRecordId, status: opt.key })
                  }
                >
                  <span className={s.quickIcon}>
                    <span
                      className={s.legendDot}
                      style={{ background: PROGRESS_COLORS[opt.key] ?? PROGRESS_COLORS.scrapped, width: '10px', height: '10px' }}
                    />
                  </span>
                  <span>{t(opt.labelKey)}</span>
                  {active && <IconCircleCheck size={14} style={{ marginLeft: 'auto' }} />}
                </button>
              );
            })}
          </div>
          <div className={s.sheetActions}>
            <Button variant="outline" onClick={closeDialog}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={dialog === 'found'} onClose={closeDialog} title={t('abnormal.dialogFoundTitle')}>
        <div className={s.sheetBody}>
          <p className={s.sheetHint}>{t('abnormal.dialogFoundHint')}</p>
          {foundRecords.length === 0 ? (
            <p className={s.sheetHint}>{t('abnormal.noEligibleRecords')}</p>
          ) : (
            <SelectField
              label={t('abnormal.selectRecord')}
              options={recordOptions(foundRecords)}
              value={pickedRecordId}
              onChange={(event) => setPickedRecordId(event.currentTarget.value)}
            />
          )}
          <div className={s.sheetActions}>
            <Button variant="outline" onClick={closeDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!pickedRecordId || markFoundMutation.isPending || !isOnline}
              onClick={() => pickedRecord && markFoundMutation.mutate(pickedRecord)}
            >
              {markFoundMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={dialog === 'replenish'} onClose={closeDialog} title={t('abnormal.dialogReplenishTitle')}>
        <div className={s.sheetBody}>
          <p className={s.sheetHint}>{t('abnormal.dialogReplenishHint', { tag: t('abnormal.replenishTag') })}</p>
          {replenishRecords.length === 0 ? (
            <p className={s.sheetHint}>{t('abnormal.noEligibleRecords')}</p>
          ) : (
            <SelectField
              label={t('abnormal.selectRecord')}
              options={recordOptions(replenishRecords)}
              value={pickedRecordId}
              onChange={(event) => setPickedRecordId(event.currentTarget.value)}
            />
          )}
          <div className={s.sheetActions}>
            <Button variant="outline" onClick={closeDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!pickedRecordId || replenishMutation.isPending || !isOnline}
              onClick={() => pickedRecord && replenishMutation.mutate(pickedRecord)}
            >
              {replenishMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={dialog === 'claim'} onClose={closeDialog} title={t('abnormal.dialogClaimTitle')}>
        <div className={s.sheetBody}>
          <p className={s.sheetHint}>{t('abnormal.dialogClaimHint')}</p>
          {claimRecords.length === 0 ? (
            <p className={s.sheetHint}>{t('abnormal.noEligibleRecords')}</p>
          ) : (
            <SelectField
              label={t('abnormal.selectRecord')}
              options={recordOptions(claimRecords)}
              value={pickedRecordId}
              onChange={(event) => setPickedRecordId(event.currentTarget.value)}
            />
          )}
          <div className={s.sheetActions}>
            <Button variant="outline" onClick={closeDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!pickedRecordId || claimMutation.isPending}
              onClick={() => pickedRecord && claimMutation.mutate(pickedRecord)}
            >
              {claimMutation.isPending ? t('common.loading') : t('abnormal.dialogClaimConfirm')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={dialog === 'flow'} onClose={closeDialog} title={t('abnormal.flowDialogTitle')}>
        <div className={s.sheetBody}>
          <div>
            <h4 className={s.sheetSectionTitle}>{t('abnormal.flowCreateTitle')}</h4>
            <p className={s.sheetHint}>{t('abnormal.flowCreateBody')}</p>
          </div>
          <div>
            <h4 className={s.sheetSectionTitle}>{t('abnormal.flowStagesTitle')}</h4>
            <p className={s.sheetHint} style={{ marginBottom: themeVars.space2 }}>
              {t('abnormal.flowStagesBody')}
            </p>
            <div className={s.flowStages}>
              {FLOW_STAGE_ORDER.map((stage, i) => (
                <span key={stage} className={s.flowStage}>
                  {i > 0 && (
                    <span className={s.flowArrow} aria-hidden>
                      →
                    </span>
                  )}
                  <span className={getProgressBadgeClass(stage)}>{progressLabel(stage)}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className={s.sheetSectionTitle}>{t('abnormal.flowClaimTitle')}</h4>
            <p className={s.sheetHint}>{t('abnormal.flowClaimBody')}</p>
          </div>
          <div className={s.sheetActions}>
            <Button variant="quiet" onClick={closeDialog}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={closeDialog} title={t('abnormal.dialogAddTitle')}>
        <div className={s.sheetBody}>
          <p className={s.sheetHint}>{t('abnormal.dialogAddHint')}</p>
          <SelectField
            label={t('abnormal.addItemLabel')}
            options={activeItems.map((item) => ({ value: item.id, label: item.name }))}
            value={addForm.itemId}
            onChange={(event) => setAddForm({ ...addForm, itemId: event.currentTarget.value })}
          />
          <SelectField
            label={t('abnormal.addTypeLabel')}
            options={[
              { value: 'lost', label: t('abnormal.typeLost') },
              { value: 'stolen', label: t('abnormal.typeStolen') },
              { value: 'damaged', label: t('abnormal.typeDamaged') },
            ]}
            value={addForm.type}
            onChange={(event) => setAddForm({ ...addForm, type: event.currentTarget.value })}
          />
          <DatePickerField
            label={t('abnormal.addDateLabel')}
            value={addForm.date}
            onChange={(value) => setAddForm({ ...addForm, date: value })}
          />
          <TextField
            label={t('abnormal.addLossLabel', { currency: defaultCurrency })}
            type="number"
            value={addForm.loss}
            onChange={(event) => setAddForm({ ...addForm, loss: event.currentTarget.value })}
          />
          <TextareaField
            label={t('abnormal.addNotesLabel')}
            value={addForm.notes}
            onChange={(event) => setAddForm({ ...addForm, notes: event.currentTarget.value })}
          />
          <div className={s.sheetActions}>
            <Button variant="outline" onClick={closeDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!addForm.itemId || addMutation.isPending || !isOnline}
              onClick={() => addMutation.mutate(addForm)}
            >
              {addMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ── 子组件 ────────────────────────────────────────────────────────────────────

/** 快览计数点的颜色，与图表配色保持一致 */
const TYPE_DOT_COLORS: Record<string, string> = {
  lost: 'var(--havit-info)',
  stolen: 'var(--havit-amber)',
  unreturned: 'var(--havit-violet)',
  damaged: 'var(--havit-danger)',
};

/** 卡内事实单元格：可选图标 + 小标签 + 值 */
function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ size?: number | string }>;
  label: string;
  value: string;
}) {
  return (
    <div className={s.fact}>
      <span className={s.factLabel}>
        {Icon && (
          <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: '3px' }}>
            <Icon size={11} />
          </span>
        )}
        {label}
      </span>
      <span className={s.factValue}>{value}</span>
    </div>
  );
}

/** 底部洞察卡统一骨架：卡头（标题 + 补充信息）与内容 */
function InsightCard({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={s.insightCard}>
      <div className={s.insightHead}>
        <h3 className={s.insightTitle}>{title}</h3>
        {meta != null && <span className={s.insightMeta}>{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
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

function DonutChart({
  segments,
  totalLabel,
  size = 112,
  strokeWidth = 13,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  totalLabel: string;
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={totalLabel}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--havit-line-soft)" strokeWidth={strokeWidth} />
        <text
          x={center}
          y={center - 1}
          textAnchor="middle"
          fill="var(--havit-muted)"
          fontSize="20"
          fontWeight="600"
          fontFamily={themeVars.fontSerif}
        >
          0
        </text>
        <text x={center} y={center + 14} textAnchor="middle" fill="var(--havit-muted)" fontSize="9">
          {totalLabel}
        </text>
      </svg>
    );
  }

  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={totalLabel}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--havit-line-soft)" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        if (seg.value <= 0) return null;
        const pct = seg.value / total;
        // 微量重叠避免相邻扇区之间出现发丝缝隙
        const dashLen = circumference * pct + 0.8;
        const dashOff = circumference * accumulated;
        accumulated += pct;
        return (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={-dashOff}
            transform={`rotate(-90 ${center} ${center})`}
          />
        );
      })}
      <text
        x={center}
        y={center - 1}
        textAnchor="middle"
        fill="var(--havit-ink)"
        fontSize="22"
        fontWeight="600"
        fontFamily={themeVars.fontSerif}
      >
        {total}
      </text>
      <text x={center} y={center + 14} textAnchor="middle" fill="var(--havit-muted)" fontSize="9">
        {totalLabel}
      </text>
    </svg>
  );
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function localizedMonth(abbr: string, locale: string): string {
  const idx = MONTH_ABBR.indexOf(abbr);
  if (idx < 0) return abbr;
  try {
    return new Date(2026, idx, 1).toLocaleDateString(locale, { month: 'short' });
  } catch {
    return abbr;
  }
}

function TrendLineChart({
  data,
  locale,
  emptyLabel,
  ariaLabel,
}: {
  data: Array<{ month: string; count: number }>;
  locale: string;
  emptyLabel: string;
  ariaLabel: string;
}) {
  if (data.length === 0) {
    return <div className={s.chartEmpty}>{emptyLabel}</div>;
  }

  const W = 300;
  const H = 150;
  const PX = 10;
  const PT = 16;
  const PB = 22;
  const innerW = W - PX * 2;
  const innerH = H - PT - PB;
  const baseline = PT + innerH;

  const max = Math.max(...data.map((d) => d.count), 1);
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: PX + i * step,
    y: baseline - (d.count / max) * innerH,
  }));

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${lineD} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`;

  return (
    <svg className={s.trendSvg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id="abnormal-mobile-trend-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--havit-danger)" stopOpacity={0.16} />
          <stop offset="100%" stopColor="var(--havit-danger)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((pct) => {
        const y = baseline - pct * innerH;
        return <line key={pct} x1={PX} y1={y} x2={W - PX} y2={y} stroke="var(--havit-line-soft)" strokeWidth="1" />;
      })}
      <line x1={PX} y1={baseline} x2={W - PX} y2={baseline} stroke="var(--havit-line)" strokeWidth="1" />
      <path d={areaD} fill="url(#abnormal-mobile-trend-area)" stroke="none" />
      <path
        d={lineD}
        fill="none"
        stroke="var(--havit-danger)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <g key={i}>
          {data[i].count > 0 && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fill="var(--havit-ink)" fontSize="9.5" fontWeight="600">
              {data[i].count}
            </text>
          )}
          <circle cx={p.x} cy={p.y} r="3" fill="var(--havit-danger)" stroke="var(--havit-panel)" strokeWidth="1.5" />
          <text x={p.x} y={H - 6} textAnchor="middle" fill="var(--havit-muted)" fontSize="8.5">
            {localizedMonth(data[i].month, locale)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AbnormalPager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const range = usePaginationRange({ page, totalPages });
  return (
    <Pagination className={uiStyles.abnormalPagination}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious disabled={page === 1} onClick={() => onChange(page - 1)} />
        </PaginationItem>
        {range.map((p) => (
          <PaginationItem key={p}>
            {typeof p === 'number' ? (
              <PaginationLink isActive={p === page} onClick={() => onChange(p)}>
                {p}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext disabled={page === totalPages} onClick={() => onChange(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
