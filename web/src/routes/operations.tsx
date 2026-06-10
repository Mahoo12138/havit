import { createFileRoute } from '@tanstack/react-router';
import { IconDownload, IconPrinter } from '@tabler/icons-react';
import { Badge, Button, Card, Row, Stack, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, KeyValueGrid, MetricStrip } from '../features/m2/components';
import { backups, exports, locationLabels, reminderJobs } from '../features/m2/mockData';

export const Route = createFileRoute('/operations')({
  component: OperationsPage,
});

function OperationsPage() {
  return (
    <Stack>
      <FeatureHeader
        title="运维与导出"
        description="位置二维码打印、提醒网关、备份任务和手动导出集中在这里。"
        meta="ops"
      />

      <MetricStrip
        metrics={[
          { label: '位置标签', value: locationLabels.length },
          { label: '提醒任务', value: reminderJobs.length },
          { label: '最近备份', value: backups[0]?.state ?? '无' },
        ]}
      />

      <DataCard title="位置二维码">
        <div className={uiStyles.cardGrid}>
          {locationLabels.map((label) => (
            <Card className="surface-card" key={label.id}>
              <Stack>
                <div className={uiStyles.qrMock}>{label.code}</div>
                <KeyValueGrid
                  rows={[
                    { label: '名称', value: label.name },
                    { label: '路径', value: label.path },
                    { label: '物品数', value: label.itemCount },
                    { label: '打印状态', value: <Badge>{label.printState}</Badge> },
                  ]}
                />
                <Button variant="quiet" leftSection={<IconPrinter size={15} />}>
                  加入打印页
                </Button>
              </Stack>
            </Card>
          ))}
        </div>
      </DataCard>

      <div className={uiStyles.twoColumn}>
        <DataCard title="提醒调度器">
          <Stack>
            {reminderJobs.map((job) => (
              <Card className="surface-card" key={job.id}>
                <KeyValueGrid
                  rows={[
                    { label: '任务', value: job.title },
                    { label: '渠道', value: job.channel },
                    { label: '下次执行', value: job.nextRunAt },
                    { label: '状态', value: <Badge>{job.state}</Badge> },
                  ]}
                />
              </Card>
            ))}
          </Stack>
        </DataCard>

        <DataCard title="备份与导出">
          <Stack>
            {backups.map((backup) => (
              <Card className="surface-card" key={backup.id}>
                <KeyValueGrid
                  rows={[
                    { label: '开始', value: backup.startedAt },
                    { label: '状态', value: <Badge>{backup.state}</Badge> },
                    { label: '目标', value: backup.target },
                    { label: '大小', value: backup.size },
                    { label: '步骤', value: backup.steps.join(' → ') },
                  ]}
                />
              </Card>
            ))}
            {exports.map((preset) => (
              <Row className="export-row" key={preset.id}>
                <span>
                  <strong>{preset.label}</strong>
                  <br />
                  <span className={uiStyles.muted}>{preset.scope}</span>
                </span>
                <Button variant="quiet" leftSection={<IconDownload size={15} />}>
                  {preset.format.toUpperCase()}
                </Button>
              </Row>
            ))}
          </Stack>
        </DataCard>
      </div>
    </Stack>
  );
}
