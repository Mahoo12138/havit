import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { ReactNode } from 'react';

import * as s from './styles.css';

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = keyof typeof s.buttonVariant;
type ButtonSize = keyof typeof s.buttonSize;

type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  iconOnly?: boolean;
  className?: string;
};

function Button({
  className,
  variant = 'primary',
  size = 'default',
  leftSection,
  rightSection,
  iconOnly = false,
  children,
  ...props
}: ButtonProps) {
  const variantClass = s.buttonVariant[variant];
  const sizeClass = iconOnly
    ? s.iconButtonSize[size]
    : s.buttonSize[size];

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cx(variantClass, sizeClass, className)}
      {...props}
    >
      {leftSection}
      {children}
      {rightSection}
    </ButtonPrimitive>
  );
}

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
