import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import * as s from "./input.css"

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ")
}

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cx(s.root, className)}
      {...props}
    />
  )
}

export { Input }
