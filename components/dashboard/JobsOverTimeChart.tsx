"use client"

import * as React from "react"
import { insforge } from "@/lib/insforge"
import { AreaChart } from "./AreaChart"
import { jobsFoundSeries, niceScale, seriesTotal, type Series } from "@/lib/utils/dashboard"

export function JobsOverTimeChart() {
  const [series, setSeries] = React.useState<Series | null>(null)

  React.useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await insforge.auth.getCurrentUser()
        if (!user) {
          setSeries([])
          return
        }
        const { data } = await insforge.database
          .from("agent_runs")
          .select("jobs_found, completed_at, started_at, status")
          .eq("user_id", user.id)
        setSeries(jobsFoundSeries(data || []))
      } catch (err) {
        console.error("Failed to load Jobs Found Over Time:", err)
        setSeries([])
      }
    }
    load()
  }, [])

  if (series === null) {
    return <div className="w-full h-[260px] bg-surface-secondary rounded-lg animate-pulse" />
  }
  if (seriesTotal(series) === 0) {
    return (
      <div className="w-full h-[260px] flex items-center justify-center text-center text-text-muted text-sm px-4">
        No job searches in the last 7 days. Run a search to see your trend.
      </div>
    )
  }

  const { maxY, ticks } = niceScale(Math.max(...series.map((d) => d.value)))
  return (
    <AreaChart
      data={series}
      maxY={maxY}
      ticks={ticks}
      color="var(--color-accent)"
      ariaLabel="Jobs found over the last 7 days"
    />
  )
}
