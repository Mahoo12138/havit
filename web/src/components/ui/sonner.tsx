"use client"

import type { CSSProperties } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { themeVars } from "../../styles/theme.css"
import * as s from "./sonner.css"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={s.toaster}
      icons={{
        success: <CircleCheckIcon className={s.icon} />,
        info: <InfoIcon className={s.icon} />,
        warning: <TriangleAlertIcon className={s.icon} />,
        error: <OctagonXIcon className={s.icon} />,
        loading: <Loader2Icon className={s.loadingIcon} />,
      }}
      style={
        {
          "--normal-bg": themeVars.panel,
          "--normal-text": themeVars.text,
          "--normal-border": themeVars.line,
          "--border-radius": themeVars.radius2,
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
