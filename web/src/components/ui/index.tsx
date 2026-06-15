import {
  createContext,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';

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
  const { t } = useTranslation();
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
          <BaseSelect.Value placeholder={placeholder ?? t('common.selectPlaceholder')} />
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
  const { t } = useTranslation();
  return (
    <BaseDialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={s.dialogBackdrop} />
        <BaseDialog.Viewport className={s.dialogViewport}>
          <BaseDialog.Popup className={s.dialog}>
            <RowBetween>
              <BaseDialog.Title className={s.heading}>{title}</BaseDialog.Title>
              <BaseDialog.Close className={s.iconButton} aria-label={t('common.close')}>
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
  const { t } = useTranslation();
  return <span className={cx(s.spinner, className)} aria-label={t('common.loading')} />;
}

export function SkeletonText({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={cx(s.skeletonText, className)} style={style} />;
}

export function SkeletonTitle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={cx(s.skeletonTitle, className)} style={style} />;
}

export function SkeletonCircle({ size = '2.25rem', className }: { size?: string; className?: string }) {
  return <span className={cx(s.skeletonCircle, className)} style={{ width: size, height: size }} />;
}

export function SkeletonRect({ className }: { className?: string }) {
  return <div className={cx(s.skeletonRect, className)} />;
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

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const variant = s.statusBadge[status as keyof typeof s.statusBadge] ?? s.statusBadge.idle;
  const label = t(`status.${status}`, status);
  return <span className={variant}>{label}</span>;
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

export function Tooltip({ tip, children, className }: { tip: string; children: ReactNode; className?: string }) {
  return (
    <span className={cx(s.tooltip, className)} data-tip={tip} tabIndex={0} role="tooltip">
      {children}
    </span>
  );
}

type ScrollAreaProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollArea({ children, className, style }: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root className={cx(s.scrollAreaRoot, className)} style={style}>
      <BaseScrollArea.Viewport className={s.scrollAreaViewport}>
        {children}
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar className={s.scrollAreaScrollbarVert} orientation="vertical">
        <BaseScrollArea.Thumb className={s.scrollAreaThumb} />
      </BaseScrollArea.Scrollbar>
      <BaseScrollArea.Scrollbar className={s.scrollAreaScrollbarHoriz} orientation="horizontal">
        <BaseScrollArea.Thumb className={s.scrollAreaThumb} />
      </BaseScrollArea.Scrollbar>
      <BaseScrollArea.Corner className={s.scrollAreaCorner} />
    </BaseScrollArea.Root>
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

/* ---------- TreeSelectField ---------- */

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

type TreeSelectFieldProps = {
  label: string;
  tree: TreeNode[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
};

function findNodePath(
  nodes: TreeNode[],
  targetId: string,
  path: TreeNode[] = [],
): TreeNode[] | null {
  for (const n of nodes) {
    const next = [...path, n];
    if (n.id === targetId) return next;
    if (n.children) {
      const found = findNodePath(n.children, targetId, next);
      if (found) return found;
    }
  }
  return null;
}

function TreeNodeRow({
  node,
  depth,
  selectedId,
  expanded,
  onSelect,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedId: string;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const kids = node.children ?? [];
  const isExpanded = expanded.has(node.id);
  return (
    <div>
      <div
        className={s.treeSelectNode}
        data-selected={selectedId === node.id || undefined}
        style={{ paddingLeft: `calc(${depth * 14}px + var(--havit-space3))` }}
        onClick={() => onSelect(node.id)}
        role="option"
        aria-selected={selectedId === node.id}
      >
        <span
          className={s.treeSelectChevron}
          data-expanded={isExpanded || undefined}
          data-empty={kids.length === 0 || undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (kids.length > 0) onToggle(node.id);
          }}
        >
          <IconChevronRight size={13} />
        </span>
        <span className={s.treeSelectNodeName}>{node.name}</span>
      </div>
      {isExpanded &&
        kids.map((k) => (
          <TreeNodeRow
            key={k.id}
            node={k}
            depth={depth + 1}
            selectedId={selectedId}
            expanded={expanded}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}

export function TreeSelectField({
  label,
  tree,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  id,
}: TreeSelectFieldProps) {
  const { t } = useTranslation();
  const inputId = id ?? label;
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const selectedPath = useMemo(
    () => (value ? findNodePath(tree, value) : null),
    [tree, value],
  );
  const selectedLabel = selectedPath
    ? selectedPath.map((n) => n.name).join(' → ')
    : '';

  const handleToggle = useCallback((nodeId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (nodeId: string) => {
      onChange(nodeId);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div className={s.field}>
      <span className={s.label} id={`${inputId}-label`}>
        {label}
        {required && <span aria-hidden> *</span>}
      </span>
      <BasePopover.Root open={open} onOpenChange={setOpen}>
        <BasePopover.Trigger
          className={s.selectTrigger}
          disabled={disabled}
          aria-labelledby={`${inputId}-label`}
        >
          <span style={{ color: selectedLabel ? 'inherit' : 'var(--havit-muted)' }}>
            {selectedLabel || placeholder || t('common.selectPlaceholder')}
          </span>
          <span className={s.selectIcon}>
            <IconChevronDown size={16} />
          </span>
        </BasePopover.Trigger>
        <BasePopover.Portal>
          <BasePopover.Positioner className={s.selectPositioner} sideOffset={6}>
            <BasePopover.Popup className={s.treeSelectPopup}>
              {tree.map((node) => (
                <TreeNodeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={value}
                  expanded={expanded}
                  onSelect={handleSelect}
                  onToggle={handleToggle}
                />
              ))}
              {tree.length === 0 && (
                <div style={{ padding: '0.5rem', color: 'var(--havit-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  {t('common.noData', '暂无数据')}
                </div>
              )}
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </div>
  );
}

/* ---------- DatePickerField ---------- */

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDateStr(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const startDate = new Date(year, month, 1 - startDow);
  const days: Array<{ date: Date; outside: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({ date: d, outside: d.getMonth() !== month });
  }
  return days;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
};

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  id,
}: DatePickerFieldProps) {
  const { t, i18n } = useTranslation();
  const inputId = id ?? label;
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseDateStr(value), [value]);
  const todayStr = useMemo(() => toDateStr(new Date()), []);

  const [viewYear, setViewYear] = useState(
    () => (selectedDate ?? new Date()).getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    () => (selectedDate ?? new Date()).getMonth(),
  );

  const days = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth]);

  const weekdays = useMemo(() => {
    const locale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US';
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    // 2024-01-01 is Monday
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 1 + i)),
    );
  }, [i18n.language]);

  const handleSelect = useCallback(
    (d: Date) => {
      onChange(toDateStr(d));
      setOpen(false);
    },
    [onChange],
  );

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const handleOpen = useCallback(() => {
    if (disabled) return;
    const d = selectedDate ?? new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(true);
  }, [disabled, selectedDate]);

  return (
    <div className={s.field}>
      <span className={s.label} id={`${inputId}-label`}>
        {label}
        {required && <span aria-hidden> *</span>}
      </span>
      <BasePopover.Root open={open} onOpenChange={setOpen}>
        <BasePopover.Trigger
          className={s.selectTrigger}
          disabled={disabled}
          aria-labelledby={`${inputId}-label`}
          onClick={handleOpen}
        >
          <span style={{ color: displayValue ? 'inherit' : 'var(--havit-muted)' }}>
            {displayValue || placeholder || t('common.selectDate', '选择日期')}
          </span>
          <span className={s.selectIcon}>
            <IconChevronDown size={16} />
          </span>
        </BasePopover.Trigger>
        <BasePopover.Portal>
          <BasePopover.Positioner className={s.selectPositioner} sideOffset={6}>
            <BasePopover.Popup className={s.datePickerPopup}>
              <div className={s.datePickerHeader}>
                <button
                  type="button"
                  className={s.datePickerNavBtn}
                  onClick={prevMonth}
                  aria-label={t('common.prevMonth', '上个月')}
                >
                  <IconChevronLeft size={16} />
                </button>
                <span className={s.datePickerTitle}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  className={s.datePickerNavBtn}
                  onClick={nextMonth}
                  aria-label={t('common.nextMonth', '下个月')}
                >
                  <IconChevronRight size={16} />
                </button>
              </div>
              <div className={s.datePickerWeekdays}>
                {weekdays.map((wd, i) => (
                  <div key={i} className={s.datePickerWeekday}>{wd}</div>
                ))}
              </div>
              <div className={s.datePickerGrid}>
                {days.map(({ date, outside }, i) => {
                  const dateStr = toDateStr(date);
                  return (
                    <button
                      type="button"
                      key={i}
                      className={s.datePickerDay}
                      data-outside={outside || undefined}
                      data-today={dateStr === todayStr || undefined}
                      data-selected={dateStr === value || undefined}
                      onClick={() => handleSelect(date)}
                      tabIndex={-1}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </div>
  );
}
