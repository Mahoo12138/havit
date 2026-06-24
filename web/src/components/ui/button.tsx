import { Button as ButtonPrimitive } from '@base-ui/react/button';
import * as React from 'react';
import type { ReactNode } from 'react';

import * as s from './button.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = keyof typeof s.variant | 'primary';
type ButtonSize = keyof typeof s.size;

const variantMap: Record<ButtonVariant, keyof typeof s.variant> = {
  default: 'default',
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  subtle: 'subtle',
  ghost: 'ghost',
  destructive: 'destructive',
  link: 'link',
  quiet: 'quiet',
};

function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  className?: string;
} = {}) {
  const resolvedVariant = variantMap[variant ?? 'default'];

  return cx(s.variant[resolvedVariant], s.size[size ?? 'default'], className);
}

type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> & {
  className?: string;
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  leftSection?: ReactNode;
};

const Button = React.forwardRef<React.ElementRef<typeof ButtonPrimitive>, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      leftSection,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        {leftSection && <span data-icon="inline-start">{leftSection}</span>}
        {children}
      </ButtonPrimitive>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
