"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import * as s from "./tabs.css"

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ")
}

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: Omit<TabsPrimitive.Root.Props, "className"> & {
  className?: string
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cx(s.root, className)}
      {...props}
    />
  )
}

type TabsListVariant = keyof typeof s.listVariant

function tabsListVariants({
  variant = "default",
  className,
}: {
  variant?: TabsListVariant | null
  className?: string
} = {}) {
  return cx(s.listVariant[variant ?? "default"], className)
}

function TabsList({
  className,
  variant = "default",
  ...props
}: Omit<TabsPrimitive.List.Props, "className"> & {
  className?: string
  variant?: TabsListVariant | null
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={tabsListVariants({ variant, className })}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: Omit<TabsPrimitive.Tab.Props, "className"> & {
  className?: string
}) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cx(s.trigger, className)}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: Omit<TabsPrimitive.Panel.Props, "className"> & {
  className?: string
}) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cx(s.content, className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
