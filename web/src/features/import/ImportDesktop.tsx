import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconDownload, IconFileImport, IconInfoCircle } from '@tabler/icons-react';
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
import { useToast } from '../../components/ui/use-toast';
import {
  buildImportTemplateCsv,
  importApi,
  type ImportPreview,
  type ImportResult,
  type OnDuplicate,
} from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { ImportMapping } from './ImportMapping';
import { ImportPreviewCard } from './ImportPreviewCard';
import { ImportResultCard } from './ImportResultCard';

type Step = 'prepare' | 'mapping' | 'preview' | 'result';

const STEPS: Step[] = ['prepare', 'mapping', 'preview', 'result'];

export function ImportDesktop() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isOnline = useNetworkStatus();

  const [step, setStep] = useState<Step>('prepare');
  const [fileName, setFileName] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [fileText, setFileText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [onDuplicate, setOnDuplicate] = useState<OnDuplicate>('skip');
  const [result, setResult] = useState<ImportResult | null>(null);

  const previewMutation = useMutation({
    mutationFn: ({
      fmt,
      body,
      map,
    }: {
      fmt: 'csv' | 'json';
      body: string;
      map?: Record<string, string>;
    }) => importApi.preview(fmt, body, map ? { mapping: map } : undefined),
    onError: (e: Error) => setPreviewError(e.message),
  });

  const commit = useMutation({
    mutationFn: () =>
      importApi.items(format, fileText, {
        onDuplicate,
        ...(format === 'csv' ? { mapping } : {}),
      }),
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.show(
        t('import.result', {
          created: data.created,
          updated: data.updated,
          skipped: data.skipped,
          failed: data.failed,
        }),
      );
    },
    onError: (e: Error) => toast.show(t('import.importFailed', { error: e.message })),
  });

  function handleFile(file: File) {
    const fmt = file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv';
    setFileName(file.name);
    setFormat(fmt);
    setResult(null);
    setPreview(null);
    setPreviewError(null);

    file.text().then((text) => {
      setFileText(text);
      previewMutation.mutate(
        { fmt, body: text },
        {
          onSuccess: (data) => {
            if (fmt === 'csv') {
              setHeaders(data.headers ?? []);
              setMapping(normalizeMapping(data.mapping, data.headers ?? []));
              setStep('mapping');
            } else {
              setPreview(data);
              setStep('preview');
            }
          },
        },
      );
    });
  }

  function confirmMapping(next: Record<string, string>) {
    setMapping(next);
    setPreviewError(null);
    previewMutation.mutate(
      { fmt: 'csv', body: fileText, map: next },
      {
        onSuccess: (data) => {
          setPreview(data);
          setStep('preview');
        },
      },
    );
  }

  function downloadTemplate() {
    const blob = new Blob([buildImportTemplateCsv()], {
      type: 'text/csv;charset=utf-8',
    });
    downloadBlob(blob, 'havit-import-template.csv');
  }

  function reset() {
    setStep('prepare');
    setFileName('');
    setFileText('');
    setHeaders([]);
    setMapping({});
    setPreview(null);
    setPreviewError(null);
    setResult(null);
    setOnDuplicate('skip');
  }

  const stepIndex = STEPS.indexOf(step);
  const isCsv = format === 'csv';

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('import.title')}</h2>
          <p className="page-kicker">{t('import.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Badge variant="outline">
            {t('import.step', { current: stepIndex + 1, total: 4 })}
          </Badge>
        </div>
      </div>

      <Alert icon={<IconInfoCircle size={18} />}>
        <div>{isCsv ? t('import.csvFormat') : t('import.jsonFormat')}</div>
      </Alert>

      <Card className="surface-card">
        <Stack className={uiStyles.cardContent}>
          <Row>
            <Button
              variant="quiet"
              leftSection={<IconDownload size={16} />}
              onClick={downloadTemplate}
            >
              {t('import.downloadTemplate')}
            </Button>
            <Button
              leftSection={<IconFileImport size={16} />}
              disabled={!isOnline}
              onClick={() => inputRef.current?.click()}
            >
              {t('import.selectFile')}
            </Button>
          </Row>
          <p className={uiStyles.help}>{t('import.templateNote')}</p>
          <div
            style={{
              border: '1px dashed var(--havit-line, #ddd5c4)',
              borderRadius: 8,
              padding: '1.25rem',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file && isOnline) handleFile(file);
            }}
            onClick={() => {
              if (isOnline) inputRef.current?.click();
            }}
          >
            <p className={uiStyles.muted}>
              {t('import.dragDrop')}
              {!isOnline && <span> · {t('import.offlineDisabled')}</span>}
            </p>
          </div>
          {fileName && <span className={uiStyles.help}>{fileName}</span>}
        </Stack>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,text/csv,application/json"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) handleFile(file);
          event.currentTarget.value = '';
        }}
      />

      {step === 'mapping' && (
        <ImportMapping
          headers={headers}
          initial={mapping}
          busy={previewMutation.isPending}
          onConfirm={confirmMapping}
          onBack={reset}
        />
      )}

      {step === 'preview' && (
        <ImportPreviewCard
          preview={preview}
          onDuplicate={onDuplicate}
          onDuplicateChange={setOnDuplicate}
          busy={commit.isPending || previewMutation.isPending}
          onConfirm={() => commit.mutate()}
          onBack={isCsv ? () => setStep('mapping') : reset}
          onStartOver={reset}
        />
      )}

      {step === 'result' && result && (
        <ImportResultCard
          result={result}
          format={format}
          onRestart={reset}
        />
      )}

      {previewError && (
        <Alert icon={<IconInfoCircle size={18} />}>
          <div>{t('import.importFailed', { error: previewError })}</div>
        </Alert>
      )}
    </Stack>
  );
}

// normalizeMapping turns the server's effective mapping into a field → header
// map the wizard can prefill. Numeric "col:N" entries are resolved to headers.
function normalizeMapping(
  mapping: Record<string, string>,
  headers: string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, value] of Object.entries(mapping)) {
    if (value.startsWith('col:')) {
      const idx = Number(value.slice(4));
      if (Number.isInteger(idx) && idx >= 0 && idx < headers.length) {
        out[field] = headers[idx];
      }
    } else {
      out[field] = value;
    }
  }
  return out;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
