"use client"

import { Select as SelectPrimitive } from "@base-ui/react/select"
import type { ComponentProps } from "react"
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react"

import * as s from "./styles.css"

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ")
}

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: Omit<SelectPrimitive.Group.Props, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cx(s.selectGroup, className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: Omit<SelectPrimitive.Value.Props, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cx(s.selectValue, className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: Omit<SelectPrimitive.Trigger.Props, 'className'> & {
  size?: "sm" | "default"
  className?: string
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cx(
        s.selectTrigger,
        s.selectTriggerShadcn,
        s.selectTriggerSize[size],
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={<IconChevronDown size={16} className={s.selectChevron} />}
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: Omit<SelectPrimitive.Popup.Props, 'className'> &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  > & { className?: string }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className={s.selectPositioner}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cx(s.selectPopup, className)}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: Omit<SelectPrimitive.GroupLabel.Props, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cx(s.selectLabel, className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: Omit<SelectPrimitive.Item.Props, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cx(s.selectItem, className)}
      {...props}
    >
      <SelectPrimitive.ItemText className={s.selectItemText}>
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className={s.selectItemIndicator}>
            <IconCheck size={14} />
          </span>
        }
      />
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: Omit<SelectPrimitive.Separator.Props, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cx(s.selectSeparator, className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: Omit<ComponentProps<typeof SelectPrimitive.ScrollUpArrow>, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cx(s.selectScrollArrow, className)}
      {...props}
    >
      <IconChevronUp size={14} />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: Omit<ComponentProps<typeof SelectPrimitive.ScrollDownArrow>, 'className'> & { className?: string }) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cx(s.selectScrollArrow, className)}
      {...props}
    >
      <IconChevronDown size={14} />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
