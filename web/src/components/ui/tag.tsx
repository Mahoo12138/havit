import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import * as s from './tag.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

type TagVariant = keyof typeof s.variant;

function Tag({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & { variant?: TagVariant | null }) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cx(s.variant[variant ?? 'default'], className),
      },
      props
    ),
    render,
    state: {
      slot: 'tag',
      variant,
    },
  });
}

export { Tag };
export type { TagVariant };
