import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconSettings, IconDotsVertical, IconAlertTriangle, IconClipboardList, IconEye } from '@tabler/icons-react';
import { Button, Card, DatePickerField, Dialog, SelectField, Spinner, Stack, Tabs, TextField, uiStyles } from '../../components/ui';
import { itemsApi, loansApi, type Loan } from '../../api/client';

type TabKey = 'active' | 'returned' | 'overdue' | 'all';

export function LoansDesktop() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBorrower, setFilterBorrower] = useState('');


  const [itemId, setItemId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [dueAt, setDueAt] = useState('');

  const [returnLoanId, setReturnLoanId] = useState<string | null>(null);

  const { data: borrowedItemsData, isLoading: borrowedLoading } = useQuery({
    queryKey: ['items', 'borrowed'],
    queryFn: () => itemsApi.list({ status: 'borrowed' }),
  });

  const borrowedItems = borrowedItemsData?.items ?? [];

  const loanQueries = useQuery({
    queryKey: ['loans', 'allBorrowed', borrowedItems.map((i) => i.id)],
    queryFn: async () => {
      const results = await Promise.all(
        borrowedItems.map(async (item) => {
          try {
            const { loans } = await loansApi.listForItem(item.id);
            const active = loans.find((l) => l.status === 'active' || l.status === 'unreturned');
            return { item, loan: active ?? loans[0] };
          } catch {
            return { item, loan: null };
          }
        }),
      );
      return results;
    },
    enabled: borrowedItems.length > 0,
  });

  const loanData = loanQueries.data ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    loanData.forEach(({ item }) => {
      if (item?.category) set.add(item.category);
    });
    return Array.from(set);
  }, [loanData]);

  const borrowers = useMemo(() => {
    const set = new Set<string>();
    loanData.forEach(({ loan }) => {
      if (loan?.borrower_name) set.add(loan.borrower_name);
    });
    return Array.from(set);
  }, [loanData]);

  const filteredData = useMemo(() => {
    return loanData.filter(({ item, loan }) => {
      if (filterCategory && item?.category !== filterCategory) return false;
      if (filterBorrower && loan?.borrower_name !== filterBorrower) return false;
      if (filterStatus === 'active' && loan?.status !== 'active') return false;
      if (filterStatus === 'overdue' && loan?.status !== 'unreturned') return false;
      return true;
    });
  }, [loanData, filterCategory, filterBorrower, filterStatus]);

  const metrics = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const threeDays = 3 * 24 * 60 * 60;
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const monthTs = Math.floor(thisMonthStart.getTime() / 1000);

    let borrowedCount = 0;
    let borrowedValue = 0;
    let overdueCount = 0;
    let overdueValue = 0;
    let dueSoonCount = 0;
    let dueSoonValue = 0;
    let thisMonthCount = 0;
    let thisMonthValue = 0;

    loanData.forEach(({ item, loan }) => {
      if (!item) return;
      const val = item.purchase_price ?? 0;

      if (loan?.status === 'active') {
        borrowedCount++;
        borrowedValue += val;
        if (loan.loaned_at >= monthTs) {
          thisMonthCount++;
          thisMonthValue += val;
        }
        if (loan.due_at) {
          if (loan.due_at < now) {
            overdueCount++;
            overdueValue += val;
          } else if (loan.due_at - now <= threeDays) {
            dueSoonCount++;
            dueSoonValue += val;
          }
        }
      } else if (loan?.status === 'unreturned') {
        overdueCount++;
        overdueValue += val;
      }
    });

    return {
      borrowedCount,
      borrowedValue,
      overdueCount,
      overdueValue,
      dueSoonCount,
      dueSoonValue,
      thisMonthCount,
      thisMonthValue,
    };
  }, [loanData]);

  const createMutation = useMutation({
    mutationFn: () =>
      loansApi.create(itemId, {
        borrower_name: borrowerName,
        borrower_contact: borrowerContact || undefined,
        due_at: dueAt ? Math.floor(new Date(dueAt).getTime() / 1000) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', 'borrowed'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setShowCreate(false);
      resetCreateForm();
    },
  });

  const returnMutation = useMutation({
    mutationFn: (loanId: string) => loansApi.returnLoan(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', 'borrowed'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setReturnLoanId(null);
    },
  });

  function resetCreateForm() {
    setItemId('');
    setBorrowerName('');
    setBorrowerContact('');
    setDueAt('');
  }

  function getLoanStatus(loan: Loan): 'active' | 'overdue' | 'due_soon' | 'returned' {
    if (loan.status === 'returned') return 'returned';
    if (loan.status === 'unreturned') return 'overdue';
    const now = Math.floor(Date.now() / 1000);
    if (loan.due_at && loan.due_at < now) return 'overdue';
    if (loan.due_at && loan.due_at - now <= 3 * 24 * 60 * 60) return 'due_soon';
    return 'active';
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return t('loans.statusBorrowed');
      case 'overdue': return t('loans.statusOverdue');
      case 'due_soon': return t('loans.statusDueSoon');
      case 'returned': return t('loans.statusReturned');
      default: return status;
    }
  }

  function formatCurrency(value: number): string {
    const symbol = t('common.currencySymbol');
    return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(ts?: number): string {
    if (!ts) return '-';
    const d = new Date(ts * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDueInfo(loan: Loan): { text: string; isOverdue: boolean } {
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

  const isLoading = borrowedLoading || loanQueries.isLoading;

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

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as TabKey)} tabs={tabs} />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className={uiStyles.loanPageMetrics}>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricBorrowed')}</span>
              <span className={uiStyles.loanMetricValue}>{metrics.borrowedCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.totalValue')} {formatCurrency(metrics.borrowedValue)}</span>
            </div>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricOverdue')}</span>
              <span className={uiStyles.loanMetricValueDanger}>{metrics.overdueCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.totalValue')} {formatCurrency(metrics.overdueValue)}</span>
            </div>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricDueSoon')}</span>
              <span className={uiStyles.loanMetricValue}>{metrics.dueSoonCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.totalValue')} {formatCurrency(metrics.dueSoonValue)}</span>
            </div>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricThisMonth')}</span>
              <span className={uiStyles.loanMetricValue}>{metrics.thisMonthCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.totalValue')} {formatCurrency(metrics.thisMonthValue)}</span>
            </div>
            <div className={uiStyles.loanMetricCard}>
              <span className={uiStyles.loanMetricLabel}>{t('loans.metricMyReturns')}</span>
              <span className={uiStyles.loanMetricValue}>{metrics.borrowedCount}</span>
              <span className={uiStyles.loanMetricSub}>{t('loans.returnValue')} {formatCurrency(metrics.borrowedValue)}</span>
            </div>
          </div>

          <div className={uiStyles.loanFilterBar}>
            <SelectField
              label={t('items.status')}
              options={[
                { value: '', label: t('loans.filterAllStatus') },
                { value: 'active', label: t('loans.statusBorrowed') },
                { value: 'overdue', label: t('loans.statusOverdue') },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.currentTarget.value)}
            />
            <SelectField
              label={t('items.category')}
              options={[
                { value: '', label: t('loans.filterAllCategories') },
                ...categories.map((cat) => ({ value: cat, label: cat })),
              ]}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.currentTarget.value)}
            />
            <SelectField
              label={t('loans.filterBorrower')}
              options={[
                { value: '', label: t('loans.filterBorrower') },
                ...borrowers.map((b) => ({ value: b, label: b })),
              ]}
              value={filterBorrower}
              onChange={(e) => setFilterBorrower(e.currentTarget.value)}
            />
            <div className={uiStyles.loanToolbarActions}>
              <Button variant="subtle" className={uiStyles.loanFilterIconBtn} title={t('loans.filterDueDate')}>
                <IconClipboardList size={14} />
              </Button>
            </div>
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
                    filteredData.map(({ item, loan }) => {
                      if (!loan || !item) return null;
                      const status = getLoanStatus(loan);
                      const dueInfo = formatDueInfo(loan);
                      return (
                        <tr className={uiStyles.tableRow} key={loan.id}>
                          <td className={uiStyles.td}>
                            <div className={uiStyles.loanItemCell}>
                              {item.serial_number ? (
                                <div className={uiStyles.loanItemThumbPlaceholder}>
                                  {item.name.charAt(0)}
                                </div>
                              ) : (
                                <div className={uiStyles.loanItemThumbPlaceholder}>
                                  {item.name.charAt(0)}
                                </div>
                              )}
                              <div className={uiStyles.loanItemInfo}>
                                <div className={uiStyles.loanItemName}>{item.name}</div>
                                {item.serial_number && (
                                  <div className={uiStyles.loanItemSn}>{t('common.sn', { number: item.serial_number })}</div>
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
                            {item.purchase_price != null ? formatCurrency(item.purchase_price) : '-'}
                          </td>
                          <td className={uiStyles.td}>
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              <Button variant="subtle" className={uiStyles.loanActionBtn} title={t('loans.viewDetail')}>
                                <IconEye size={13} />
                              </Button>
                              {status === 'active' || status === 'overdue' || status === 'due_soon' ? (
                                <Button
                                  variant="subtle"
                                  className={uiStyles.loanActionBtn}
                                  onClick={() => setReturnLoanId(loan.id)}
                                >
                                  {t('loans.returnItem')}
                                </Button>
                              ) : null}
                              <Button variant="subtle" className={uiStyles.loanActionMore} title={t('common.more', { defaultValue: 'More' })}>
                                <IconDotsVertical size={14} />
                              </Button>
                            </div>
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
              filteredData.map(({ item, loan }) => {
                if (!loan || !item) return null;
                const status = getLoanStatus(loan);
                const dueInfo = formatDueInfo(loan);
                return (
                  <div className={uiStyles.loanMobileCard} key={loan.id}>
                    <div className={uiStyles.loanMobileItemRow}>
                      <div className={uiStyles.loanItemThumbPlaceholder}>
                        {item.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={uiStyles.loanItemName}>{item.name}</div>
                        {item.serial_number && (
                          <div className={uiStyles.loanItemSn}>{t('common.sn', { number: item.serial_number })}</div>
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
                        {item.purchase_price != null ? formatCurrency(item.purchase_price) : '-'}
                      </span>
                    </div>
                    <div className={uiStyles.loanMobileRow}>
                      <Button variant="subtle" className={uiStyles.loanActionBtn}>
                        <IconEye size={13} /> {t('loans.viewDetail')}
                      </Button>
                      {(status === 'active' || status === 'overdue' || status === 'due_soon') && (
                        <Button
                          variant="subtle"
                          className={uiStyles.loanActionBtn}
                          onClick={() => setReturnLoanId(loan.id)}
                        >
                          {t('loans.returnItem')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--havit-muted)', fontSize: '0.85rem' }}>
            <span>{t('loans.totalItems', { count: filteredData.length })}</span>
          </div>

          {metrics.overdueCount > 0 && (
            <div className={uiStyles.loanBottomCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconAlertTriangle size={16} color="var(--havit-danger)" />
                  <h3 className={uiStyles.loanBottomTitle}>{t('loans.overdueReminder')}</h3>
                </div>
                <Button variant="subtle" style={{ fontWeight: 500 }}>
                  {t('loans.viewAllOverdue')}
                </Button>
              </div>
              <p style={{ color: 'var(--havit-muted)', fontSize: '0.85rem', margin: 0 }}>
                {metrics.overdueCount} {t('loans.overdueReminderHint')}
              </p>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <Dialog open title={t('loans.registerLoan')} onClose={() => setShowCreate(false)}>
          <Stack>
            <TextField label={t('loans.itemId')} value={itemId} onChange={(e) => setItemId(e.target.value)} />
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

      <style>{`
        @media (max-width: 64em) {
          .loan-table-wrap { display: none; }
          .loan-mobile-list { display: flex !important; flex-direction: column; gap: 0.75rem; }
        }
      `}</style>
    </Stack>
  );
}
