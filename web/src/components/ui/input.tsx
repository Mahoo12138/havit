import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import * as s from "./input.css"

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ")
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, type, ...props }, ref) {
    return (
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cx(s.root, className)}
        ref={ref}
        {...props}
      />
    )
  },
)

export { Input }
