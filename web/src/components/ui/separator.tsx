import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';

import * as s from './separator.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: Omit<SeparatorPrimitive.Props, 'className'> & { className?: string }) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cx(s.root, className)}
      {...props}
    />
  );
}

export { Separator };
