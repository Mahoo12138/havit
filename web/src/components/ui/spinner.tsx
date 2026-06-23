import type { HTMLAttributes } from 'react';

import * as s from './spinner.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function Spinner({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cx(s.root, className)}
      {...props}
    />
  );
}

export { Spinner };
