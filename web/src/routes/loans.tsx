import { createFileRoute } from '@tanstack/react-router';
import { Badge, Card, Stack, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, KeyValueGrid, MetricStrip } from '../features/m2/components';
import { loans } from '../features/m2/mockData';

export const Route = createFileRoute('/loans')({
  component: LoansPage,
});

function LoansPage() {
  return (
    <Stack>
      <FeatureHeader
        title="借出追踪"
        description="记录借给谁、预计归还时间和责任交割信息。"
        meta="handoff"
      />

      <MetricStrip
        metrics={[
          { label: '借出记录', value: loans.length },
          { label: '逾期', value: loans.filter((loan) => loan.state === 'overdue').length },
          {
            label: '责任交割',
            value: loans.filter((loan) => loan.state === 'lost_by_borrower').length,
          },
        ]}
      />

      <DataCard title="借出列表">
        <div className={uiStyles.cardGrid}>
          {loans.map((loan) => (
            <Card className="surface-card" key={loan.id}>
              <KeyValueGrid
                rows={[
                  { label: '物品', value: loan.itemName },
                  { label: '借用人', value: `${loan.borrower} (${loan.contact})` },
                  { label: '借出时间', value: loan.lentAt },
                  { label: '预计归还', value: loan.dueAt },
                  { label: '状态', value: <Badge>{loan.state}</Badge> },
                  { label: '交割备注', value: loan.handoffNote },
                ]}
              />
            </Card>
          ))}
        </div>
      </DataCard>
    </Stack>
  );
}
