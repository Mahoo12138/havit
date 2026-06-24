import type { ReactNode } from 'react';

import * as s from './alert.css';

function Alert({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className={s.root} role="status">
      {icon}
      <div>{children}</div>
    </div>
  );
}

export { Alert };
