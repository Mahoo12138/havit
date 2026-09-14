import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconDownload, IconRotate } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Code } from '../../components/ui/code';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { IMPORT_FIELDS, type ImportResult } from '../../api/client';
import { downloadBlob } from './ImportDesktop';

interface ImportResultCardProps {
  result: ImportResult;
  format: 'csv' | 'json';
  onRestart: () => void;
}

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
    <Card>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('import.colRow')}</TableHead>
                <TableHead>{t('import.colName')}</TableHead>
                <TableHead>{t('import.statError')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedRows.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className={uiStyles.muted}>{e.line}</TableCell>
                  <TableCell>{e.name && <Code>{e.name}</Code>}</TableCell>
                  <TableCell>{e.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {failedRows.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              variant="quiet"
              leftSection={<IconDownload size={15} />}
              onClick={downloadFailedRows}
            >
              {t('import.downloadFailedRows')}
            </Button>
            <span className={uiStyles.help}>{t('import.failedRowsHint')}</span>
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
