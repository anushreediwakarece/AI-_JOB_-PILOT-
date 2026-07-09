"use client"

import * as React from "react"
import { insforge } from "@/lib/insforge"
import { Card } from "@/components/ui/Card"
import { StatCard } from "./StatCard"

type Stats = {
  total: number
  avgMatch: number
  researched: number
  thisWeek: number
}

function SkeletonCard() {
  return (
    <Card className="p-6">
      <div className="h-4 w-28 bg-surface-secondary rounded animate-pulse" />
      <div className="h-9 w-16 bg-surface-secondary rounded animate-pulse mt-3 mb-3" />
      <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse" />
    </Card>
  )
}

export function StatsBar() {
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await insforge.auth.getCurrentUser()
        if (!user) {
          setStats({ total: 0, avgMatch: 0, researched: 0, thisWeek: 0 })
          return
        }

        const { data } = await insforge.database
          .from("jobs")
          .select("match_score, company_research, found_at")
          .eq("user_id", user.id)

        const jobs: any[] = data || []

        // Total Jobs Found — count of the user's jobs.
        const total = jobs.length

        // Avg. Match Rate — average match_score across all scored jobs.
        const scored = jobs.filter((j) => typeof j.match_score === "number")
        const avgMatch = scored.length
          ? Math.round(scored.reduce((sum, j) => sum + j.match_score, 0) / scored.length)
          : 0

        // Companies Researched — jobs that have a company_research dossier.
        const researched = jobs.filter((j) => j.company_research != null).length

        // Jobs This Week — found within the last 7 days.
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const thisWeek = jobs.filter(
          (j) => j.found_at && new Date(j.found_at).getTime() >= weekAgo
        ).length

        setStats({ total, avgMatch, researched, thisWeek })
      } catch (err) {
        console.error("Failed to load dashboard stats:", err)
        setStats({ total: 0, avgMatch: 0, researched: 0, thisWeek: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Jobs Found" value={`${stats.total}`} subtitle="In your list" />
      <StatCard title="Avg. Match Rate" value={`${stats.avgMatch}%`} subtitle="Across your jobs" />
      <StatCard title="Companies Researched" value={`${stats.researched}`} subtitle="Total researched" />
      <StatCard title="Jobs This Week" value={`${stats.thisWeek}`} subtitle="New this week" />
    </div>
  )
}
