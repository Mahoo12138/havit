import type { HTMLAttributes } from "react"

import * as s from "./card.css"

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ")
}

function Card({
  className,
  size = "default",
  padded,
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: "default" | "sm"; padded?: boolean }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cx(
        s.root,
        size === "sm" ? s.sizeSm : undefined,
        padded ? s.padded : undefined,
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cx(s.header, className)}
      {...props}
    />
  )
}

function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-title"
      className={cx(s.title, className)}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-description"
      className={cx(s.description, className)}
      {...props}
    />
  )
}

function CardAction({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-action"
      className={cx(s.action, className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-content"
      className={cx(s.content, className)}
      {...props}
    />
  )
}

function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cx(s.footer, className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
