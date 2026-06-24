import * as React from 'react';
import { CalendarIcon, XIcon } from 'lucide-react';

import { Calendar } from './calendar';
import { buttonVariants } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import * as s from './date-picker.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDateValue(date?: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date?: Date): string {
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

type DatePickerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onChange' | 'value'
> & {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function DatePicker({
  className,
  value,
  onChange,
  placeholder,
  disabled,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(() => parseDate(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={buttonVariants({
          variant: 'outline',
          className: cx(s.trigger, className),
        })}
        disabled={disabled}
        data-empty={!selected || undefined}
        aria-expanded={open}
        {...props}
      >
        <CalendarIcon data-icon="inline-start" />
        <span className={s.value}>
          {selected ? formatDisplayDate(selected) : placeholder}
        </span>
        {selected && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            className={s.clear}
            aria-label="Clear date"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onChange('');
            }}
          >
            <XIcon />
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent className={s.content} align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(formatDateValue(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
export type { DatePickerProps };
