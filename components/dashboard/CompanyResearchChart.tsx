"use client"

import * as React from "react"
import { insforge } from "@/lib/insforge"
import { BarChart } from "./BarChart"
import { researchSeries, niceScale, seriesTotal, type Series } from "@/lib/utils/dashboard"

export function CompanyResearchChart() {
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
          .select("company_research, found_at")
          .eq("user_id", user.id)
        setSeries(researchSeries(data || []))
      } catch (err) {
        console.error("Failed to load Company Research Activity:", err)
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
        No companies researched in the last 7 days. Open a job and research a company to see activity.
      </div>
    )
  }

  const { maxY, ticks } = niceScale(Math.max(...series.map((d) => d.value)))
  return (
    <BarChart
      data={series}
      maxY={maxY}
      ticks={ticks}
      color="var(--color-info-medium)"
      ariaLabel="Company research activity over the last 7 days"
    />
  )
}
