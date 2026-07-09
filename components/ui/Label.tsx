import * as React from "react"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-xs font-medium text-text-secondary uppercase mb-1.5 block tracking-wider ${className || ""}`}
      {...props}
    />
  )
)
Label.displayName = "Label"
