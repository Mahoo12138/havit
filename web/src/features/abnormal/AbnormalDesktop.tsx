import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconEye,
  IconDotsVertical,
  IconSearch,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
} from '@tabler/icons-react';
import { Button, Card, Spinner, Stack, uiStyles } from '../../components/ui';
import { abnormalApi } from '../../api/client';

const PAGE_SIZE = 10;

const PROCESSING_STATUS_OPTIONS = [
  { key: 'reporting', labelKey: 'abnormal.progressReporting' },
  { key: 'searching', labelKey: 'abnormal.progressSearching' },
  { key: 'pending_compensation', labelKey: 'abnormal.progressPendingCompensation' },
  { key: 'compensated', labelKey: 'abnormal.progressCompensated' },
  { key: 'scrapped', labelKey: 'abnormal.progressScrapped' },
  { key: 'closed', labelKey: 'abnormal.progressClosed' },
];

const PROGRESS_COLORS: Record<string, string> = {
  reporting: '#3b82f6',
  searching: '#38bdf8',
  pending_compensation: '#f59e0b',
  compensated: '#22c55e',
  scrapped: '#94a3b8',
  closed: '#16a34a',
};

export function AbnormalDesktop() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');

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

  const kpiMetrics = useMemo(() => {
    const s = stats ?? { total: 0, lost: 0, stolen: 0, unreturned: 0, damaged: 0 };
    return [
      { label: t('abnormal.kpiTotal'), value: s.total, sub: t('abnormal.kpiOfTotal', { pct: total > 0 ? ((s.total / Math.max(total, 1)) * 100).toFixed(1) : '0' }) },
      { label: t('abnormal.kpiLost'), value: s.lost, sub: s.total > 0 ? `${((s.lost / s.total) * 100).toFixed(1)}%` : '0%' },
      { label: t('abnormal.kpiStolen'), value: s.stolen, sub: s.total > 0 ? `${((s.stolen / s.total) * 100).toFixed(1)}%` : '0%' },
      { label: t('abnormal.kpiUnreturned'), value: s.unreturned, sub: s.total > 0 ? `${((s.unreturned / s.total) * 100).toFixed(1)}%` : '0%' },
      { label: t('abnormal.kpiDamaged'), value: s.damaged, sub: s.total > 0 ? `${((s.damaged / s.total) * 100).toFixed(1)}%` : '0%' },
    ];
  }, [stats, total, t]);

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
            <IconAlertTriangle size={20} style={{ color: '#ef4444' }} />
            {t('abnormal.title')}
          </h2>
          <p className="page-kicker" style={{ marginTop: '4px' }}>{t('abnormal.description')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="quiet" leftSection={<IconSearch size={15} />}>
            {t('abnormal.search')}
          </Button>
          <Button leftSection={<IconPlus size={15} />}>
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
        <a href="#" style={{ marginLeft: 'auto', color: '#c0392b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          {t('abnormal.learnMore')} &gt;
        </a>
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
              <select
                className={uiStyles.abnormalFilterSelect}
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="">{t('abnormal.filterAllTypes')}</option>
                <option value="lost">{t('abnormal.typeLost')}</option>
                <option value="stolen">{t('abnormal.typeStolen')}</option>
                <option value="unreturned">{t('abnormal.typeUnreturned')}</option>
                <option value="damaged">{t('abnormal.typeDamaged')}</option>
              </select>
              <select
                className={uiStyles.abnormalFilterSelect}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">{t('abnormal.filterAllStatus')}</option>
                {PROCESSING_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>{t(opt.labelKey)}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--havit-muted)' }}>
                {t('abnormal.totalItems', { count: total })}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <Button variant="subtle" className={uiStyles.abnormalActionBtn} title={t('abnormal.exportReport')}>
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
                            <select
                              className={uiStyles.abnormalFilterSelect}
                              value={updateStatus}
                              onChange={(e) => setUpdateStatus(e.target.value)}
                              onBlur={() => {
                                if (updateStatus) updateMutation.mutate({ id: item.abnormal_id, status: updateStatus });
                                setUpdateId(null);
                              }}
                              autoFocus
                            >
                              <option value="">{t('abnormal.selectStatus')}</option>
                              {PROCESSING_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.key} value={opt.key}>{t(opt.labelKey)}</option>
                              ))}
                            </select>
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
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <Link to="/items/$itemId" params={{ itemId: item.item_id }}>
                              <Button variant="subtle" className={uiStyles.abnormalActionBtn}>
                                <IconEye size={13} />
                              </Button>
                            </Link>
                            <Button variant="subtle" className={uiStyles.abnormalMoreBtn}>
                              <IconDotsVertical size={14} />
                            </Button>
                          </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                  <Link to="/items/$itemId" params={{ itemId: item.item_id }}>
                    <Button variant="subtle" className={uiStyles.abnormalActionBtn}><IconEye size={12} /></Button>
                  </Link>
                  <Button variant="subtle" className={uiStyles.abnormalMoreBtn}><IconDotsVertical size={12} /></Button>
                </div>
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
        <Card className="surface-card">
          <div className={uiStyles.abnormalChartTitle}>{t('abnormal.quickActions')}</div>
          <div className={uiStyles.abnormalQuickActions}>
            {[
              { icon: '🔍', label: t('abnormal.actionMarkFound') },
              { icon: '🛒', label: t('abnormal.actionReplenish') },
              { icon: '📄', label: t('abnormal.actionExportClaim') },
              { icon: '📋', label: t('abnormal.actionViewFlow') },
            ].map((action) => (
               <Button variant="subtle" className={uiStyles.abnormalQuickBtn} key={action.label}>
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Trend chart */}
        <Card className="surface-card">
          <div className={uiStyles.abnormalChartTitle}>{t('abnormal.trendTitle')}</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--havit-muted)' }}>{t('abnormal.trendHint')}</span>
          <TrendLineChart data={trend} />
        </Card>

        {/* Progress donut */}
        <Card className="surface-card">
          <div className={uiStyles.abnormalChartTitle}>{t('abnormal.progressTitle')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <DonutChart
              segments={progress.map((p) => ({
                label: progressLabel(p.status),
                value: p.count,
                color: PROGRESS_COLORS[p.status] ?? '#94a3b8',
              }))}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem' }}>
              {progress.map((p) => (
                <div key={p.status} className={uiStyles.abnormalLegendItem}>
                  <div className={uiStyles.abnormalLegendDot} style={{ background: PROGRESS_COLORS[p.status] ?? '#94a3b8' }} />
                  <span>{progressLabel(p.status)}</span>
                  <span style={{ color: 'var(--havit-ink)', fontWeight: 600 }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Loss valuation */}
        <Card className="surface-card">
          <div className={uiStyles.abnormalChartTitle}>{t('abnormal.valuationTitle')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div className={uiStyles.abnormalValuationRow}>
              <span style={{ fontSize: '0.78rem', color: 'var(--havit-muted)' }}>{t('abnormal.valuationTotal')}</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--havit-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(valuation?.total_estimated, valuation?.estimated_currency)}
              </span>
            </div>
            <div className={uiStyles.abnormalValuationRow}>
              <span style={{ fontSize: '0.78rem', color: 'var(--havit-muted)' }}>{t('abnormal.valuationRecoverable')}</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--havit-success, #16a34a)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(valuation?.recoverable_amount, valuation?.recoverable_currency)}
              </span>
            </div>
            <Button variant="quiet" style={{ marginTop: '4px' }}>
              {t('abnormal.viewDetails')}
            </Button>
          </div>
        </Card>
      </div>
    </Stack>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DonutChart({
  segments,
  size = 110,
  strokeWidth = 18,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={(size - strokeWidth) / 2} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="var(--havit-muted)" fontSize="11">—</text>
      </svg>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let accumulated = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = circumference * pct;
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
      <text x={center} y={center - 5} textAnchor="middle" fill="var(--havit-ink)" fontSize="18" fontWeight="700">
        {total}
      </text>
      <text x={center} y={center + 12} textAnchor="middle" fill="var(--havit-muted)" fontSize="10">
        总数
      </text>
    </svg>
  );
}

function TrendLineChart({ data }: { data: Array<{ month: string; count: number }> }) {
  if (data.length === 0) return <div style={{ height: 100, color: 'var(--havit-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>暂无数据</div>;

  const W = 240, H = 100, PX = 30, PY = 10;
  const max = Math.max(...data.map((d) => d.count), 1);
  const step = (W - PX * 2) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: PX + i * step,
    y: H - PY - (d.count / max) * (H - PY * 2),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', height: '120px' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = H - PY - pct * (H - PY * 2);
        return (
          <line key={pct} x1={PX} y1={y} x2={W - PX} y2={y} stroke="var(--havit-line-soft, #e5e7eb)" strokeWidth="0.5" />
        );
      })}
      {/* Line */}
      <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#ef4444" />
          <text x={p.x} y={p.y - 7} textAnchor="middle" fill="var(--havit-ink)" fontSize="9" fontWeight="600">
            {data[i].count}
          </text>
          <text x={p.x} y={H + 12} textAnchor="middle" fill="var(--havit-muted)" fontSize="8">
            {data[i].month}
          </text>
        </g>
      ))}
    </svg>
  );
}
