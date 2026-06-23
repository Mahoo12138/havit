import * as React from 'react';

import * as s from './textarea.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cx(s.root, className)}
      {...props}
    />
  );
}

export { Textarea };
