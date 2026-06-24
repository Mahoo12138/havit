import type { ReactNode } from 'react';

import * as s from './code.css';

function Code({ children }: { children: ReactNode }) {
  return <code className={s.root}>{children}</code>;
}

export { Code };
