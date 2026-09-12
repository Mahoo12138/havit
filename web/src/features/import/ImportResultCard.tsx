import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconDownload, IconRotate } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Code } from '../../components/ui/code';
import { IMPORT_FIELDS, type ImportResult } from '../../api/client';
import { downloadBlob } from './ImportDesktop';

interface ImportResultCardProps {
  result: ImportResult;
  format: 'csv' | 'json';
  onRestart: () => void;
}

const lineStyle = { borderBottom: '1px solid var(--havit-line, #ddd5c4)' } as const;

export function ImportResultCard({ result, format, onRestart }: ImportResultCardProps) {
  const { t } = useTranslation();

  const failedRows = result.errors ?? [];

  function downloadFailedRows() {
    const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    if (format === 'csv') {
      const header = IMPORT_FIELDS.map((f) => quote(f)).join(',');
      const lines = failedRows.map((e) =>
        IMPORT_FIELDS.map((f) => quote(e.row?.[f] ?? '')).join(','),
      );
      const blob = new Blob([[header, ...lines].join('\n')], {
        type: 'text/csv;charset=utf-8',
      });
      downloadBlob(blob, 'havit-import-failures.csv');
    } else {
      const rows = failedRows.map((e) => {
        const row: Record<string, string> = {};
        for (const f of IMPORT_FIELDS) {
          const v = e.row?.[f];
          if (v) row[f] = v;
        }
        return row;
      });
      const blob = new Blob([JSON.stringify(rows, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      downloadBlob(blob, 'havit-import-failures.json');
    }
  }

  return (
    <Card className="surface-card">
      <Stack className={uiStyles.cardContent}>
        <h3 className={uiStyles.heading}>{t('import.resultTitle')}</h3>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Badge variant="outline">{t('import.total', { count: result.total })}</Badge>
          {result.created > 0 && <Badge>{t('import.createdCount', { count: result.created })}</Badge>}
          {result.updated > 0 && <Badge variant="secondary">{t('import.updatedCount', { count: result.updated })}</Badge>}
          {result.skipped > 0 && <Badge variant="outline">{t('import.skippedCount', { count: result.skipped })}</Badge>}
          {result.failed > 0 && <Badge variant="destructive">{t('import.failedCount', { count: result.failed })}</Badge>}
        </div>

        {failedRows.length === 0 ? (
          <p className={uiStyles.muted}>{t('import.noErrors')}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th style={{ ...lineStyle, textAlign: 'left', padding: '0.375rem 0.5rem', fontWeight: 500 }}>
                    {t('import.colRow')}
                  </th>
                  <th style={{ ...lineStyle, textAlign: 'left', padding: '0.375rem 0.5rem', fontWeight: 500 }}>
                    {t('import.colName')}
                  </th>
                  <th style={{ ...lineStyle, textAlign: 'left', padding: '0.375rem 0.5rem', fontWeight: 500 }}>
                    {t('import.statError')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {failedRows.map((e, i) => (
                  <tr key={i}>
                    <td style={lineStyle} className={uiStyles.muted}>{e.line}</td>
                    <td style={lineStyle}>{e.name && <Code>{e.name}</Code>}</td>
                    <td style={lineStyle}>{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <Button
                variant="quiet"
                leftSection={<IconDownload size={15} />}
                onClick={downloadFailedRows}
              >
                {t('import.downloadFailedRows')}
              </Button>
              <span className={uiStyles.help}>{t('import.failedRowsHint')}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/assets" className={uiStyles.sectionLink}>
            {t('import.viewAssets')}
          </Link>
          <Button variant="quiet" leftSection={<IconRotate size={15} />} onClick={onRestart}>
            {t('import.importAgain')}
          </Button>
        </div>
      </Stack>
    </Card>
  );
}
