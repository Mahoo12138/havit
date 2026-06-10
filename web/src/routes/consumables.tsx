import { createFileRoute } from '@tanstack/react-router';
import { Badge, Card, Row, Stack, StackTight, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip, StatusLine } from '../features/m2/components';
import { consumables } from '../features/m2/mockData';

export const Route = createFileRoute('/consumables')({
  component: ConsumablesPage,
});

function ConsumablesPage() {
  const warnings = consumables.filter((item) => item.stock <= item.threshold);

  return (
    <Stack>
      <FeatureHeader
        title="消耗品"
        description="类型 A 用购买事件预测库存，类型 B 用一键计数和寿命倒计时。"
        meta="A/B model"
      />

      <MetricStrip
        metrics={[
          { label: '追踪项', value: consumables.length },
          { label: '低于阈值', value: warnings.length },
          {
            label: '需校准',
            value: consumables.filter((item) => item.confidence === 'needs_calibration').length,
          },
        ]}
      />

      <DataCard title="库存预测">
        <div className={uiStyles.cardGrid}>
          {consumables.map((item) => (
            <Card className="surface-card" key={item.id}>
              <Stack>
                <Row>
                  <Badge>{item.model === 'event_forecast' ? '类型 A' : '类型 B'}</Badge>
                  <h3 className={uiStyles.heading}>{item.name}</h3>
                </Row>
                <StackTight>
                  <strong className={uiStyles.statValue}>
                    {item.stock}
                    <span className="stat-unit">{item.unit}</span>
                  </strong>
                  <span className={uiStyles.muted}>阈值 {item.threshold}{item.unit}</span>
                </StackTight>
                <StatusLine
                  label="可信度"
                  value={item.confidence === 'stable' ? '稳定' : '需要校准'}
                  tone={item.confidence === 'stable' ? 'default' : 'warning'}
                />
                {item.nextRunoutDate && (
                  <StatusLine label="预计耗尽" value={item.nextRunoutDate} />
                )}
                <p className={uiStyles.help}>{item.lastSignal}</p>
              </Stack>
            </Card>
          ))}
        </div>
      </DataCard>
    </Stack>
  );
}
