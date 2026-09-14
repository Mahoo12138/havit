import { useTranslation } from 'react-i18next';
import { Stack, uiStyles } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { SelectField } from '../../components/ui/select-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import type { ImportPreview, OnDuplicate } from '../../api/client';

interface ImportPreviewCardProps {
  preview: ImportPreview | null;
  onDuplicate: OnDuplicate;
  onDuplicateChange: (value: OnDuplicate) => void;
  busy: boolean;
  onConfirm: () => void;
  onBack: () => void;
  onStartOver: () => void;
}

export function ImportPreviewCard({
  preview,
  onDuplicate,
  onDuplicateChange,
  busy,
  onConfirm,
  onBack,
  onStartOver,
}: ImportPreviewCardProps) {
  const { t } = useTranslation();

  if (!preview) return null;

  const duplicateLabel =
    onDuplicate === 'update'
      ? t('import.statWillUpdate')
      : onDuplicate === 'append'
        ? t('import.statWillAppend')
        : t('import.statDuplicate');

  function statusLabel(status: string): string {
    if (status === 'ok') return t('import.statNew');
    if (status === 'duplicate') return duplicateLabel;
    return t('import.statError');
  }

  function statusVariant(status: string) {
    if (status === 'error') return 'destructive' as const;
    if (status === 'duplicate') return 'secondary' as const;
    return 'default' as const;
  }

  return (
    <Card>
      <Stack className={uiStyles.cardContent}>
        <h3 className={uiStyles.heading}>{t('import.previewTitle')}</h3>
        <p className={uiStyles.muted}>{t('import.previewDescription')}</p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Badge>{t('import.statTotal', { count: preview.total })}</Badge>
          <Badge>{t('import.statNew')}: {preview.stats.ok}</Badge>
          {preview.stats.duplicate > 0 && (
            <Badge variant="secondary">{duplicateLabel}: {preview.stats.duplicate}</Badge>
          )}
          {preview.stats.error > 0 && (
            <Badge variant="destructive">{t('import.statError')}: {preview.stats.error}</Badge>
          )}
        </div>

        <SelectField
          id="import-duplicate-policy"
          label={t('import.duplicatePolicy')}
          value={onDuplicate}
          options={[
            { value: 'skip', label: t('import.duplicateSkip') },
            { value: 'update', label: t('import.duplicateUpdate') },
            { value: 'append', label: t('import.duplicateAppend') },
          ]}
          onChange={(event) => onDuplicateChange(event.currentTarget.value as OnDuplicate)}
        />
        {onDuplicate === 'update' && <p className={uiStyles.help}>{t('import.updateSemanticsNote')}</p>}

        {preview.rows.length === 0 ? (
          <p className={uiStyles.muted}>{t('import.noRows')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('import.colRow')}</TableHead>
                <TableHead>{t('import.colName')}</TableHead>
                <TableHead>{t('import.colCategory')}</TableHead>
                <TableHead>{t('import.colLocation')}</TableHead>
                <TableHead>{t('import.colStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.rows.map((row) => (
                <TableRow key={row.row}>
                  <TableCell className={uiStyles.muted}>{row.row}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.category ?? ''}</TableCell>
                  <TableCell>{row.location ?? ''}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
                    {row.errors && row.errors.length > 0 && (
                      <span className={uiStyles.muted}> · {row.errors.map((e) => e.message).join('; ')}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {preview.truncated && (
          <p className={uiStyles.help}>{t('import.truncatedNote', { count: preview.total })}</p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" disabled={busy} onClick={onConfirm}>
            {busy ? t('import.importing') : t('import.confirmImport')}
          </Button>
          <Button variant="quiet" disabled={busy} onClick={onBack}>
            {t('import.backToMapping')}
          </Button>
          <Button variant="quiet" disabled={busy} onClick={onStartOver}>
            {t('import.startOver')}
          </Button>
        </div>
      </Stack>
    </Card>
  );
}
