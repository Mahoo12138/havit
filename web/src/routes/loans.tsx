import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Dialog, Spinner, Stack, StackTight, TextField, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { itemsApi, loansApi } from '../api/client';

export const Route = createFileRoute('/loans')({
  component: LoansPage,
});

function LoansPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [itemId, setItemId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [dueAt, setDueAt] = useState('');

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', 'borrowed'],
    queryFn: () => itemsApi.list({ status: 'borrowed' }),
  });

  const borrowedItems = itemsData?.items ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      loansApi.create(itemId, {
        borrower_name: borrowerName,
        borrower_contact: borrowerContact || undefined,
        due_at: dueAt ? Math.floor(new Date(dueAt).getTime() / 1000) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', 'borrowed'] });
      setShowCreate(false);
      setItemId('');
      setBorrowerName('');
      setBorrowerContact('');
      setDueAt('');
    },
  });

  return (
    <Stack>
      <FeatureHeader
        title={t('loans.title')}
        description={t('loans.description')}
        meta="handoff"
      />

      {itemsLoading ? (
        <Spinner />
      ) : (
        <>
          <MetricStrip
            metrics={[
              { label: t('loans.currentlyBorrowed'), value: borrowedItems.length },
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button leftSection={<IconPlus size={15} />} onClick={() => setShowCreate(true)}>
              {t('loans.registerLoan')}
            </Button>
          </div>

          <DataCard title={t('loans.loanList')}>
            <div className={uiStyles.cardGrid}>
              {borrowedItems.map((item) => (
                <Card className="surface-card" key={item.id}>
                  <StackTight>
                    <h3 className={uiStyles.heading}>{item.name}</h3>
                    <Badge>{item.status}</Badge>
                  </StackTight>
                </Card>
              ))}
            </div>
          </DataCard>
        </>
      )}

      {showCreate && (
        <Dialog open title={t('loans.registerLoan')} onClose={() => setShowCreate(false)}>
          <Stack>
            <TextField label={t('loans.itemId')} value={itemId} onChange={(e) => setItemId(e.target.value)} />
            <TextField label={t('loans.borrowerName')} value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} />
            <TextField label={t('loans.borrowerContact')} value={borrowerContact} onChange={(e) => setBorrowerContact(e.target.value)} />
            <TextField label={t('loans.dueDate')} type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!itemId || !borrowerName || createMutation.isPending}
            >
              {t('loans.registerLoan')}
            </Button>
          </Stack>
        </Dialog>
      )}
    </Stack>
  );
}

function IconPlus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
