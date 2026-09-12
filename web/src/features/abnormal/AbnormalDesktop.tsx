import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconEye,
  IconSearch,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconCircleCheck,
  IconShoppingCart,
  IconFileExport,
  IconClipboardList,
} from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { themeVars } from '../../styles/theme.css';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { Dialog } from '../../components/ui/dialog-compat';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { TextareaField } from '../../components/ui/textarea-field';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import {
  abnormalApi,
  itemsApi,
  preferencesApi,
  suppliesExtendedApi,
  tagsApi,
  type AbnormalListItem,
} from '../../api/client';

const PAGE_SIZE = 10;

// 可登记异常的物品状态（已退出台账的物品不能再新增异常）
const ACTIVE_ITEM_STATUSES = new Set(['in_stock', 'borrowed', 'idle', 'for_sale']);

const PROCESSING_STATUS_OPTIONS = [
  { key: 'reporting', labelKey: 'abnormal.progressReporting' },
  { key: 'searching', labelKey: 'abnormal.progressSearching' },
  { key: 'pending_compensation', labelKey: 'abnormal.progressPendingCompensation' },
  { key: 'compensated', labelKey: 'abnormal.progressCompensated' },
  { key: 'scrapped', labelKey: 'abnormal.progressScrapped' },
  { key: 'closed', labelKey: 'abnormal.progressClosed' },
];

function InlineSelect({
  value,
  placeholder,
  options,
  onChange,
  autoFocus,
}: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => onChange(nextValue ?? '')}
      items={[{ value: null, label: placeholder }, ...options]}
    >
      <SelectTrigger
        size="sm"
        className={uiStyles.abnormalFilterSelect}
        autoFocus={autoFocus}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          <SelectItem value={null}>{placeholder}</SelectItem>
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

