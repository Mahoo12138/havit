import {
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import { Spinner } from './spinner';
import { ScrollArea } from './scroll-area';
import { Dialog as DialogRoot, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Toaster } from './sonner';
import * as s from './styles.css';

export { Button, Card, Badge, Spinner, ScrollArea };
export { s as uiStyles };

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
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
    <DialogRoot open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className={s.dialogBody}>{children}</div>
      </DialogContent>
    </DialogRoot>
  );
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

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

export function useToast() {
  return {
    show: (message: string) => toast(message),
  };
}

export function Tooltip({ tip, children, className }: { tip: string; children: ReactNode; className?: string }) {
  return (
    <span className={cx(s.tooltip, className)} data-tip={tip} tabIndex={0} role="tooltip">
      {children}
    </span>
  );
}
