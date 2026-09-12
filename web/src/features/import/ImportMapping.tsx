import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Stack, uiStyles } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { SelectField } from '../../components/ui/select-field';
import { IMPORT_FIELDS } from '../../api/client';

interface ImportMappingProps {
  headers: string[];
  initial: Record<string, string>;
  busy: boolean;
  onConfirm: (mapping: Record<string, string>) => void;
  onBack: () => void;
}

const IGNORE = '';

export function ImportMapping({ headers, initial, busy, onConfirm, onBack }: ImportMappingProps) {
  const { t } = useTranslation();
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const field of IMPORT_FIELDS) {
      const value = initial[field];
      out[field] = value && headers.includes(value) ? value : IGNORE;
    }
    return out;
  });

  const nameMapped = mapping.name !== IGNORE;
  const mappedCount = Object.values(mapping).filter((v) => v !== IGNORE).length;

  return (
    <Card className="surface-card">
      <Stack className={uiStyles.cardContent}>
        <h3 className={uiStyles.heading}>{t('import.mappingTitle')}</h3>
        <p className={uiStyles.muted}>{t('import.mappingDescription')}</p>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {IMPORT_FIELDS.map((field) => (
            <SelectField
              key={field}
              id={`import-map-${field}`}
              label={t(`importField.${field}`)}
              required={field === 'name'}
              value={mapping[field]}
              options={headers.map((h) => ({ value: h, label: h }))}
              placeholder={t('import.mappingIgnore')}
              onChange={(event) => {
                setMapping((prev) => ({ ...prev, [field]: event.currentTarget.value }));
              }}
            />
          ))}
        </div>

        {!nameMapped && <p className={uiStyles.help}>{t('import.nameRequired')}</p>}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            variant="primary"
            disabled={!nameMapped || busy}
            onClick={() => onConfirm(mapping)}
          >
            {busy ? t('import.importing') : t('import.stepPreview')}
          </Button>
          <Button variant="quiet" onClick={onBack}>
            {t('import.startOver')}
          </Button>
        </div>
        <span className={uiStyles.help}>
          {t('import.statTotal', { count: mappedCount })}
        </span>
      </Stack>
    </Card>
  );
}
