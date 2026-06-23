"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { Button, buttonVariants } from "@/components/ui/button"
import * as s from "./calendar.css"

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ")
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cx(s.calendar, className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cx(s.root, defaultClassNames.root),
        months: cx(s.months, defaultClassNames.months),
        month: cx(s.month, defaultClassNames.month),
        nav: cx(s.nav, defaultClassNames.nav),
        button_previous: cx(
          buttonVariants({ variant: buttonVariant }),
          s.navButton,
          defaultClassNames.button_previous
        ),
        button_next: cx(
          buttonVariants({ variant: buttonVariant }),
          s.navButton,
          defaultClassNames.button_next
        ),
        month_caption: cx(s.monthCaption, defaultClassNames.month_caption),
        dropdowns: cx(s.dropdowns, defaultClassNames.dropdowns),
        dropdown_root: cx(s.dropdownRoot, defaultClassNames.dropdown_root),
        dropdown: cx(s.dropdown, defaultClassNames.dropdown),
        caption_label: cx(
          captionLayout === "label"
            ? s.captionLabel
            : s.captionLabelDropdown,
          defaultClassNames.caption_label
        ),
        month_grid: cx(s.monthGrid, defaultClassNames.month_grid),
        weekdays: cx(s.weekdays, defaultClassNames.weekdays),
        weekday: cx(s.weekday, defaultClassNames.weekday),
        week: cx(s.week, defaultClassNames.week),
        week_number_header: cx(s.weekNumberHeader, defaultClassNames.week_number_header),
        week_number: cx(s.weekNumber, defaultClassNames.week_number),
        day: cx(
          s.day,
          props.showWeekNumber
            ? s.dayWithWeekNumber
            : undefined,
          defaultClassNames.day
        ),
        range_start: cx(s.rangeStart, defaultClassNames.range_start),
        range_middle: cx(s.rangeMiddle, defaultClassNames.range_middle),
        range_end: cx(s.rangeEnd, defaultClassNames.range_end),
        today: cx(s.today, defaultClassNames.today),
        outside: cx(s.outside, defaultClassNames.outside),
        disabled: cx(s.disabled, defaultClassNames.disabled),
        hidden: cx(s.hidden, defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={className}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cx(s.chevron, className)}
                {...props}
              />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cx(s.chevron, className)}
                {...props}
              />
            )
          }

          return <ChevronDownIcon className={cx(s.chevron, className)} {...props} />
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className={s.weekNumberContent}>
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cx(
        s.dayButton,
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
