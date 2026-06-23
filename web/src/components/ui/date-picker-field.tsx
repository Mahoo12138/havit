import { TextField } from './text-field';

function DatePickerField({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <TextField
      id={id}
      label={label}
      type="date"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  );
}

export { DatePickerField };
