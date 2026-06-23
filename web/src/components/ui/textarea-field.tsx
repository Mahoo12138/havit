import type { TextareaHTMLAttributes } from 'react';

import { Field, FieldLabel } from './field';
import { Textarea } from './textarea';

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

function TextareaField({ label, id, ...props }: TextareaFieldProps) {
  const inputId = id ?? label;

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Textarea id={inputId} {...props} />
    </Field>
  );
}

export { TextareaField };
export type { TextareaFieldProps };
