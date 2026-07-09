import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants = {
      primary: "bg-accent text-accent-foreground font-medium rounded-md px-4 py-2 hover:bg-accent-dark transition-colors",
      secondary: "bg-surface border border-border text-text-primary font-medium rounded-md px-4 py-2 hover:bg-surface-secondary transition-colors",
      ghost: "bg-transparent text-text-secondary font-medium rounded-md px-4 py-2 hover:bg-surface-secondary transition-colors",
    }

    return (
      <button
        ref={ref}
        className={`${variants[variant]} disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${className || ""}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
