import type { ReactNode } from 'react';

import { Dialog as DialogRoot, DialogContent, DialogHeader, DialogTitle } from './dialog';
import * as s from './dialog-compat.css';

function Dialog({
  open,
  title,
  children,
  onClose,
  contentClassName,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  contentClassName?: string;
}) {
  return (
    <DialogRoot open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className={s.body}>{children}</div>
      </DialogContent>
    </DialogRoot>
  );
}

export { Dialog };
