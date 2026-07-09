"use client"

import * as React from "react"
import { Sun, Moon } from "lucide-react"

type Theme = "light" | "dark"

// Segmented Bright/Dark switch. Toggles the `dark` class on <html> (which drives
// all the color tokens) and persists the choice in localStorage. Default is dark.
export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("dark")

  React.useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
  }, [])

  const apply = (next: Theme) => {
    setTheme(next)
    const root = document.documentElement
    if (next === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
    try {
      localStorage.setItem("theme", next)
    } catch {
      // ignore storage errors (private mode etc.)
    }
  }

  const optionClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-accent text-accent-foreground shadow-sm" : "text-text-secondary hover:text-text-primary"
    }`

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-sm"
    >
      <button type="button" onClick={() => apply("light")} aria-pressed={theme === "light"} className={optionClass(theme === "light")}>
        <Sun className="w-4 h-4" /> Bright
      </button>
      <button type="button" onClick={() => apply("dark")} aria-pressed={theme === "dark"} className={optionClass(theme === "dark")}>
        <Moon className="w-4 h-4" /> Dark
      </button>
    </div>
  )
}