// 处理进度图表配色：跟随主题变量以同时适配明暗两套面板
const PROGRESS_COLORS: Record<string, string> = {
  reporting: 'var(--havit-info)',
  searching: '#3f8ba6',
  pending_compensation: 'var(--havit-amber)',
  compensated: 'var(--havit-success)',
  scrapped: 'var(--havit-muted)',
  closed: '#5c8148',
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

export function AbnormalDesktop() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [dialog, setDialog] = useState<null | 'found' | 'replenish' | 'claim' | 'flow' | 'add'>(null);
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
    enabled: pickerOpen,
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

  function focusGlobalSearch() {
    document.querySelector<HTMLInputElement>('[class*="headerSearchInput"]')?.focus();
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      abnormalApi.updateProgress(id, { processing_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abnormal'] });
      setUpdateId(null);
    },
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

  function recordOptions(records: AbnormalListItem[]) {
    return records.map((r) => ({
      value: r.abnormal_id,
      label: `${r.name} · ${typeLabel(r.abnormal_type)} · ${formatDate(r.exit_date)}`,
    }));
  }

  const kpiMetrics = useMemo(() => {
    const s = stats ?? { total: 0, lost: 0, stolen: 0, unreturned: 0, damaged: 0 };
    // 占总资产的分母是台账物品总数，与仪表盘口径一致；分母为零时显示 0
    const pct = totalAssets > 0 ? ((s.total / totalAssets) * 100).toFixed(1) : '0';
    return [
      { label: t('abnormal.kpiTotal'), value: s.total, sub: t('abnormal.kpiOfTotal', { pct }) },
      { label: t('abnormal.kpiLost'), value: s.lost, sub: s.total > 0 ? `${((s.lost / s.total) * 100).toFixed(1)}%` : '0%' },
      { label: t('abnormal.kpiStolen'), value: s.stolen, sub: s.total > 0 ? `${((s.stolen / s.total) * 100).toFixed(1)}%` : '0%' },
      { label: t('abnormal.kpiUnreturned'), value: s.unreturned, sub: s.total > 0 ? `${((s.unreturned / s.total) * 100).toFixed(1)}%` : '0%' },
      { label: t('abnormal.kpiDamaged'), value: s.damaged, sub: s.total > 0 ? `${((s.damaged / s.total) * 100).toFixed(1)}%` : '0%' },
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

  function getTypeBadgeClass(type: string): string {
    return uiStyles.abnormalTypeBadge[type as keyof typeof uiStyles.abnormalTypeBadge] ?? uiStyles.abnormalTypeBadge.lost;
  }

  function getProgressBadgeClass(status: string): string {
    return uiStyles.abnormalProgressBadge[status as keyof typeof uiStyles.abnormalProgressBadge] ?? uiStyles.abnormalProgressBadge.pending;
  }

  function progressLabel(status: string): string {
    const opt = PROCESSING_STATUS_OPTIONS.find((o) => o.key === status);
    return opt ? t(opt.labelKey) : status;
  }

  function typeLabel(type: string): string {
    const map: Record<string, string> = {
      lost: t('abnormal.typeLost'),
      stolen: t('abnormal.typeStolen'),
      unreturned: t('abnormal.typeUnreturned'),
      damaged: t('abnormal.typeDamaged'),
    };
    return map[type] ?? type;
  }

  return (
    <Stack>
      <div className={uiStyles.abnormalPageHeader}>
        <div>
          <h2 className="page-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* <IconAlertTriangle size={20} style={{ color: 'var(--havit-danger, #9c2f1d)' }} /> */}
            {t('abnormal.title')}
          </h2>
          <p className="page-kicker" style={{ marginTop: '4px' }}>{t('abnormal.description')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="quiet" leftSection={<IconSearch size={15} />} onClick={focusGlobalSearch}>
            {t('abnormal.search')}
          </Button>
          <Button leftSection={<IconPlus size={15} />} onClick={() => { setPickedRecordId(''); setDialog('add'); }}>
            {t('abnormal.addRecord')}
          </Button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className={uiStyles.abnormalMetricStrip}>
        {kpiMetrics.map((m) => (
          <div className={uiStyles.abnormalMetricCard} key={m.label}>
            <span className={uiStyles.abnormalMetricLabel}>{m.label}</span>
            <span className={uiStyles.abnormalMetricValue}>{m.value}</span>
            <span className={uiStyles.abnormalMetricSub}>{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Alert Banner */}
      <div className={uiStyles.abnormalAlertBanner}>
        <IconAlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span>{t('abnormal.alertBanner')}</span>
        <button
          type="button"
          onClick={() => { setPickedRecordId(''); setDialog('flow'); }}
          style={{
            marginLeft: 'auto',
            color: 'var(--havit-danger)',
            fontSize: '0.78rem',
            whiteSpace: 'nowrap',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {t('abnormal.learnMore')} &gt;
        </button>
      </div>

      {/* Two-column layout: table + sidebar */}
      {listLoading ? (
        <Spinner />
      ) : (
        <div className={uiStyles.abnormalTwoCol}>
          {/* Left: main table */}
          <div>
            {/* Filter bar */}
            <div className={uiStyles.abnormalFilterBar}>
              <InlineSelect
                value={typeFilter}
                placeholder={t('abnormal.filterAllTypes')}
                options={[
                  { value: 'lost', label: t('abnormal.typeLost') },
                  { value: 'stolen', label: t('abnormal.typeStolen') },
                  { value: 'unreturned', label: t('abnormal.typeUnreturned') },
                  { value: 'damaged', label: t('abnormal.typeDamaged') },
                ]}
                onChange={(nextValue) => { setTypeFilter(nextValue); setPage(1); }}
              />
              <InlineSelect
                value={statusFilter}
                placeholder={t('abnormal.filterAllStatus')}
                options={PROCESSING_STATUS_OPTIONS.map((opt) => ({ value: opt.key, label: t(opt.labelKey) }))}
                onChange={(nextValue) => { setStatusFilter(nextValue); setPage(1); }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--havit-muted)' }}>
                {t('abnormal.totalItems', { count: total })}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <Button
                  variant="subtle"
                  className={uiStyles.abnormalActionBtn}
                  title={t('abnormal.exportReport')}
                  onClick={handleExportCsv}
                >
                  <IconDownload size={13} /> {t('abnormal.exportReport')}
                </Button>
              </div>
            </div>

            {/* Table */}
            <Card className="surface-card" padded={false}>
              <div className={uiStyles.tableWrap}>
                <table className={uiStyles.table}>
                  <thead>
                    <tr>
                      <th className={uiStyles.th}>{t('abnormal.colAsset')}</th>
                      <th className={uiStyles.th}>{t('abnormal.colType')}</th>
                      <th className={uiStyles.th}>{t('abnormal.colAbnormalTime')}</th>
                      <th className={uiStyles.th}>{t('abnormal.colLocation')}</th>
                      <th className={uiStyles.th}>{t('abnormal.colResponsible')}</th>
                      <th className={uiStyles.th}>{t('abnormal.colProgress')}</th>
                      <th className={uiStyles.th}>{t('abnormal.colUpdatedAt')}</th>
                      <th className={uiStyles.th}>{t('abnormal.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--havit-muted)' }}>
                          {t('abnormal.noRecords')}
                        </td>
                      </tr>
                    ) : items.map((item) => (
                      <tr className={uiStyles.tableRow} key={item.abnormal_id}>
                        <td className={uiStyles.td}>
                          <div className={uiStyles.abnormalItemCell}>
                            {item.photo_url ? (
                              <img src={item.photo_url} alt="" className={uiStyles.abnormalThumb} />
                            ) : (
                              <div className={uiStyles.abnormalThumbPlaceholder}>
                                {item.name.charAt(0)}
                              </div>
                            )}
                            <div className={uiStyles.abnormalItemInfo}>
                              <span className={uiStyles.abnormalItemName}>{item.name}</span>
                              {item.serial_number && (
                                <span className={uiStyles.abnormalItemSn}>SN: {item.serial_number}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={uiStyles.td}>
                          <span className={getTypeBadgeClass(item.abnormal_type)}>
                            {typeLabel(item.abnormal_type)}
                          </span>
                        </td>
                        <td className={uiStyles.td}>{formatDate(item.exit_date)}</td>
                        <td className={uiStyles.td}>
                          {item.location_name ?? '-'}
                        </td>
                        <td className={uiStyles.td}>
                          {item.responsible_person ?? '-'}
                        </td>
                        <td className={uiStyles.td}>
                          {updateId === item.abnormal_id ? (
                            <InlineSelect
                              value={updateStatus}
                              placeholder={t('abnormal.selectStatus')}
                              options={PROCESSING_STATUS_OPTIONS.map((opt) => ({ value: opt.key, label: t(opt.labelKey) }))}
                              autoFocus
                              onChange={(nextValue) => {
                                setUpdateStatus(nextValue);
                                if (nextValue) updateMutation.mutate({ id: item.abnormal_id, status: nextValue });
                                setUpdateId(null);
                              }}
                            />
                          ) : (
                            <span
                              className={getProgressBadgeClass(item.processing_status)}
                              style={{ cursor: 'pointer' }}
                              onClick={() => { setUpdateId(item.abnormal_id); setUpdateStatus(item.processing_status); }}
                            >
                              {progressLabel(item.processing_status)}
                            </span>
                          )}
                        </td>
                        <td className={uiStyles.td}>{formatDate(item.updated_at)}</td>
                        <td className={uiStyles.td}>
                          <Link to="/items/$itemId" params={{ itemId: item.item_id }}>
                            <Button variant="subtle" className={uiStyles.abnormalActionBtn} title={t('abnormal.viewItem')}>
                              <IconEye size={13} />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={uiStyles.abnormalPagination}>
                <Button
                  variant="subtle"
                  className={uiStyles.abnormalPageBtn}
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <IconChevronLeft size={12} />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    variant="subtle"
                    key={p}
                    className={`${uiStyles.abnormalPageBtn}${p === page ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="subtle"
                  className={uiStyles.abnormalPageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <IconChevronRight size={12} />
                </Button>
              </div>
            )}
          </div>

          {/* Right sidebar: compact card list */}
          <Card className="surface-card" padded={false}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--havit-line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--havit-ink)' }}>
                {t('abnormal.sidebarTitle')}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--havit-muted)' }}>
                {total} {t('abnormal.items')}
              </span>
            </div>
            {items.slice(0, 8).map((item) => (
              <div className={uiStyles.abnormalSidebarCard} key={item.abnormal_id}>
                {item.photo_url ? (
                  <img src={item.photo_url} alt="" className={uiStyles.abnormalThumb} />
                ) : (
                  <div className={uiStyles.abnormalSidebarIcon}>{item.name.charAt(0)}</div>
                )}
                <div className={uiStyles.abnormalSidebarInfo}>
                  <span className={uiStyles.abnormalSidebarName}>{item.name}</span>
                  <span className={uiStyles.abnormalSidebarMeta}>
                    <span className={getTypeBadgeClass(item.abnormal_type)} style={{ marginRight: '4px' }}>
                      {typeLabel(item.abnormal_type)}
                    </span>
                    {formatDate(item.exit_date)}
                  </span>
                  {item.responsible_person && (
                    <span className={uiStyles.abnormalSidebarMeta}>{item.responsible_person}</span>
                  )}
                </div>
                <Link to="/items/$itemId" params={{ itemId: item.item_id }}>
                  <Button variant="subtle" className={uiStyles.abnormalActionBtn} title={t('abnormal.viewItem')}>
                    <IconEye size={12} />
                  </Button>
                </Link>
              </div>
            ))}
            {totalPages > 1 && (
              <div className={uiStyles.abnormalPagination}>
                <Button
                  variant="subtle"
                  className={uiStyles.abnormalPageBtn}
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <IconChevronLeft size={12} />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    variant="subtle"
                    key={p}
                    className={`${uiStyles.abnormalPageBtn}${p === page ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="subtle"
                  className={uiStyles.abnormalPageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <IconChevronRight size={12} />
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Bottom dashboard */}
      <div className={uiStyles.abnormalBottomGrid}>
        {/* Quick actions */}
        <InsightCard title={t('abnormal.quickActions')}>
          <div className={uiStyles.abnormalQuickGrid}>
            {[
              {
                icon: <IconCircleCheck size={16} />,
                label: t('abnormal.actionMarkFound'),
                onClick: () => { setPickedRecordId(''); setDialog('found'); },
              },
              {
                icon: <IconShoppingCart size={16} />,
                label: t('abnormal.actionReplenish'),
                onClick: () => { setPickedRecordId(''); setDialog('replenish'); },
              },
              {
                icon: <IconFileExport size={16} />,
                label: t('abnormal.actionExportClaim'),
                onClick: () => { setPickedRecordId(''); setDialog('claim'); },
              },
              {
                icon: <IconClipboardList size={16} />,
                label: t('abnormal.actionViewFlow'),
                onClick: () => { setPickedRecordId(''); setDialog('flow'); },
              },
            ].map((action) => (
              <button
                type="button"
                className={uiStyles.abnormalQuickBtn}
                key={action.label}
                onClick={action.onClick}
              >
                <span className={uiStyles.abnormalQuickIcon}>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </InsightCard>

        {/* Trend chart */}
        <InsightCard
          title={t('abnormal.trendTitle')}
          meta={t('abnormal.trendWindow')}
        >
          <TrendLineChart
            data={trend}
            locale={i18n.language}
            emptyLabel={t('abnormal.noTrendData')}
            ariaLabel={`${t('abnormal.trendTitle')} · ${t('abnormal.trendWindow')}`}
          />
        </InsightCard>

        {/* Progress donut */}
        <InsightCard
          title={t('abnormal.progressTitle')}
          meta={t('abnormal.totalItems', { count: progressTotal })}
        >
          {progressTotal === 0 ? (
            <div className={uiStyles.abnormalDonutSolo}>
              <DonutChart segments={[]} totalLabel={t('abnormal.progressTotal')} />
            </div>
          ) : (
            <div className={uiStyles.abnormalDonutRow}>
              <DonutChart
                segments={progress.map((p) => ({
                  label: progressLabel(p.status),
                  value: p.count,
                  color: PROGRESS_COLORS[p.status] ?? PROGRESS_COLORS.scrapped,
                }))}
                totalLabel={t('abnormal.progressTotal')}
              />
              <div className={uiStyles.abnormalLegend}>
                {progress
                  .filter((p) => p.count > 0)
                  .map((p) => (
                    <div key={p.status} className={uiStyles.abnormalLegendItem}>
                      <span
                        className={uiStyles.abnormalLegendDot}
                        style={{ background: PROGRESS_COLORS[p.status] ?? PROGRESS_COLORS.scrapped }}
                      />
                      <span>{progressLabel(p.status)}</span>
                      <span className={uiStyles.abnormalLegendCount}>{p.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </InsightCard>

        {/* Loss valuation */}
        <InsightCard
          title={t('abnormal.valuationTitle')}
          foot={
            <button type="button" className={uiStyles.sectionLink}>
              {t('abnormal.viewDetails')}
              <IconChevronRight size={13} />
            </button>
          }
        >
          <div className={uiStyles.abnormalValuationRows}>
            <div className={uiStyles.abnormalValuationRow}>
              <span className={uiStyles.abnormalValuationLabel}>{t('abnormal.valuationTotal')}</span>
              <span className={uiStyles.abnormalValuationLeader} />
              <span className={uiStyles.abnormalValuationValue}>
                {formatCurrency(valuation?.total_estimated, valuation?.estimated_currency)}
              </span>
            </div>
            <div className={uiStyles.abnormalValuationRow}>
              <span className={uiStyles.abnormalValuationLabel}>{t('abnormal.valuationRecoverable')}</span>
              <span className={uiStyles.abnormalValuationLeader} />
              <span className={uiStyles.abnormalValuationValue} style={{ color: 'var(--havit-success)' }}>
                {formatCurrency(valuation?.recoverable_amount, valuation?.recoverable_currency)}
              </span>
            </div>
          </div>
        </InsightCard>
      </div>
      {/* Dialogs */}
      <Dialog open={dialog === 'found'} onClose={closeDialog} title={t('abnormal.dialogFoundTitle')}>
        <Stack style={{ gap: themeVars.space3 }}>
          <p className={uiStyles.help} style={{ margin: 0 }}>{t('abnormal.dialogFoundHint')}</p>
          {foundRecords.length === 0 ? (
            <p className={uiStyles.help} style={{ margin: 0 }}>{t('abnormal.noEligibleRecords')}</p>
          ) : (
            <SelectField
              label={t('abnormal.selectRecord')}
              options={recordOptions(foundRecords)}
              value={pickedRecordId}
              onChange={(event) => setPickedRecordId(event.currentTarget.value)}
            />
          )}
          <DialogActions>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button
              disabled={!pickedRecordId || markFoundMutation.isPending}
              onClick={() => pickedRecord && markFoundMutation.mutate(pickedRecord)}
            >
              {markFoundMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>

      <Dialog open={dialog === 'replenish'} onClose={closeDialog} title={t('abnormal.dialogReplenishTitle')}>
        <Stack style={{ gap: themeVars.space3 }}>
          <p className={uiStyles.help} style={{ margin: 0 }}>
            {t('abnormal.dialogReplenishHint', { tag: t('abnormal.replenishTag') })}
          </p>
          {replenishRecords.length === 0 ? (
            <p className={uiStyles.help} style={{ margin: 0 }}>{t('abnormal.noEligibleRecords')}</p>
          ) : (
            <SelectField
              label={t('abnormal.selectRecord')}
              options={recordOptions(replenishRecords)}
              value={pickedRecordId}
              onChange={(event) => setPickedRecordId(event.currentTarget.value)}
            />
          )}
          <DialogActions>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button
              disabled={!pickedRecordId || replenishMutation.isPending}
              onClick={() => pickedRecord && replenishMutation.mutate(pickedRecord)}
            >
              {replenishMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>

      <Dialog open={dialog === 'claim'} onClose={closeDialog} title={t('abnormal.dialogClaimTitle')}>
        <Stack style={{ gap: themeVars.space3 }}>
          <p className={uiStyles.help} style={{ margin: 0 }}>{t('abnormal.dialogClaimHint')}</p>
          {claimRecords.length === 0 ? (
            <p className={uiStyles.help} style={{ margin: 0 }}>{t('abnormal.noEligibleRecords')}</p>
          ) : (
            <SelectField
              label={t('abnormal.selectRecord')}
              options={recordOptions(claimRecords)}
              value={pickedRecordId}
              onChange={(event) => setPickedRecordId(event.currentTarget.value)}
            />
          )}
          <DialogActions>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button
              disabled={!pickedRecordId || claimMutation.isPending}
              onClick={() => pickedRecord && claimMutation.mutate(pickedRecord)}
            >
              {claimMutation.isPending ? t('common.loading') : t('abnormal.dialogClaimConfirm')}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>

      <Dialog open={dialog === 'flow'} onClose={closeDialog} title={t('abnormal.flowDialogTitle')}>
        <Stack style={{ gap: themeVars.space4 }}>
          <div>
            <h4 className={uiStyles.heading} style={{ margin: '0 0 4px', fontSize: '0.85rem' }}>
              {t('abnormal.flowCreateTitle')}
            </h4>
            <p className={uiStyles.help} style={{ margin: 0 }}>{t('abnormal.flowCreateBody')}</p>
          </div>
          <div>
            <h4 className={uiStyles.heading} style={{ margin: '0 0 4px', fontSize: '0.85rem' }}>
              {t('abnormal.flowStagesTitle')}
            </h4>
            <p className={uiStyles.help} style={{ margin: '0 0 8px' }}>{t('abnormal.flowStagesBody')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
              {FLOW_STAGE_ORDER.map((stage, i) => (
                <span key={stage} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {i > 0 && <span className={uiStyles.help} aria-hidden>→</span>}
                  <span className={getProgressBadgeClass(stage)}>{progressLabel(stage)}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className={uiStyles.heading} style={{ margin: '0 0 4px', fontSize: '0.85rem' }}>
              {t('abnormal.flowClaimTitle')}
            </h4>
            <p className={uiStyles.help} style={{ margin: 0 }}>{t('abnormal.flowClaimBody')}</p>
          </div>
          <DialogActions>
            <Button variant="quiet" onClick={closeDialog}>{t('common.close')}</Button>
          </DialogActions>
        </Stack>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={closeDialog} title={t('abnormal.dialogAddTitle')}>
        <Stack style={{ gap: themeVars.space3 }}>
          <p className={uiStyles.help} style={{ margin: 0 }}>{t('abnormal.dialogAddHint')}</p>
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
          <DialogActions>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button
              disabled={!addForm.itemId || addMutation.isPending}
              onClick={() => addMutation.mutate(addForm)}
            >
              {addMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** 弹窗底部操作区：主按钮靠右 */
function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: themeVars.space2,
        marginTop: themeVars.space2,
      }}
    >
      {children}
    </div>
 );
}

/** 底部洞察卡统一骨架：卡头（标题+补充信息）、内容、可选页脚 */
function InsightCard({
  title,
  meta,
  children,
  foot,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <Card className="surface-card">
      <div className={`${uiStyles.cardContent} ${uiStyles.abnormalPanelHead}`}>
        <h3 className={uiStyles.abnormalPanelTitle}>{title}</h3>
        {meta != null && <span className={uiStyles.abnormalPanelMeta}>{meta}</span>}
      </div>
      <div className={`${uiStyles.cardContent} ${uiStyles.abnormalPanelBody}`}>{children}</div>
      {foot && (
        <div className={`${uiStyles.cardContent} ${uiStyles.abnormalPanelFoot}`}>{foot}</div>
      )}
    </Card>
  );
}

function DonutChart({
  segments,
  totalLabel,
  size = 124,
  strokeWidth = 14,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  totalLabel: string;
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={totalLabel}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--havit-line-soft)"
          strokeWidth={strokeWidth}
        />
        <text
          x={center}
          y={center - 1}
          textAnchor="middle"
          fill="var(--havit-muted)"
          fontSize="22"
          fontWeight="600"
          fontFamily={themeVars.fontSerif}
        >
          0
        </text>
        <text x={center} y={center + 15} textAnchor="middle" fill="var(--havit-muted)" fontSize="9">
          {totalLabel}
        </text>
      </svg>
    );
  }

  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={totalLabel}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--havit-line-soft)"
        strokeWidth={strokeWidth}
      />
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
        fontSize="24"
        fontWeight="600"
        fontFamily={themeVars.fontSerif}
      >
        {total}
      </text>
      <text x={center} y={center + 15} textAnchor="middle" fill="var(--havit-muted)" fontSize="9">
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
    return <div className={uiStyles.abnormalChartEmpty}>{emptyLabel}</div>;
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
    <svg className={uiStyles.abnormalTrendSvg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id="abnormal-trend-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--havit-danger)" stopOpacity={0.16} />
          <stop offset="100%" stopColor="var(--havit-danger)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((pct) => {
        const y = baseline - pct * innerH;
        return (
          <line key={pct} x1={PX} y1={y} x2={W - PX} y2={y} stroke="var(--havit-line-soft)" strokeWidth="1" />
        );
      })}
      <line x1={PX} y1={baseline} x2={W - PX} y2={baseline} stroke="var(--havit-line)" strokeWidth="1" />
      <path d={areaD} fill="url(#abnormal-trend-area)" stroke="none" />
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
          <circle
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--havit-danger)"
            stroke="var(--havit-panel)"
            strokeWidth="1.5"
          />
          <text x={p.x} y={H - 6} textAnchor="middle" fill="var(--havit-muted)" fontSize="8.5">
            {localizedMonth(data[i].month, locale)}
          </text>
        </g>
      ))}
    </svg>
  );
}
