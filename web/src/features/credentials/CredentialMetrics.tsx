import type { TablerIcon } from '@tabler/icons-react';
import { uiStyles } from '../../components/ui';
import * as s from './credentials.css';

export type MetricTone = keyof typeof s.metricIcon;

export function CredentialMetrics({
  metrics,
}: {
  metrics: Array<{ icon: TablerIcon; label: string; value: number | string; tone: MetricTone }>;
}) {
  return (
    <div className={s.metricStrip}>
      {metrics.map((metric) => (
        <div className={`${uiStyles.card} ${s.metricCard}`} key={metric.label}>
          <span className={s.metricIcon[metric.tone]}>
            <metric.icon size={16} />
          </span>
          <div className={s.metricMeta}>
            <span className={s.metricLabel}>{metric.label}</span>
            <strong className={s.metricValue}>{metric.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
