import type { HTMLAttributes } from 'react';

import * as s from './layout.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function Stack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.stack, className)} {...props} />;
}

function StackTight({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.stackTight, className)} {...props} />;
}

function Row({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.row, className)} {...props} />;
}

function RowBetween({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.rowBetween, className)} {...props} />;
}

export { Row, RowBetween, Stack, StackTight };
