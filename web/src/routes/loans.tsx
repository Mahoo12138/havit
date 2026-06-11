import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Button, Card, Dialog, Spinner, Stack, StackTight, TextField, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { itemsApi, loansApi } from '../api/client';

export const Route = createFileRoute('/loans')({
  component: LoansPage,
});

function LoansPage() {
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
        title="借出追踪"
        description="记录借给谁、预计归还时间和责任交割信息。"
        meta="handoff"
      />

      {itemsLoading ? (
        <Spinner />
      ) : (
        <>
          <MetricStrip
            metrics={[
              { label: '借出中', value: borrowedItems.length },
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button leftSection={<IconPlus size={15} />} onClick={() => setShowCreate(true)}>
              登记借出
            </Button>
          </div>

          <DataCard title="借出列表">
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
        <Dialog open title="登记借出" onClose={() => setShowCreate(false)}>
          <Stack>
            <TextField label="物品 ID" value={itemId} onChange={(e) => setItemId(e.target.value)} />
            <TextField label="借用人" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} />
            <TextField label="联系方式" value={borrowerContact} onChange={(e) => setBorrowerContact(e.target.value)} />
            <TextField label="预计归还" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!itemId || !borrowerName || createMutation.isPending}
            >
              确认借出
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
