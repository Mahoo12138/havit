import { createFileRoute } from '@tanstack/react-router';
import { IconBarcode, IconCamera, IconEdit } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Badge, Button, Card, Row, Stack, StackTight, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { captureDrafts } from '../features/m2/mockData';
import type { CaptureDraft } from '../features/m2/types';

export const Route = createFileRoute('/capture')({
  component: CapturePage,
});

const sourceLabel: Record<CaptureDraft['source'], string> = {
  barcode: '条码',
  ai_photo: 'AI 拍照',
  manual: '手动兜底',
};

function CapturePage() {
  return (
    <Stack>
      <FeatureHeader
        title="录入增强"
        description="条码扫描、AI 拍照识别和手动兜底共用一套确认队列。"
        meta="P1 capture"
      />

      <MetricStrip
        metrics={[
          { label: '待确认草稿', value: captureDrafts.length },
          {
            label: '需要人工复核',
            value: captureDrafts.filter((draft) => draft.status === 'needs_review').length,
          },
          {
            label: '降级到手动',
            value: captureDrafts.filter((draft) => draft.source === 'manual').length,
          },
        ]}
      />

      <div className={uiStyles.featureGrid}>
        <ActionCard
          icon={<IconBarcode size={18} />}
          title="条码扫描"
          body="前端接入 @zxing/browser 后，扫描结果进入条码库查询，再落到确认草稿。"
        />
        <ActionCard
          icon={<IconCamera size={18} />}
          title="AI 拍照识别"
          body="结构化字段只填可确认值，序列号、精确型号等高风险字段默认留空。"
        />
        <ActionCard
          icon={<IconEdit size={18} />}
          title="人工确认"
          body="任何识别失败都回到同一张表单，不阻塞录入。"
        />
      </div>

      <DataCard title="识别草稿">
        <div className={uiStyles.cardGrid}>
          {captureDrafts.map((draft) => (
            <Card className="surface-card" key={draft.id}>
              <Stack>
                <Row>
                  <Badge>{sourceLabel[draft.source]}</Badge>
                  <span className={uiStyles.muted}>
                    {draft.confidence > 0 ? `${Math.round(draft.confidence * 100)}%` : '无命中'}
                  </span>
                </Row>
                {draft.imageUrl && (
                  <img className={uiStyles.previewImage} src={draft.imageUrl} alt="" />
                )}
                <StackTight>
                  <h4 className={uiStyles.heading}>{draft.title}</h4>
                  <span className={uiStyles.help}>{draft.status}</span>
                </StackTight>
                <div className="detail-grid">
                  {draft.fields.map((field) => (
                    <div className="detail-row compact-detail-row" key={field.label}>
                      <span className={uiStyles.muted}>{field.label}</span>
                      <span>{field.value}</span>
                    </div>
                  ))}
                </div>
                <Button variant="quiet">打开确认表单</Button>
              </Stack>
            </Card>
          ))}
        </div>
      </DataCard>
    </Stack>
  );
}

function ActionCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="surface-card">
      <StackTight>
        <Row>
          <span className={uiStyles.iconTile}>{icon}</span>
          <h3 className={uiStyles.heading}>{title}</h3>
        </Row>
        <p className={uiStyles.help}>{body}</p>
      </StackTight>
    </Card>
  );
}
