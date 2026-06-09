import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, StackTight, uiStyles } from '../components/ui';
import { itemsApi, locationsApi } from '../api/client';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function countLocations(
  nodes: Array<{ children?: Array<unknown> }> | undefined,
): number {
  if (!nodes) return 0;
  let n = 0;
  for (const node of nodes) {
    n += 1;
    n += countLocations(
      (node as { children?: Array<{ children?: Array<unknown> }> }).children,
    );
  }
  return n;
}

function Dashboard() {
  const items = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list(),
  });
  const locs = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  return (
    <div className={uiStyles.stackLoose}>
      <div className={uiStyles.dashboardSummary}>
        <div className={uiStyles.heroPanel}>
          <StackTight>
            <h2 className="page-heading">家庭资产总览</h2>
            <p className="page-kicker">
              快速确认资产数量、位置结构和当前在库状态。
            </p>
          </StackTight>
          <span className={uiStyles.help}>M1 ledger view</span>
        </div>
        <div className={uiStyles.dashboardStats}>
          <StatCard label="物品总数" value={items.data?.items.length ?? '加载中'} />
          <StatCard
            label="位置节点"
            value={locs.data ? countLocations(locs.data.tree) : '加载中'}
          />
          <StatCard
            label="在库物品"
            value={
              items.data?.items.filter((i) => i.status === 'in_stock').length ??
              '加载中'
            }
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="surface-card stat-card">
      <StackTight>
        <Row>
          <span className={uiStyles.muted}>{label}</span>
        </Row>
        <strong className={uiStyles.statValue}>{value}</strong>
      </StackTight>
    </Card>
  );
}
