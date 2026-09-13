import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconMapPin,
  IconPackage,
  IconSearch,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';
import { StatusBadge } from '../../components/ui/status-badge';
import { DataCard, FeatureHeader } from '../m2/components';
import { searchApi } from '../../api/client';
import type { SearchResult } from '../../api/client';
import * as s from './search.css';

const SEARCH_DEBOUNCE_MS = 350;

type SearchPhase = 'idle' | 'searching' | 'refining' | 'done' | 'error';

const EXAMPLE_QUERIES = [
  'search.exampleIdle',
  'search.exampleBorrowed',
  'search.exampleExpiring',
] as const;

export function SearchDesktop() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [ftsResults, setFtsResults] = useState<SearchResult[]>([]);
  const [llmResults, setLlmResults] = useState<SearchResult[]>([]);
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const runSearch = useCallback((q: string) => {
    esRef.current?.close();
    esRef.current = null;
    setFtsResults([]);
    setLlmResults([]);
    setError(false);

    if (!q.trim()) {
      setPhase('idle');
      return;
    }

    setPhase('searching');
    const es = searchApi.search(q);
    esRef.current = es;

    es.addEventListener('fts_results', ((e: MessageEvent) => {
      setFtsResults(JSON.parse(e.data) ?? []);
      setPhase('refining');
    }) as EventListener);

    es.addEventListener('llm_results', ((e: MessageEvent) => {
      setLlmResults(JSON.parse(e.data) ?? []);
    }) as EventListener);

    es.addEventListener('search_error', (() => {
      setError(true);
      setPhase('error');
      es.close();
    }) as EventListener);

    es.addEventListener('done', () => {
      setPhase('done');
      es.close();
    });

    es.onerror = () => {
      setPhase((prev) => (prev === 'refining' ? 'done' : 'error'));
      es.close();
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => runSearch(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => {
    return () => esRef.current?.close();
  }, []);

  const isRefining = phase === 'refining';
  const hasResults = ftsResults.length > 0 || llmResults.length > 0;
  const useLlm = llmResults.length > 0;
  const results = useLlm ? llmResults : ftsResults;
  const showSkeleton = phase === 'searching';
  const showEmptyState =
    !showSkeleton && phase !== 'idle' && !hasResults && !isRefining && !error;

  return (
    <Stack>
      <FeatureHeader
        title={t('search.title')}
        description={t('search.description')}
        meta={t('search.meta')}
      />

      <Card className="surface-card">
        <Stack className={uiStyles.cardContent}>
          <div className={s.searchWrap}>
            <IconSearch size={18} className={s.searchIcon} />
            <Input
              ref={inputRef}
              type="search"
              className={s.searchInput}
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              aria-label={t('search.query')}
              autoFocus
            />
            {query && (
              <button
                type="button"
                className={s.clearButton}
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                aria-label={t('search.clear')}
              >
                <IconX size={15} />
              </button>
            )}
          </div>

          {(error || phase !== 'idle') && (
            <div className={s.statusLine}>
              {error && <span className={s.errorText}>{t('search.searchError')}</span>}
              {!error && phase === 'searching' && (
                <span className={s.skeletonPulse}>{t('search.searching')}</span>
              )}
              {!error && isRefining && (
                <>
                  <Spinner />
                  <span>{t('search.aiRefining')}</span>
                </>
              )}
              {!error && phase === 'done' && hasResults && (
                <>
                  <span className={s.sourceChip[useLlm ? 'llm' : 'fts']}>
                    {useLlm && <IconSparkles size={12} />}
                    {useLlm ? t('search.llmRefined') : 'FTS5'}
                  </span>
                  <span>{t('search.results')}: {results.length}</span>
                  {!useLlm && llmResults.length === 0 && ftsResults.length > 0 && (
                    <span>{t('search.ftsOnly')}</span>
                  )}
                </>
              )}
            </div>
          )}
        </Stack>
      </Card>

      {showSkeleton && (
        <DataCard title={t('search.searching')}>
          <div className={s.resultList}>
            {Array.from({ length: 4 }, (_, i) => (
              <div className={s.skeletonRow} key={i} aria-hidden>
                <div className={s.skeletonThumb} />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    flex: 1,
                  }}
                >
                  <div className={s.skeletonLine} style={{ width: '38%' }} />
                  <div className={s.skeletonLine} style={{ width: '62%' }} />
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      )}

      {hasResults && !showSkeleton && (
        <DataCard
          title={t('search.searchResults')}
          meta={
            <span className={s.sourceChip[useLlm ? 'llm' : 'fts']}>
              {useLlm && <IconSparkles size={12} />}
              {useLlm ? t('search.llmRefined') : 'FTS5'}
            </span>
          }
        >
          <div className={s.resultList}>
            {results.map((result) => (
              <Link
                to="/items/$itemId"
                params={{ itemId: result.id }}
                className={s.resultRow}
                key={result.id}
              >
                {result.thumbnail_url ? (
                  <img src={result.thumbnail_url} alt="" className={s.thumb} />
                ) : (
                  <span className={s.thumbFallback}>
                    <IconPackage size={18} />
                  </span>
                )}
                <span className={s.resultMain}>
                  <h4 className={s.resultName}>{result.name}</h4>
                  {result.location_path && (
                    <span className={s.resultMeta}>
                      <IconMapPin size={13} />
                      <span className={s.resultPath}>{result.location_path}</span>
                    </span>
                  )}
                  {(result.essentials_hint || result.loan_hint) && (
                    <p className={s.resultHint}>
                      {result.essentials_hint || result.loan_hint}
                    </p>
                  )}
                </span>
                <span className={s.resultSide}>
                  <StatusBadge status={result.status} />
                  <span className={s.resultType}>
                    {t(`itemType.${result.type}`, result.type)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </DataCard>
      )}

      {showEmptyState && (
        <Card className="surface-card">
          <div className="empty-state">
            <p>{t('search.noResults')}</p>
            <p>{t('search.exampleTitle')}</p>
            <div className={s.exampleRow}>
              {EXAMPLE_QUERIES.map((key) => (
                <button
                  type="button"
                  className={s.exampleChip}
                  key={key}
                  onClick={() => setQuery(t(key))}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </Stack>
  );
}
