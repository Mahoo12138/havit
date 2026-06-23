import { useTranslation } from 'react-i18next';

import { Field, FieldLabel } from './field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

type SelectFieldProps = {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (event: { currentTarget: { value: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  required?: boolean;
};

function SelectField({
  label,
  options,
  placeholder,
  id,
  value,
  onChange,
  disabled,
  required,
}: SelectFieldProps) {
  const { t } = useTranslation();
  const inputId = id ?? label;

  return (
    <Field>
      <FieldLabel id={`${inputId}-label`}>
        {label}
        {required && <span aria-hidden> *</span>}
      </FieldLabel>
      <Select
        value={value || null}
        onValueChange={(nextValue) => onChange({ currentTarget: { value: nextValue ?? '' } })}
        items={options}
        disabled={disabled}
      >
        <SelectTrigger aria-labelledby={`${inputId}-label`} style={{ width: '100%' }}>
          <SelectValue placeholder={placeholder ?? t('common.selectPlaceholder')} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {placeholder && <SelectItem value={null}>{placeholder}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export { SelectField };
export type { SelectFieldProps };
