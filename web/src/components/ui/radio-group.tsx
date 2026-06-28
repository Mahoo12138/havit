import * as React from 'react';
import { CircleIcon } from 'lucide-react';
import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';

import * as s from './radio-group.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

type RadioGroupProps = Omit<RadioGroupPrimitive.Props<string>, 'className'> & {
  className?: string;
};

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, ...props }, ref) => (
    <RadioGroupPrimitive
      ref={ref}
      data-slot="radio-group"
      className={cx(s.root, className)}
      {...props}
    />
  ),
);
RadioGroup.displayName = 'RadioGroup';

type RadioGroupItemProps = Omit<RadioPrimitive.Root.Props<string>, 'className'> & {
  className?: string;
};

const RadioGroupItem = React.forwardRef<HTMLElement, RadioGroupItemProps>(
  ({ className, ...props }, ref) => (
    <RadioPrimitive.Root
      ref={ref}
      data-slot="radio-group-item"
      className={cx(s.item, className)}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className={s.indicator}
      >
        <CircleIcon />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  ),
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
