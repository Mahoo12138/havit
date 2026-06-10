import { createFileRoute } from '@tanstack/react-router';
import { IconSparkles } from '@tabler/icons-react';
import { Badge, Card, Row, Stack, TextField, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import { searchResults } from '../features/m2/mockData';

export const Route = createFileRoute('/search')({
  component: SearchPage,
});

function SearchPage() {
  return (
    <Stack>
      <FeatureHeader
        title="自然语言搜索"
        description="先返回 FTS5 命中，再用异步精排结果补充解释和降级提示。"
        meta="FTS5 + SSE"
      />

      <Card className="surface-card">
        <Stack>
          <TextField
            label="查询"
            defaultValue="家里有哪些闲置超过半年的数码产品"
          />
          <Row>
            <Badge>FTS 已返回</Badge>
            <Badge>AI 优化中</Badge>
            <span className={uiStyles.muted}>mock SSE refresh</span>
          </Row>
        </Stack>
      </Card>

      <MetricStrip
        metrics={[
          { label: '结果', value: searchResults.length },
          {
            label: '动态状态提示',
            value: searchResults.filter((result) => result.status !== 'in_stock').length,
          },
          { label: '平均首屏响应', value: '即时', note: '本页为前端骨架' },
        ]}
      />

      <DataCard title="搜索结果">
        <div className={uiStyles.cardGrid}>
          {searchResults.map((result) => (
            <Card className="surface-card" key={result.itemName}>
              <Stack>
                <Row>
                  <IconSparkles size={16} />
                  <h3 className={uiStyles.heading}>{result.itemName}</h3>
                </Row>
                <span>{result.locationPath}</span>
                <p className={uiStyles.help}>{result.hint}</p>
                <div className={uiStyles.tagList}>
                  {result.tags.map((tag) => (
                    <span className={uiStyles.tagChip} key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </Stack>
            </Card>
          ))}
        </div>
      </DataCard>
    </Stack>
  );
}
