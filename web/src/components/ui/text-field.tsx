import type { InputHTMLAttributes } from 'react';

import { Field, FieldError, FieldLabel } from './field';
import { Input } from './input';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
};

function TextField({ label, error, id, ...props }: TextFieldProps) {
  const inputId = id ?? label;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input id={inputId} aria-invalid={!!error} {...props} />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

export { TextField };
export type { TextFieldProps };
