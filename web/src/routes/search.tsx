import { useCallback, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { IconSearch, IconSparkles } from '@tabler/icons-react';
import { Card, Row, Spinner, Stack, StatusBadge, TextField, uiStyles } from '../components/ui';
import { DataCard, FeatureHeader, MetricStrip } from '../features/m2/components';
import type { SearchResult } from '../api/client';

export const Route = createFileRoute('/search')({
  component: SearchPage,
});

function SearchPage() {
  const [query, setQuery] = useState('');
  const [ftsResults, setFtsResults] = useState<SearchResult[]>([]);
  const [llmResults, setLlmResults] = useState<SearchResult[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [esRef, setEsRef] = useState<EventSource | null>(null);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      esRef?.close();
      setFtsResults([]);
      setLlmResults([]);
      setIsRefining(false);

      if (!q.trim()) return;

      const token = localStorage.getItem('havit_token');
      const url = new URL('/api/v1/search', window.location.origin);
      url.searchParams.set('q', q);
      const init: RequestInit = {};
      if (token) {
        init.headers = { Authorization: `Bearer ${token}` };
      }

      const es = new EventSource(url.toString());
      setEsRef(es);

      es.addEventListener('fts_results', ((e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setFtsResults(data ?? []);
        setIsRefining(true);
      }) as EventListener);

      es.addEventListener('llm_results', ((e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setLlmResults(data ?? []);
      }) as EventListener);

      es.addEventListener('done', () => {
        setIsRefining(false);
        es.close();
      });

      es.onerror = () => {
        setIsRefining(false);
        es.close();
      };
    },
    [esRef],
  );

  const results = llmResults.length > 0 ? llmResults : ftsResults;

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
            placeholder="例如：家里有哪些闲置超过半年的数码产品"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Row>
            {ftsResults.length > 0 && <StatusBadge status="in_stock" />}
            {isRefining && (
              <Row>
                <Spinner />
                <span className={uiStyles.muted}>AI 优化中…</span>
              </Row>
            )}
            {!isRefining && ftsResults.length > 0 && llmResults.length === 0 && (
              <span className={uiStyles.muted}>FTS 结果已返回</span>
            )}
          </Row>
        </Stack>
      </Card>

      <MetricStrip
        metrics={[
          { label: '结果', value: results.length },
          {
            label: '异常状态',
            value: results.filter((r) => r.status !== 'in_stock').length,
          },
          {
            label: '搜索源',
            value: llmResults.length > 0 ? 'LLM 精排' : ftsResults.length > 0 ? 'FTS5' : '—',
          },
        ]}
      />

      {results.length > 0 && (
        <DataCard title="搜索结果">
          <div className={uiStyles.cardGrid}>
            {results.map((result) => (
              <Card className="surface-card" key={result.id}>
                <Stack>
                  <Row>
                    <IconSparkles size={16} />
                    <h3 className={uiStyles.heading}>{result.name}</h3>
                  </Row>
                  {result.location_path && <span>{result.location_path}</span>}
                  {result.edc_hint && <p className={uiStyles.help}>{result.edc_hint}</p>}
                  <Row>
                    <StatusBadge status={result.status} />
                    <span className={uiStyles.muted}>{result.type}</span>
                  </Row>
                </Stack>
              </Card>
            ))}
          </div>
        </DataCard>
      )}

      {query && !isRefining && results.length === 0 && (
        <Card className="surface-card">
          <Row>
            <IconSearch size={16} />
            <span className={uiStyles.muted}>未找到匹配结果</span>
          </Row>
        </Card>
      )}
    </Stack>
  );
}
