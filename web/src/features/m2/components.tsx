import { Badge, Card, Row, RowBetween, Stack, StackTight, uiStyles } from '../../components/ui';
import type { ReactNode } from 'react';

export function FeatureHeader({
  title,
  description,
  meta,
}: {
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <div className={uiStyles.pageHeader}>
      <StackTight>
        <h2 className="page-heading">{title}</h2>
        <p className="page-kicker">{description}</p>
      </StackTight>
      {meta && (
        <div className={uiStyles.pageActions}>
          <Badge>{meta}</Badge>
        </div>
      )}
    </div>
  );
}

export function MetricStrip({
  metrics,
}: {
  metrics: Array<{ label: string; value: number | string; note?: string }>;
}) {
  return (
    <div className={uiStyles.dashboardStats}>
      {metrics.map((metric) => (
        <Card className="surface-card stat-card" key={metric.label}>
          <StackTight>
            <span className={uiStyles.muted}>{metric.label}</span>
            <strong className={uiStyles.statValue}>{metric.value}</strong>
            {metric.note && <span className={uiStyles.help}>{metric.note}</span>}
          </StackTight>
        </Card>
      ))}
    </div>
  );
}

export function DataCard({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="surface-card">
      <Stack>
        <RowBetween>
          <h3 className={uiStyles.heading}>{title}</h3>
          {meta}
        </RowBetween>
        {children}
      </Stack>
    </Card>
  );
}

export function KeyValueGrid({
  rows,
}: {
  rows: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <div className="detail-grid">
      {rows.map((row) => (
        <div className="detail-row" key={row.label}>
          <span className={uiStyles.muted}>{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StatusLine({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'danger';
}) {
  return (
    <Row>
      <span className={uiStyles.muted}>{label}</span>
      <span className={`status-pill status-pill-${tone}`}>{value}</span>
    </Row>
  );
}
