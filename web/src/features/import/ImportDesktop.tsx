import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconFileImport, IconInfoCircle } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import {
  Row,
  Stack,
  StackTight,
  uiStyles,
} from '../../components/ui';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Code } from '../../components/ui/code';
import { useToast } from '../../components/ui/use-toast';
import { importApi, type ImportResult } from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';

export function ImportDesktop() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const isOnline = useNetworkStatus();

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const format = file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv';
      const text = await file.text();
      return importApi.items(format, text);
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.show(t('import.result', { created: data.created, failed: data.failed, skipped: data.skipped }));
    },
    onError: (e: Error) => toast.show(t('import.importFailed', { error: e.message })),
  });

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('import.title')}</h2>
          <p className="page-kicker">
            {t('import.description')}
          </p>
        </StackTight>
      </div>

      <Alert icon={<IconInfoCircle size={18} />}>
        <div>{t('import.csvFormat')}</div>
      </Alert>

      <Card className="surface-card">
        <Stack>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) upload.mutate(file);
              event.currentTarget.value = '';
            }}
          />
          <Button
            leftSection={<IconFileImport size={16} />}
            disabled={!isOnline || upload.isPending}
            title={!isOnline ? t('import.offlineDisabled') : undefined}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? t('import.importing') : t('import.selectFile')}
          </Button>
          <p className={uiStyles.help}>
            {t('import.batchNote')}
          </p>
        </Stack>
      </Card>

      {result && (
        <Card className="surface-card">
          <Stack>
            <Row>
              <h3 className={uiStyles.heading}>{t('import.resultTitle')}</h3>
              <Badge>{t('import.total', { count: result.total })}</Badge>
              <Badge>{t('import.createdCount', { count: result.created })}</Badge>
              {result.skipped > 0 && (
                <Badge>{t('import.skippedCount', { count: result.skipped })}</Badge>
              )}
              <Badge>{t('import.failedCount', { count: result.failed })}</Badge>
            </Row>
            {result.errors && result.errors.length > 0 && (
              <div>
                <p className={uiStyles.muted}>{t('import.failedRows')}</p>
                <ul>
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      {t('import.rowNumber', { line: e.line })} {e.name && <Code>{e.name}</Code>}：
                      {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
