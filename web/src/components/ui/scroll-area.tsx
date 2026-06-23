import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';

import * as s from './scroll-area.css';

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ScrollAreaProps = Omit<ScrollAreaPrimitive.Root.Props, 'className'> & {
  className?: string;
};

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cx(s.root, className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={s.viewport}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner className={s.corner} />
    </ScrollAreaPrimitive.Root>
  );
}

type ScrollBarProps = Omit<ScrollAreaPrimitive.Scrollbar.Props, 'className'> & {
  className?: string;
};

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cx(
        orientation === 'horizontal'
          ? s.horizontal
          : s.vertical,
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={s.scrollbarThumb}
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
