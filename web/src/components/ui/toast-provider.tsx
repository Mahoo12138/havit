import type { ReactNode } from 'react';

import { Toaster } from './sonner';

function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

export { ToastProvider };
