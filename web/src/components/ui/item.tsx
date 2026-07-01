import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import * as s from "./item.css"

type ItemVariant = keyof typeof s.itemVariant
type ItemSize = keyof typeof s.itemSize
type ItemMediaVariant = keyof typeof s.mediaVariant

function itemClassName({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ItemVariant | null
  size?: ItemSize | null
  className?: string
}) {
  return cn(
    s.itemVariant[variant ?? "default"],
    s.itemSize[size ?? "default"],
    className
  )
}

function itemMediaClassName({
  variant = "default",
  className,
}: {
  variant?: ItemMediaVariant | null
  className?: string
}) {
  return cn(s.mediaVariant[variant ?? "default"], className)
}

function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn(s.group, className)}
      {...props}
    />
  )
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn(s.separator, className)}
      {...props}
    />
  )
}

function Item({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  variant?: ItemVariant | null
  size?: ItemSize | null
}) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: itemClassName({ variant, size, className }),
      },
      props
    ),
    render,
    state: {
      slot: "item",
      variant,
      size,
    },
  })
}

function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: ItemMediaVariant | null
}) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={itemMediaClassName({ variant, className })}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(s.content, className)}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(s.title, className)}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(s.description, className)}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn(s.actions, className)}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(s.header, className)}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(s.footer, className)}
      {...props}
    />
  )
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
