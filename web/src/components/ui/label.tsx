import * as React from 'react';

import * as s from './label.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cx(s.root, className)}
      {...props}
    />
  );
}

export { Label };
