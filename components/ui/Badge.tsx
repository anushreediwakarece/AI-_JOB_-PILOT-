import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "error" | "warning" | "outline"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-secondary text-text-secondary",
    success: "bg-success-lightest text-success-foreground",
    error: "bg-error text-error-foreground",
    warning: "bg-warning text-warning-foreground",
    outline: "border border-border text-text-primary bg-transparent",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className || ""}`}
      {...props}
    />
  )
}
