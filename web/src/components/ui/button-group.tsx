import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { ComponentProps } from 'react';

import { Separator } from './separator';
import * as s from './button-group.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonGroupOrientation = keyof typeof s.rootOrientation;

function buttonGroupVariants({
  orientation = 'horizontal',
  className,
}: {
  orientation?: ButtonGroupOrientation | null;
  className?: string;
} = {}) {
  return cx(s.rootOrientation[orientation ?? 'horizontal'], className);
}

function ButtonGroup({
  className,
  orientation = 'horizontal',
  ...props
}: ComponentProps<'div'> & {
  orientation?: ButtonGroupOrientation | null;
}) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation ?? 'horizontal'}
      className={buttonGroupVariants({ orientation, className })}
      {...props}
    />
  );
}

function ButtonGroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cx(s.text, className),
      },
      props,
    ),
    render,
    state: {
      slot: 'button-group-text',
    },
  });
}

function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cx(s.separator, className)}
      {...props}
    />
  );
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
};
