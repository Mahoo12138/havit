import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconCalendarClock,
  IconCircleCheck,
  IconClock,
  IconEye,
  IconFilter,
  IconPackage,
  IconPlus,
  IconSearch,
  IconUser,
} from '@tabler/icons-react';
import { Button } from '../../components/ui/button';
import { DatePickerField } from '../../components/ui/date-picker-field';
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
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { TabsNav } from '../../components/ui/tabs-nav';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { itemsApi, loansApi, type LoanWithItem } from '../../api/client';
import * as s from './loansMobile.css';

type TabKey = 'active' | 'returned' | 'overdue' | 'all';
type LoanState = 'active' | 'overdue' | 'due_soon' | 'returned';

const DUE_SOON_WINDOW = 3 * 24 * 60 * 60;

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 借出管理 · 移动端实现。
 *
 * 桌面版首屏把 5 张指标大卡铺开，窄屏下它们会退化成单列全宽、把借出列表
 * 整个挤出屏幕——这就是「几个卡片占满了」的来源。移动端因此重新分配首屏
 * 预算：指标压成 2 列小磁贴，逾期改由列表上方的一条提示承接，用户一进来
 * 就能看到真正要处理的借出记录。
 */
export function LoansMobile() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBorrower, setFilterBorrower] = useState('');

  const [dialog, setDialog] = useState<null | 'create' | 'return' | 'unreturned'>(null);
  const [targetLoanId, setTargetLoanId] = useState<string | null>(null);

  const [itemId, setItemId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [dueAt, setDueAt] = useState('');

  const [compensation, setCompensation] = useState('');
  const [compensationCurrency, setCompensationCurrency] = useState('CNY');
  const [settlementNotes, setSettlementNotes] = useState('');

  const { data: loanListData, isLoading } = useQuery({
    queryKey: ['loans', 'list'],
    queryFn: () => loansApi.list(),
  });
  const loans = useMemo(() => loanListData?.loans ?? [], [loanListData]);

  const { data: availableData } = useQuery({
    queryKey: ['items', 'inStock'],
    queryFn: () => itemsApi.list({ status: 'in_stock' }),
    enabled: dialog === 'create',
  });
  const availableItems = availableData?.items ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    loans.forEach((loan) => {
      if (loan.item_category) set.add(loan.item_category);
    });
    return Array.from(set).sort();
  }, [loans]);

  const borrowers = useMemo(() => {
    const set = new Set<string>();
    loans.forEach((loan) => {
      if (loan.borrower_name) set.add(loan.borrower_name);
    });
    return Array.from(set).sort();
  }, [loans]);

  const metrics = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const monthTs = Math.floor(thisMonthStart.getTime() / 1000);

    const m = {
      borrowedCount: 0,
      borrowedValue: 0,
      overdueCount: 0,
      overdueValue: 0,
      dueSoonCount: 0,
      dueSoonValue: 0,
      thisMonthCount: 0,
      thisMonthValue: 0,
      returnedCount: 0,
      returnedValue: 0,
      maxOverdueDays: 0,
    };

    loans.forEach((loan) => {
      const val = loan.item_purchase_price ?? 0;
      if (loan.loaned_at >= monthTs) {
        m.thisMonthCount++;
        m.thisMonthValue += val;
      }
      switch (loan.status) {
        case 'active':
          m.borrowedCount++;
          m.borrowedValue += val;
          if (loan.due_at) {
            if (loan.due_at < now) {
              m.overdueCount++;
              m.overdueValue += val;
              m.maxOverdueDays = Math.max(m.maxOverdueDays, Math.ceil((now - loan.due_at) / 86400));
            } else if (loan.due_at - now <= DUE_SOON_WINDOW) {
              m.dueSoonCount++;
              m.dueSoonValue += val;
            }
          }
          break;
        case 'unreturned':
          m.overdueCount++;
          m.overdueValue += val;
          break;
        case 'returned':
          m.returnedCount++;
          m.returnedValue += val;
          break;
      }
    });

    return m;
  }, [loans]);

  const visibleLoans = useMemo(() => {
    const tabbed = (() => {
      switch (activeTab) {
        case 'active':
          return loans.filter((loan) => loan.status === 'active');
        case 'returned':
          return loans.filter((loan) => loan.status === 'returned');
        case 'overdue':
          return loans.filter((loan) => getLoanStatus(loan) === 'overdue');
        default:
          return loans;
      }
    })();

    const q = searchQuery.trim().toLowerCase();

    return tabbed.filter((loan) => {
      if (filterCategory && loan.item_category !== filterCategory) return false;
      if (filterBorrower && loan.borrower_name !== filterBorrower) return false;
      if (!q) return true;
      return [loan.item_name, loan.item_serial_number, loan.borrower_name, loan.borrower_contact]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [loans, activeTab, filterCategory, filterBorrower, searchQuery]);

  const targetLoan = useMemo(
    () => loans.find((loan) => loan.id === targetLoanId) ?? null,
    [loans, targetLoanId],
  );

  // 底部导航的「+」浮标：接管后打开新建借出
  useEffect(() => {
    function handlePrimaryAction(event: Event) {
      const custom = event as CustomEvent<{ path: string; handled: boolean }>;
      if (!custom.detail?.path.startsWith('/loans')) return;
      custom.detail.handled = true;
      if (isOnline) openCreate();
    }

    window.addEventListener('havit:mobile-primary-action', handlePrimaryAction);
    return () => window.removeEventListener('havit:mobile-primary-action', handlePrimaryAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const invalidateLoans = () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    queryClient.invalidateQueries({ queryKey: ['loans'] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      loansApi.create(itemId, {
        borrower_name: borrowerName,
        borrower_contact: borrowerContact || undefined,
        due_at: dueAt ? Math.floor(new Date(dueAt).getTime() / 1000) : undefined,
      }),
    onSuccess: () => {
      invalidateLoans();
      closeDialog();
      toast.show(t('loans.loanRegistered'));
    },
    onError: (error) => toast.show(t('loans.loanFailed', { error: errorText(error) })),
  });

  const returnMutation = useMutation({
    mutationFn: (loanId: string) => loansApi.returnLoan(loanId),
    onSuccess: () => {
      invalidateLoans();
      closeDialog();
      toast.show(t('loans.itemReturned'));
    },
    onError: (error) => toast.show(t('loans.returnFailed', { error: errorText(error) })),
  });

  const unreturnMutation = useMutation({
    mutationFn: (loanId: string) =>
      loansApi.markUnreturned(loanId, {
        compensation: compensation ? Number(compensation) : undefined,
        compensation_currency: compensationCurrency || undefined,
        notes: settlementNotes || undefined,
      }),
    onSuccess: () => {
      invalidateLoans();
      closeDialog();
      toast.show(t('loans.markedUnreturned'));
    },
    onError: (error) => toast.show(t('loans.markUnreturnedFailed', { error: errorText(error) })),
  });

  function resetCreateForm() {
    setItemId('');
    setBorrowerName('');
    setBorrowerContact('');
    setDueAt('');
  }

  function openCreate() {
    resetCreateForm();
    setDialog('create');
  }

  function openReturn(loanId: string) {
    setTargetLoanId(loanId);
    setDialog('return');
  }

  function openUnreturned(loanId: string) {
    setTargetLoanId(loanId);
    setCompensation('');
    setCompensationCurrency('CNY');
    setSettlementNotes('');
    setDialog('unreturned');
  }

  function closeDialog() {
    setDialog(null);
    setTargetLoanId(null);
  }

  function clearFilters() {
    setFilterCategory('');
    setFilterBorrower('');
  }

  function showOverdue() {
    setActiveTab('overdue');
    clearFilters();
    setSearchQuery('');
  }

  function getStatusLabel(status: LoanState): string {
    switch (status) {
      case 'active': return t('loans.statusBorrowed');
      case 'overdue': return t('loans.statusOverdue');
      case 'due_soon': return t('loans.statusDueSoon');
      case 'returned': return t('loans.statusReturned');
    }
  }

  function formatMoney(value?: number, currency?: string): string {
    if (value == null) return '-';
    const sym = currency ?? t('common.currencySymbol');
    return `${sym}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(ts?: number): string {
    if (!ts) return '-';
    const d = new Date(ts * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** 归还倒计时：逾期为红、3 天内为橙、其余为常规墨色 */
  function formatDueInfo(loan: LoanWithItem): { text: string; tone: LoanState } {
    if (loan.status === 'returned') return { text: t('loans.statusReturned'), tone: 'returned' };
    if (!loan.due_at) return { text: '-', tone: 'active' };
    const now = Math.floor(Date.now() / 1000);
    const days = Math.ceil((loan.due_at - now) / 86400);
    if (days < 0) return { text: t('loans.daysOverdue', { count: Math.abs(days) }), tone: 'overdue' };
    if (days <= 3) return { text: t('loans.daysRemaining', { count: days }), tone: 'due_soon' };
    return { text: t('loans.daysRemaining', { count: days }), tone: 'active' };
  }

  const tabs = [
    { key: 'active', label: t('loans.tabActive') },
    { key: 'returned', label: t('loans.tabReturned') },
    { key: 'overdue', label: t('loans.tabOverdue') },
    { key: 'all', label: t('loans.tabAll') },
  ];

  const hasFilter = Boolean(filterCategory || filterBorrower);
  const filtered = hasFilter || searchQuery.trim().length > 0;

  const kpiTiles = [
    {
      icon: IconPackage,
      tone: 'blue' as const,
      label: t('loans.metricBorrowed'),
      value: metrics.borrowedCount,
    },
    {
      icon: IconAlertTriangle,
      tone: metrics.overdueCount > 0 ? ('red' as const) : ('neutral' as const),
      label: t('loans.metricOverdue'),
      value: metrics.overdueCount,
      danger: metrics.overdueCount > 0,
      onClick: metrics.overdueCount > 0 ? showOverdue : undefined,
    },
    {
      icon: IconCalendarClock,
      tone: 'orange' as const,
      label: t('loans.metricDueSoon'),
      value: metrics.dueSoonCount,
    },
    {
      icon: IconClock,
      tone: 'violet' as const,
      label: t('loans.metricThisMonth'),
      value: metrics.thisMonthCount,
    },
    {
      icon: IconCircleCheck,
      tone: 'green' as const,
      label: t('loans.metricReturned'),
      value: metrics.returnedCount,
      wide: true,
    },
  ];

  return (
    <div className={s.page}>
      {/* 逾期提示：桌面版在页面底部，移动端上移到首屏——逾期才是要立刻处理的 */}
      {metrics.overdueCount > 0 && (
        <div className={s.alertBanner}>
          <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span className={s.alertText}>
            <strong>{metrics.overdueCount}</strong> {t('loans.overdueUnits')}
            {metrics.maxOverdueDays > 0 && ` · ${t('loans.daysOverdue', { count: metrics.maxOverdueDays })}`}
          </span>
          <button type="button" className={s.alertLink} onClick={showOverdue}>
            {t('loans.viewAllOverdue')}
          </button>
        </div>
      )}

      {/* KPI 磁贴：5 张大卡压成 2 列小磁贴，首屏留给列表 */}
      <div className={s.statsScroll}>
        {kpiTiles.map((tile) => {
          const content = (
            <>
              <span className={`${s.statIcon} ${s.statIconTone[tile.tone]}`}>
                <tile.icon size={16} />
              </span>
              <span className={`${s.statValue} ${tile.danger ? s.statValueDanger : ''}`}>{tile.value}</span>
              <span className={s.statLabel}>{tile.label}</span>
            </>
          );
          const className = `${s.statTile} ${tile.wide ? s.statTileWide : ''}`;

          // 「已逾期」走 button：点一下直接跳到逾期分页，省掉「筛选 → 逾期」两步
          return tile.onClick ? (
            <button key={tile.label} type="button" className={`${className} ${s.statTileAction}`} onClick={tile.onClick}>
              {content}
            </button>
          ) : (
            <div key={tile.label} className={className}>
              {content}
            </div>
          );
        })}
      </div>

      <TabsNav value={activeTab} onChange={(value) => setActiveTab(value as TabKey)} tabs={tabs} />

      {/* 搜索 + 筛选 */}
      <div className={s.filterBar}>
        <span className={s.searchWrap}>
          <IconSearch size={16} className={s.searchIcon} />
          <Input
            className={s.searchInput}
            placeholder={t('loans.searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`${s.filterBtn} ${hasFilter ? s.filterBtnActive : ''}`}
          onClick={() => setShowFilters((prev) => !prev)}
          aria-label={t('loans.filterBorrower')}
          aria-expanded={showFilters}
        >
          <IconFilter size={16} />
        </Button>
      </div>

      {showFilters && (
        <div className={s.filterPanel}>
          <FilterSelect
            label={t('loans.filterAllCategories')}
            options={[{ value: '', label: t('loans.filterAllCategories') }, ...categories.map((c) => ({ value: c, label: c }))]}
            value={filterCategory}
            onChange={setFilterCategory}
          />
          <FilterSelect
            label={t('loans.filterBorrower')}
            options={[{ value: '', label: t('loans.filterBorrower') }, ...borrowers.map((b) => ({ value: b, label: b }))]}
            value={filterBorrower}
            onChange={setFilterBorrower}
          />
          {hasFilter && (
            <div className={s.clearRow} style={{ gridColumn: '1 / -1' }}>
              <Button variant="subtle" size="xs" onClick={clearFilters}>
                {t('loans.clearFilters')}
              </Button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className={s.centered}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className={s.listHead}>
            <span className={s.listCount}>
              {t('loans.totalItems', { count: visibleLoans.length })}
              {filtered ? ` · ${t('loans.filteredHint')}` : ''}
            </span>
          </div>

          {visibleLoans.length === 0 ? (
            <>
              <div className={s.emptyState}>{t('loans.noLoans')}</div>
              {activeTab === 'active' && !filtered && (
                <div className={s.emptyAction}>
                  <Button size="sm" leftSection={<IconPlus size={15} />} onClick={openCreate} disabled={!isOnline}>
                    {t('loans.newLoan')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className={s.cardList}>
              {visibleLoans.map((loan) => {
                const status = getLoanStatus(loan);
                const dueInfo = formatDueInfo(loan);
                const dueToneClass =
                  dueInfo.tone === 'overdue'
                    ? s.factValueOverdue
                    : dueInfo.tone === 'due_soon'
                      ? s.factValueDueSoon
                      : dueInfo.tone === 'returned'
                        ? s.factValueReturned
                        : '';
                const lendable = status !== 'returned';

                return (
                  <article key={loan.id} className={`${s.card} ${status === 'overdue' ? s.cardOverdue : ''}`}>
                    <div className={s.cardHeader}>
                      <span className={s.cardThumbPlaceholder}>{loan.item_name.charAt(0)}</span>
                      <div className={s.cardMeta}>
                        <span className={s.cardName}>{loan.item_name}</span>
                        <span className={s.cardSub}>
                          {loan.item_serial_number
                            ? t('common.sn', { number: loan.item_serial_number })
                            : loan.item_category ?? '-'}
                        </span>
                      </div>
                      <span className={`${s.statusBadge} ${s.statusBadgeTone[status]}`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <div className={s.cardFacts}>
                      <Fact icon={IconUser} label={t('loans.colBorrower')} value={loan.borrower_name} />
                      <Fact label={t('loans.borrowerContact')} value={loan.borrower_contact || '-'} />
                      <Fact label={t('loans.colLoanDate')} value={formatDate(loan.loaned_at)} />
                      <Fact
                        label={t('loans.colDueDate')}
                        value={formatDate(loan.due_at)}
                        sub={status === 'returned' ? undefined : dueInfo.text !== '-' ? dueInfo.text : undefined}
                        subClassName={dueToneClass}
                      />
                    </div>

                    <div className={s.cardFooter}>
                      <div className={s.cardValue}>
                        <span className={s.cardValueLabel}>{t('loans.colValue')}</span>
                        <span className={s.cardValueAmount}>
                          {formatMoney(loan.item_purchase_price, loan.item_purchase_currency)}
                        </span>
                      </div>
                      <div className={s.cardActions}>
                        <Link to="/items/$itemId" params={{ itemId: loan.item_id }} aria-label={t('loans.viewDetail')}>
                          <span className={s.iconBtn}>
                            <IconEye size={14} />
                          </span>
                        </Link>
                        {lendable && (
                          <>
                            <button
                              type="button"
                              className={`${s.actionBtn} ${s.actionBtnPrimary}`}
                              disabled={!isOnline}
                              onClick={() => openReturn(loan.id)}
                            >
                              {t('loans.returnItem')}
                            </button>
                            <button
                              type="button"
                              className={`${s.actionBtn} ${s.actionBtnMuted}`}
                              disabled={!isOnline}
                              onClick={() => openUnreturned(loan.id)}
                            >
                              {t('loans.markUnreturnedShort')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── 新建借出 ─────────────────────────────────────────────────────────── */}

      <Dialog open={dialog === 'create'} onClose={closeDialog} title={t('loans.registerLoan')}>
        <div className={s.sheetBody}>
          <p className={s.sheetHint}>{t('loans.createHint')}</p>
          <SelectField
            label={t('loans.colItem')}
            options={availableItems.map((item) => ({
              value: item.id,
              label: item.serial_number ? `${item.name}（${item.serial_number}）` : item.name,
            }))}
            value={itemId}
            onChange={(event) => setItemId(event.currentTarget.value)}
            placeholder={availableItems.length ? t('loans.selectItem') : t('loans.noAvailableItems')}
            disabled={!availableItems.length}
          />
          <TextField
            label={t('loans.borrowerName')}
            value={borrowerName}
            onChange={(event) => setBorrowerName(event.currentTarget.value)}
          />
          <TextField
            label={t('loans.borrowerContact')}
            value={borrowerContact}
            onChange={(event) => setBorrowerContact(event.currentTarget.value)}
          />
          <DatePickerField label={t('loans.dueDate')} value={dueAt} onChange={setDueAt} />
          <div className={s.sheetActions}>
            <Button variant="outline" onClick={closeDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!itemId || !borrowerName || createMutation.isPending || !isOnline}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── 归还 ─────────────────────────────────────────────────────────────── */}

      <Dialog open={dialog === 'return'} onClose={closeDialog} title={t('loans.returnItem')}>
        <div className={s.sheetBody}>
          {targetLoan && <SheetTarget loan={targetLoan} />}
          <p className={s.sheetHint}>{t('loans.returnHint')}</p>
          <div className={s.sheetActions}>
            <Button variant="outline" onClick={closeDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!targetLoanId || returnMutation.isPending || !isOnline}
              onClick={() => targetLoanId && returnMutation.mutate(targetLoanId)}
            >
              {returnMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── 标记未还（遗失） ─────────────────────────────────────────────────── */}

      <Dialog open={dialog === 'unreturned'} onClose={closeDialog} title={t('loans.markUnreturned')}>
        <div className={s.sheetBody}>
          {targetLoan && <SheetTarget loan={targetLoan} />}
          <p className={s.sheetHint}>{t('loans.unreturnedHint')}</p>
          <TextField
            label={t('loans.compensation')}
            type="number"
            value={compensation}
            onChange={(event) => setCompensation(event.currentTarget.value)}
          />
          <TextField
            label={t('loans.compensationCurrency')}
            value={compensationCurrency}
            onChange={(event) => setCompensationCurrency(event.currentTarget.value)}
          />
          <TextField
            label={t('loans.settlementNotes')}
            value={settlementNotes}
            onChange={(event) => setSettlementNotes(event.currentTarget.value)}
          />
          <div className={s.sheetActions}>
            <Button variant="outline" onClick={closeDialog}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!targetLoanId || unreturnMutation.isPending || !isOnline}
              onClick={() => targetLoanId && unreturnMutation.mutate(targetLoanId)}
            >
              {unreturnMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ── 子组件 ────────────────────────────────────────────────────────────────────

/** 卡内事实单元格：可选图标 + 小标签 + 值（+ 可选的次级状态行） */
function Fact({
  icon: Icon,
  label,
  value,
  sub,
  subClassName,
}: {
  icon?: React.ComponentType<{ size?: number | string }>;
  label: string;
  value: string;
  sub?: string;
  subClassName?: string;
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
      {sub && <span className={`${s.factValue} ${subClassName ?? ''}`}>{sub}</span>}
    </div>
  );
}

/** 弹窗里回显操作对象，避免在小屏上误点「确认」后才发现选错记录 */
function SheetTarget({ loan }: { loan: LoanWithItem }) {
  const { t } = useTranslation();
  return (
    <div className={s.sheetTarget}>
      <span className={s.cardThumbPlaceholder}>{loan.item_name.charAt(0)}</span>
      <div className={s.sheetTargetMeta}>
        <span className={s.sheetTargetName}>{loan.item_name}</span>
        <span className={s.sheetTargetSub}>
          {t('loans.colBorrower')}：{loan.borrower_name}
        </span>
      </div>
    </div>
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

// DB status plus due-date-derived states: a past-due loan keeps status
// 'active' in the database until it is settled, so the UI derives
// overdue/due_soon from due_at; 'unreturned' is always overdue.
function getLoanStatus(loan: LoanWithItem): LoanState {
  if (loan.status === 'returned') return 'returned';
  if (loan.status === 'unreturned') return 'overdue';
  const now = Math.floor(Date.now() / 1000);
  if (loan.due_at && loan.due_at < now) return 'overdue';
  if (loan.due_at && loan.due_at - now <= DUE_SOON_WINDOW) return 'due_soon';
  return 'active';
}
