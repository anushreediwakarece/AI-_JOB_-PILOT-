"use client"

import * as React from "react"
import { insforge } from "@/lib/insforge"
import { BarChart } from "./BarChart"
import { matchDistribution, niceScale, seriesTotal, type Series } from "@/lib/utils/dashboard"

export function MatchDistributionChart() {
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
          .from("jobs")
          .select("match_score")
          .eq("user_id", user.id)
        setSeries(matchDistribution(data || []))
      } catch (err) {
        console.error("Failed to load Match Score Distribution:", err)
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
        No scored jobs yet. Run a search to see your match distribution.
      </div>
    )
  }

  const { maxY, ticks } = niceScale(Math.max(...series.map((d) => d.value)))
  return (
    <BarChart
      data={series}
      maxY={maxY}
      ticks={ticks}
      color="var(--color-success)"
      ariaLabel="Match score distribution across your jobs"
    />
  )
}
