import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconSettings, IconAlertTriangle, IconEye } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { Dialog } from '../../components/ui/dialog-compat';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { TabsNav } from '../../components/ui/tabs-nav';
import { TextField } from '../../components/ui/text-field';
import { itemsApi, loansApi, type LoanWithItem } from '../../api/client';

type TabKey = 'active' | 'returned' | 'overdue' | 'all';
type LoanState = 'active' | 'overdue' | 'due_soon' | 'returned';

// Compact unlabeled select for the filter bar, mirroring the abnormal page.
function InlineSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => onChange(nextValue ?? '')}
      items={[{ value: null, label: placeholder }, ...options]}
    >
      <SelectTrigger size="sm" className={uiStyles.loanFilterSelect} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectItem value={null}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LoansDesktop() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [showCreate, setShowCreate] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBorrower, setFilterBorrower] = useState('');

  const [itemId, setItemId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [dueAt, setDueAt] = useState('');

  const [returnLoanId, setReturnLoanId] = useState<string | null>(null);
  const [unreturnLoanId, setUnreturnLoanId] = useState<string | null>(null);
  const [compensation, setCompensation] = useState('');
  const [compensationCurrency, setCompensationCurrency] = useState('CNY');
  const [settlementNotes, setSettlementNotes] = useState('');

  const { data: loanListData, isLoading } = useQuery({
    queryKey: ['loans', 'list'],
    queryFn: () => loansApi.list(),
  });
  const loans = loanListData?.loans ?? [];

  const { data: availableData } = useQuery({
    queryKey: ['items', 'inStock'],
    queryFn: () => itemsApi.list({ status: 'in_stock' }),
    enabled: showCreate,
  });
  const availableItems = availableData?.items ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    loans.forEach((loan) => {
      if (loan.item_category) set.add(loan.item_category);
    });
    return Array.from(set);
  }, [loans]);

  const borrowers = useMemo(() => {
    const set = new Set<string>();
    loans.forEach((loan) => {
      if (loan.borrower_name) set.add(loan.borrower_name);
    });
    return Array.from(set);
  }, [loans]);

  const tabFiltered = useMemo(() => {
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
  }, [loans, activeTab]);

  const filteredData = useMemo(() => {
    return tabFiltered.filter((loan) => {
      if (filterCategory && loan.item_category !== filterCategory) return false;
      if (filterBorrower && loan.borrower_name !== filterBorrower) return false;
      return true;
    });
  }, [tabFiltered, filterCategory, filterBorrower]);

  const overdueLoans = useMemo(
    () => loans.filter((loan) => getLoanStatus(loan) === 'overdue'),
    [loans],
  );

  const metrics = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const threeDays = 3 * 24 * 60 * 60;
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
            } else if (loan.due_at - now <= threeDays) {
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

  const createMutation = useMutation({
    mutationFn: () =>
      loansApi.create(itemId, {
        borrower_name: borrowerName,
        borrower_contact: borrowerContact || undefined,
        due_at: dueAt ? Math.floor(new Date(dueAt).getTime() / 1000) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setShowCreate(false);
      resetCreateForm();
    },
  });

  const returnMutation = useMutation({
    mutationFn: (loanId: string) => loansApi.returnLoan(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setReturnLoanId(null);
    },
  });

  const unreturnMutation = useMutation({
    mutationFn: (loanId: string) =>
      loansApi.markUnreturned(loanId, {
        compensation: compensation ? Number(compensation) : undefined,
        compensation_currency: compensationCurrency || undefined,
        notes: settlementNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setUnreturnLoanId(null);
      setCompensation('');
      setCompensationCurrency('CNY');
      setSettlementNotes('');
    },
  });

  function resetCreateForm() {
    setItemId('');
    setBorrowerName('');
    setBorrowerContact('');
    setDueAt('');
  }

  function goToOverdue() {
    setActiveTab('overdue');
    setFilterCategory('');
    setFilterBorrower('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  function formatDueInfo(loan: LoanWithItem): { text: string; isOverdue: boolean } {
    if (loan.status === 'returned' && loan.returned_at) {
      return { text: t('loans.statusReturned'), isOverdue: false };
    }
    if (!loan.due_at) return { text: '-', isOverdue: false };
    const now = Math.floor(Date.now() / 1000);
    const diff = loan.due_at - now;
    const days = Math.ceil(diff / (24 * 60 * 60));
    if (days < 0) {
      return { text: t('loans.daysOverdue', { count: Math.abs(days) }), isOverdue: true };
    }
    return { text: t('loans.daysRemaining', { count: days }), isOverdue: false };
  }

  const tabs = [
    { key: 'active' as TabKey, label: t('loans.tabActive') },
    { key: 'returned' as TabKey, label: t('loans.tabReturned') },
    { key: 'overdue' as TabKey, label: t('loans.tabOverdue') },
    { key: 'all' as TabKey, label: t('loans.tabAll') },
  ];

  function renderActions(loan: LoanWithItem, status: LoanState) {
    const lendable = status !== 'returned';
    return (
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <Link to="/items/$itemId" params={{ itemId: loan.item_id }}>
          <Button variant="subtle" className={uiStyles.loanActionBtn} title={t('loans.viewDetail')}>
            <IconEye size={13} />
          </Button>
        </Link>
        {lendable && (
          <Button
            variant="subtle"
            className={uiStyles.loanActionBtn}
            onClick={() => setReturnLoanId(loan.id)}
          >
            {t('loans.returnItem')}
          </Button>
        )}
        {lendable && (
          <Button
            variant="subtle"
            className={uiStyles.loanActionBtn}
            title={t('loans.markUnreturned')}
            onClick={() => setUnreturnLoanId(loan.id)}
          >
            {t('loans.markUnreturned')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Stack>
      <div className={uiStyles.loanPageHeader}>
        <div>
          <h2 className="page-heading" style={{ margin: 0 }}>{t('loans.title')}</h2>
          <p className={uiStyles.loanPageSubtitle}>{t('loans.description')}</p>
        </div>
        <div className={uiStyles.loanPageHeaderRight}>
          <Button
            leftSection={<IconPlus size={15} />}
            onClick={() => setShowCreate(true)}
          >
            {t('loans.newLoan')}
          </Button>
          <Button variant="quiet" leftSection={<IconSettings size={15} />}>
            {t('loans.settings')}
          </Button>
        </div>
      </div>

      <TabsNav value={activeTab} onChange={(v) => setActiveTab(v as TabKey)} tabs={tabs} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={uiStyles.loanPageMetrics}>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricBorrowed')}</span>
              <span className={uiStyles.loanMetricValue}>{metrics.borrowedCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.totalValue')} {formatMoney(metrics.borrowedValue, t('common.currencySymbol'))}</span>
            </div>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricOverdue')}</span>
              <span className={uiStyles.loanMetricValueDanger}>{metrics.overdueCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.totalValue')} {formatMoney(metrics.overdueValue, t('common.currencySymbol'))}</span>
            </div>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricDueSoon')}</span>
              <span className={uiStyles.loanMetricValue}>{metrics.dueSoonCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.totalValue')} {formatMoney(metrics.dueSoonValue, t('common.currencySymbol'))}</span>
            </div>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricThisMonth')}</span>
              <span className={uiStyles.loanMetricValue}>{metrics.thisMonthCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.totalValue')} {formatMoney(metrics.thisMonthValue, t('common.currencySymbol'))}</span>
            </div>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricReturned')}</span>
              <span className={uiStyles.loanMetricValue}>{metrics.returnedCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.returnedValue')} {formatMoney(metrics.returnedValue, t('common.currencySymbol'))}</span>
            </div>
          </div>

          <div className={uiStyles.loanFilterBar}>
            <InlineSelect
              value={filterCategory}
              placeholder={t('loans.filterAllCategories')}
              options={categories.map((cat) => ({ value: cat, label: cat }))}
              onChange={setFilterCategory}
            />
            <InlineSelect
              value={filterBorrower}
              placeholder={t('loans.filterBorrower')}
              options={borrowers.map((b) => ({ value: b, label: b }))}
              onChange={setFilterBorrower}
            />
            {(filterCategory || filterBorrower) && (
              <Button
                variant="subtle"
                className={uiStyles.loanActionBtn}
                onClick={() => { setFilterCategory(''); setFilterBorrower(''); }}
              >
                {t('loans.clearFilters')}
              </Button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--havit-muted)' }}>
              {t('loans.totalItems', { count: filteredData.length })}
            </span>
          </div>

          {/* Desktop table */}
          <Card className="surface-card loan-table-wrap" padded={false}>
            <div className={uiStyles.tableWrap}>
              <table className={uiStyles.table}>
                <thead>
                  <tr>
                    <th className={uiStyles.th}>{t('loans.colItem')}</th>
                    <th className={uiStyles.th}>{t('loans.colBorrower')}</th>
                    <th className={uiStyles.th}>{t('loans.colLoanDate')}</th>
                    <th className={uiStyles.th}>{t('loans.colDueDate')}</th>
                    <th className={uiStyles.th}>{t('loans.colStatus')}</th>
                    <th className={uiStyles.th}>{t('loans.colValue')}</th>
                    <th className={uiStyles.th}>{t('loans.colAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--havit-muted)' }}>
                        {t('loans.noLoans')}
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((loan) => {
                      const status = getLoanStatus(loan);
                      const dueInfo = formatDueInfo(loan);
                      return (
                        <tr className={uiStyles.tableRow} key={loan.id}>
                          <td className={uiStyles.td}>
                            <div className={uiStyles.loanItemCell}>
                              <div className={uiStyles.loanItemThumbPlaceholder}>
                                {loan.item_name.charAt(0)}
                              </div>
                              <div className={uiStyles.loanItemInfo}>
                                <div className={uiStyles.loanItemName}>{loan.item_name}</div>
                                {loan.item_serial_number && (
                                  <div className={uiStyles.loanItemSn}>{t('common.sn', { number: loan.item_serial_number })}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={uiStyles.td}>
                            <div>{loan.borrower_name}</div>
                            {loan.borrower_contact && (
                              <div className={uiStyles.loanItemSn}>{loan.borrower_contact}</div>
                            )}
                          </td>
                          <td className={uiStyles.td}>{formatDate(loan.loaned_at)}</td>
                          <td className={uiStyles.td}>
                            <div>{formatDate(loan.due_at)}</div>
                            {dueInfo.text !== '-' && (
                              <div style={{ color: dueInfo.isOverdue ? 'var(--havit-danger)' : 'var(--havit-muted)', fontSize: '0.78rem' }}>
                                {dueInfo.text}
                              </div>
                            )}
                          </td>
                          <td className={uiStyles.td}>
                            <span className={`${uiStyles.loanStatusBadgeBase} ${uiStyles.loanStatusBadge[status]}`}>
                              {getStatusLabel(status)}
                            </span>
                          </td>
                          <td className={uiStyles.td} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatMoney(loan.item_purchase_price, loan.item_purchase_currency)}
                          </td>
                          <td className={uiStyles.td}>
                            {renderActions(loan, status)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile card list */}
          <div className="loan-mobile-list" style={{ display: 'none' }}>
            {filteredData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--havit-muted)' }}>
                {t('loans.noLoans')}
              </div>
            ) : (
              filteredData.map((loan) => {
                const status = getLoanStatus(loan);
                const dueInfo = formatDueInfo(loan);
                return (
                  <div className={uiStyles.loanMobileCard} key={loan.id}>
                    <div className={uiStyles.loanMobileItemRow}>
                      <div className={uiStyles.loanItemThumbPlaceholder}>
                        {loan.item_name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={uiStyles.loanItemName}>{loan.item_name}</div>
                        {loan.item_serial_number && (
                          <div className={uiStyles.loanItemSn}>{t('common.sn', { number: loan.item_serial_number })}</div>
                        )}
                      </div>
                      <span className={`${uiStyles.loanStatusBadgeBase} ${uiStyles.loanStatusBadge[status]}`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    <div className={uiStyles.loanMobileMeta}>
                      <span className={uiStyles.loanMobileLabel}>{t('loans.colBorrower')}</span>
                      <span className={uiStyles.loanMobileValue}>{loan.borrower_name}</span>
                      <span className={uiStyles.loanMobileLabel}>{t('loans.colLoanDate')}</span>
                      <span className={uiStyles.loanMobileValue}>{formatDate(loan.loaned_at)}</span>
                      <span className={uiStyles.loanMobileLabel}>{t('loans.colDueDate')}</span>
                      <span className={uiStyles.loanMobileValue}>
                        {formatDate(loan.due_at)}
                        {dueInfo.text !== '-' && (
                          <span style={{ display: 'block', fontSize: '0.76rem', color: dueInfo.isOverdue ? 'var(--havit-danger)' : 'var(--havit-muted)' }}>
                            {dueInfo.text}
                          </span>
                        )}
                      </span>
                      <span className={uiStyles.loanMobileLabel}>{t('loans.colValue')}</span>
                      <span className={uiStyles.loanMobileValue}>
                        {formatMoney(loan.item_purchase_price, loan.item_purchase_currency)}
                      </span>
                    </div>
                    {renderActions(loan, status)}
                  </div>
                );
              })
            )}
          </div>

          {metrics.overdueCount > 0 && (
            <div className={uiStyles.loanBottomCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconAlertTriangle size={16} color="var(--havit-danger)" />
                  <h3 className={uiStyles.loanBottomTitle}>{t('loans.overdueReminder')}</h3>
                </div>
                <Button variant="subtle" style={{ fontWeight: 500 }} onClick={goToOverdue}>
                  {t('loans.viewAllOverdue')}
                </Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {overdueLoans.map((loan) => {
                  const dueInfo = formatDueInfo(loan);
                  return (
                    <div
                      key={loan.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 0',
                        borderTop: '1px solid var(--havit-line-soft)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <Link
                        to="/items/$itemId"
                        params={{ itemId: loan.item_id }}
                        className={uiStyles.loanItemName}
                      >
                        {loan.item_name}
                      </Link>
                      <span style={{ color: 'var(--havit-muted)' }}>
                        {t('loans.colBorrower')}: {loan.borrower_name}
                      </span>
                      <span style={{ marginLeft: 'auto', color: 'var(--havit-danger)', whiteSpace: 'nowrap' }}>
                        {dueInfo.isOverdue ? dueInfo.text : t('loans.statusOverdue')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <Dialog open title={t('loans.registerLoan')} onClose={() => setShowCreate(false)}>
          <Stack>
            <SelectField
              label={t('loans.colItem')}
              options={availableItems.map((item) => ({
                value: item.id,
                label: item.serial_number ? `${item.name}（${item.serial_number}）` : item.name,
              }))}
              value={itemId}
              onChange={(e) => setItemId(e.currentTarget.value)}
              placeholder={t('loans.selectItem')}
            />
            <TextField label={t('loans.borrowerName')} value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} />
            <TextField label={t('loans.borrowerContact')} value={borrowerContact} onChange={(e) => setBorrowerContact(e.target.value)} />
            <DatePickerField label={t('loans.dueDate')} value={dueAt} onChange={setDueAt} />
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!itemId || !borrowerName || createMutation.isPending}
            >
              {t('loans.registerLoan')}
            </Button>
          </Stack>
        </Dialog>
      )}

      {returnLoanId && (
        <Dialog open title={t('loans.returnItem')} onClose={() => setReturnLoanId(null)}>
          <Stack>
            <p style={{ color: 'var(--havit-text)' }}>
              {t('loans.returnItem')}？
            </p>
            <Button
              onClick={() => returnMutation.mutate(returnLoanId)}
              disabled={returnMutation.isPending}
            >
              {t('loans.returnItem')}
            </Button>
          </Stack>
        </Dialog>
      )}

      {unreturnLoanId && (
        <Dialog open title={t('loans.markUnreturned')} onClose={() => setUnreturnLoanId(null)}>
          <Stack>
            <p style={{ color: 'var(--havit-muted)', fontSize: '0.85rem', margin: 0 }}>
              {t('loans.unreturnedHint')}
            </p>
            <TextField
              label={t('loans.compensation')}
              type="number"
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
            />
            <TextField
              label={t('loans.compensationCurrency')}
              value={compensationCurrency}
              onChange={(e) => setCompensationCurrency(e.target.value)}
            />
            <TextField
              label={t('loans.settlementNotes')}
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
            />
            <Button
              onClick={() => unreturnMutation.mutate(unreturnLoanId)}
              disabled={unreturnMutation.isPending}
            >
              {t('loans.markUnreturned')}
            </Button>
          </Stack>
        </Dialog>
      )}

      <style>{`
        @media (max-width: 64em) {
          .loan-table-wrap { display: none; }
          .loan-mobile-list { display: flex !important; flex-direction: column; gap: 0.75rem; }
        }
      `}</style>
    </Stack>
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
  if (loan.due_at && loan.due_at - now <= 3 * 24 * 60 * 60) return 'due_soon';
  return 'active';
}
