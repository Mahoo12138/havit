import { DatePicker } from './date-picker';
import { Field, FieldError, FieldLabel } from './field';

function DatePickerField({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  id,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  error?: string | null;
}) {
  const inputId = id ?? label;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <DatePicker
        id={inputId}
        aria-invalid={!!error}
        aria-required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

export { DatePickerField };
