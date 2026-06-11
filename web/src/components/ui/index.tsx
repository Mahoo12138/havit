import {
  createContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { IconChevronDown, IconX } from '@tabler/icons-react';

import * as s from './styles.css';

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof s.buttonVariant;
  leftSection?: ReactNode;
};

export function Button({
  variant = 'primary',
  leftSection,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(s.buttonVariant[variant], className)}
      {...props}
    >
      {leftSection}
      {children}
    </button>
  );
}

export function Card({
  padded = true,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      className={cx(padded ? s.cardPadded : s.card, className)}
      {...props}
    />
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, id, ...props }: TextFieldProps) {
  const inputId = id ?? label;
  return (
    <label className={s.field} htmlFor={inputId}>
      <span className={s.label}>{label}</span>
      <input id={inputId} className={s.input} aria-invalid={!!error} {...props} />
      {error && <span className={s.errorText}>{error}</span>}
    </label>
  );
}

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

export function SelectField({
  label,
  options,
  placeholder,
  id,
  value,
  onChange,
  disabled,
  required,
}: SelectFieldProps) {
  const inputId = id ?? label;
  return (
    <div className={s.field}>
      <BaseSelect.Root<string>
        id={inputId}
        value={value || null}
        onValueChange={(nextValue) =>
          onChange({ currentTarget: { value: nextValue ?? '' } })
        }
        items={options}
        disabled={disabled}
        required={required}
      >
        <BaseSelect.Label className={s.label}>{label}</BaseSelect.Label>
        <BaseSelect.Trigger className={s.selectTrigger}>
          <BaseSelect.Value placeholder={placeholder ?? '请选择'} />
          <BaseSelect.Icon className={s.selectIcon}>
            <IconChevronDown size={16} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner className={s.selectPositioner} sideOffset={6}>
            <BaseSelect.Popup className={s.selectPopup}>
              {placeholder && (
                <BaseSelect.Item className={s.selectItem} value={null}>
                  <BaseSelect.ItemText>{placeholder}</BaseSelect.ItemText>
                </BaseSelect.Item>
              )}
              {options.map((option) => (
                <BaseSelect.Item
                  className={s.selectItem}
                  key={option.value}
                  value={option.value}
                >
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function TextareaField({ label, id, ...props }: TextareaFieldProps) {
  const inputId = id ?? label;
  return (
    <label className={s.field} htmlFor={inputId}>
      <span className={s.label}>{label}</span>
      <textarea id={inputId} className={s.textarea} {...props} />
    </label>
  );
}

export function Dialog({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={s.dialogBackdrop} />
        <BaseDialog.Viewport className={s.dialogViewport}>
          <BaseDialog.Popup className={s.dialog}>
            <RowBetween>
              <BaseDialog.Title className={s.heading}>{title}</BaseDialog.Title>
              <BaseDialog.Close className={s.iconButton} aria-label="关闭">
                <IconX size={17} />
              </BaseDialog.Close>
            </RowBetween>
            <div className={s.dialogBody}>{children}</div>
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cx(s.spinner, className)} aria-label="加载中" />;
}

export function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: string;
  onChange: (v: string) => void;
  tabs: Array<{ key: string; label: string }>;
}) {
  return (
    <div className={s.tabsList} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          className={s.tab}
          data-selected={value === t.key || undefined}
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return <code className={s.code}>{children}</code>;
}

export function Stack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.stack, className)} {...props} />;
}

export function StackTight({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.stackTight, className)} {...props} />;
}

export function Row({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.row, className)} {...props} />;
}

export function RowBetween({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.rowBetween, className)} {...props} />;
}

export function Alert({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className={s.alert} role="status">
      {icon}
      <div>{children}</div>
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className={s.badge}>{children}</span>;
}

const STATUS_LABELS: Record<string, string> = {
  in_stock: '在库',
  borrowed: '借出中',
  idle: '闲置',
  for_sale: '待售',
  sold: '已售',
  given_away: '已赠',
  lost: '遗失',
  stolen: '被盗',
  unreturned: '未归还',
  damaged: '损坏',
  archived: '已归档',
};

export function StatusBadge({ status }: { status: string }) {
  const variant = s.statusBadge[status as keyof typeof s.statusBadge] ?? s.statusBadge.idle;
  return <span className={variant}>{STATUS_LABELS[status] ?? status}</span>;
}

type ToastContextValue = {
  show: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <BaseToast.Provider>
      <ToastLayer>{children}</ToastLayer>
    </BaseToast.Provider>
  );
}

function ToastLayer({ children }: { children: ReactNode }) {
  const manager = BaseToast.useToastManager();

  const show = useCallback((message: string) => {
    manager.add({ description: message, timeout: 3200 });
  }, [manager]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport className={s.toastViewport}>
          {manager.toasts.map((toast) => (
            <BaseToast.Root className={s.toast} key={toast.id} toast={toast}>
              <BaseToast.Description>{toast.description}</BaseToast.Description>
            </BaseToast.Root>
          ))}
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return value;
}

export { s as uiStyles };
