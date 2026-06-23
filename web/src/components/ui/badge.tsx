import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import * as s from './badge.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

type BadgeVariant = keyof typeof s.variant;

function badgeVariants({
  variant = 'default',
  className,
}: {
  variant?: BadgeVariant | null;
  className?: string;
} = {}) {
  return cx(s.variant[variant ?? 'default'], className);
}

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & { variant?: BadgeVariant | null }) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: badgeVariants({ variant, className }),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
