import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import * as s from './popover.css';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: Omit<PopoverPrimitive.Popup.Props, 'className'> &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & { className?: string }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className={s.positioner}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cx(s.content, className)}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cx(s.header, className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: Omit<PopoverPrimitive.Title.Props, 'className'> & { className?: string }) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cx(s.title, className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: Omit<PopoverPrimitive.Description.Props, 'className'> & { className?: string }) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cx(s.description, className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
