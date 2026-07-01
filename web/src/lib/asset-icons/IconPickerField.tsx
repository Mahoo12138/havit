import { useDeferredValue, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Field, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { AssetIcon } from './AssetIcon';
import {
  assetIconGroupById,
  assetIconGroups,
  assetIcons,
  defaultAssetIconId,
  getAssetIcon,
  type AssetIconDefinition,
  type AssetIconGroup,
} from './catalog';
import * as s from './icon-picker-field.css';

interface IconPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rootType?: string | null;
  disabled?: boolean;
}

function IconPickerField({
  label,
  value,
  onChange,
  rootType,
  disabled = false,
}: IconPickerFieldProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('all');
  const deferredQuery = useDeferredValue(query);
  const isZh = i18n.language.toLowerCase().startsWith('zh');
  const selected = getAssetIcon(value);
  const fallbackId = defaultAssetIconId(rootType);
  const previewIcon = selected ?? getAssetIcon(fallbackId);

  const filteredIcons = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    return assetIcons.filter((icon) => {
      if (group !== 'all' && icon.group !== group) return false;
      if (!q) return true;

      const iconGroup = assetIconGroupById.get(icon.group);
      return searchableText(icon, iconGroup).includes(q);
    });
  }, [deferredQuery, group]);

  return (
    <Field className={s.root}>
      <FieldLabel>{label}</FieldLabel>

      <div className={s.preview}>
        <span className={s.previewIcon} aria-hidden>
          <AssetIcon id={previewIcon?.id ?? fallbackId} size={20} />
        </span>
        <span className={s.previewText}>
          <span className={s.previewLabel}>
            {selected ? localizedIconLabel(selected, isZh) : t('categories.defaultIcon')}
          </span>
          <span className={s.previewMeta}>{selected?.id ?? fallbackId}</span>
        </span>
        <Button
          type="button"
          variant="quiet"
          size="sm"
          disabled={disabled || !value}
          onClick={() => onChange('')}
        >
          {t('categories.iconPickerClear')}
        </Button>
      </div>

      <Input
        className={s.search}
        type="search"
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder={t('categories.iconPickerSearch')}
        aria-label={t('categories.iconPickerSearch')}
      />

      <div className={s.groups} role="toolbar" aria-label={t('categories.iconPickerGroups')}>
        <button
          type="button"
          className={s.groupButton}
          aria-pressed={group === 'all'}
          disabled={disabled}
          onClick={() => setGroup('all')}
        >
          {t('categories.iconPickerAll')}
        </button>
        {assetIconGroups.map((iconGroup) => (
          <button
            type="button"
            key={iconGroup.id}
            className={s.groupButton}
            aria-pressed={group === iconGroup.id}
            disabled={disabled}
            onClick={() => setGroup(iconGroup.id)}
          >
            {isZh ? iconGroup.zh : iconGroup.en}
          </button>
        ))}
      </div>

      <ScrollArea className={s.gridWrap}>
        {filteredIcons.length > 0 ? (
          <div className={s.grid}>
            {filteredIcons.map((icon) => {
              const iconLabel = localizedIconLabel(icon, isZh);
              const active = selected?.id === icon.id;
              return (
                <button
                  type="button"
                  key={icon.id}
                  className={s.iconButton}
                  aria-pressed={active}
                  disabled={disabled}
                  title={`${iconLabel} · ${icon.id}`}
                  onClick={() => onChange(icon.id)}
                >
                  <AssetIcon id={icon.id} size={20} />
                  <span className={s.iconName}>{iconLabel}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={s.empty}>{t('categories.iconPickerEmpty')}</div>
        )}
      </ScrollArea>
    </Field>
  );
}

function localizedIconLabel(icon: AssetIconDefinition, isZh: boolean) {
  return isZh ? icon.zh : icon.en;
}

function searchableText(icon: AssetIconDefinition, group?: AssetIconGroup) {
  return [
    icon.id,
    icon.en,
    icon.zh,
    ...icon.keywords,
    group?.en,
    group?.zh,
    ...(group?.keywords ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export { IconPickerField };
