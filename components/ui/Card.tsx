import * as React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl p-6 shadow-sm ${className || ""}`}
      {...props}
    />
  )
}
