import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

import * as s from './table.css'

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ')
}

function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div data-slot="table-container" className={s.root}>
      <table
        data-slot="table"
        className={cx(s.table, className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      data-slot="table-header"
      className={className}
      {...props}
    />
  )
}

function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      data-slot="table-body"
      className={cx(s.body, className)}
      {...props}
    />
  )
}

function TableFooter({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cx(s.footer, className)}
      {...props}
    />
  )
}

function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      data-slot="table-row"
      className={cx(s.row, className)}
      {...props}
    />
  )
}

function TableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      data-slot="table-head"
      className={cx(s.head, className)}
      {...props}
    />
  )
}

function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      data-slot="table-cell"
      className={cx(s.cell, className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      data-slot="table-caption"
      className={cx(s.caption, className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}
