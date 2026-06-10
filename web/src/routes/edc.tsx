import { createFileRoute } from '@tanstack/react-router';
import { Badge, Card, Row, Stack, StackTight, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { edcAssets } from '../features/m2/mockData';

export const Route = createFileRoute('/edc')({
  component: EDCPage,
});

function EDCPage() {
  return (
    <Stack>
      <FeatureHeader
        title="EDC 双轨模型"
        description="保留基准位置，同时用动态状态表达随身、出差包和未知状态。"
        meta="baseline + state"
      />

      <MetricStrip
        metrics={[
          { label: 'EDC 物品', value: edcAssets.length },
          {
            label: '当前随身',
            value: edcAssets.filter((item) => item.dynamicState !== '@home').length,
          },
          { label: '可归位', value: edcAssets.filter((item) => item.dynamicState === '@travel_bag').length },
        ]}
      />

      <DataCard title="出门检查清单">
        <div className={uiStyles.tableWrap}>
          <table className={uiStyles.table}>
            <thead>
              <tr>
                <th className={uiStyles.th}>物品</th>
                <th className={uiStyles.th}>基准位置</th>
                <th className={uiStyles.th}>动态状态</th>
                <th className={uiStyles.th}>搜索提示</th>
              </tr>
            </thead>
            <tbody>
              {edcAssets.map((item) => (
                <tr className={uiStyles.tableRow} key={item.id}>
                  <td className={uiStyles.td}>
                    <StackTight>
                      <strong>{item.name}</strong>
                      <span className={uiStyles.muted}>{item.lastConfirmedAt}</span>
                    </StackTight>
                  </td>
                  <td className={uiStyles.td}>{item.baselineLocation}</td>
                  <td className={uiStyles.td}>
                    <Badge>{item.dynamicState}</Badge>
                  </td>
                  <td className={uiStyles.td}>{item.searchHint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>

      <Card className="surface-card">
        <Row>
          <Badge>mock action</Badge>
          <span>一键打包和全部归位按钮位于此区域，后端状态机完成后接入。</span>
        </Row>
      </Card>
    </Stack>
  );
}
