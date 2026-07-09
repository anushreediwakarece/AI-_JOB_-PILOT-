"use client"

import * as React from "react"
import { insforge } from "@/lib/insforge"
import { RecentActivity, type ActivityItem } from "./RecentActivity"

type Entry = ActivityItem & { ts: number }

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}

function SkeletonRow({ last }: { last?: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center pt-1.5">
        <span className="w-3 h-3 rounded-full bg-surface-secondary animate-pulse" />
        {!last && <span className="w-px flex-1 mt-1.5 bg-border" />}
      </div>
      <div className={last ? "" : "pb-6"}>
        <div className="h-4 w-48 bg-surface-secondary rounded animate-pulse" />
        <div className="h-3 w-20 bg-surface-secondary rounded animate-pulse mt-2" />
      </div>
    </div>
  )
}

export function RecentActivityFeed() {
  const [items, setItems] = React.useState<ActivityItem[] | null>(null)

  React.useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await insforge.auth.getCurrentUser()
        if (!user) {
          setItems([])
          return
        }

        const [runsRes, jobsRes] = await Promise.all([
          insforge.database.from("agent_runs").select("*").eq("user_id", user.id),
          insforge.database
            .from("jobs")
            .select("company, found_at, company_research")
            .eq("user_id", user.id),
        ])

        const entries: Entry[] = []

        // Completed job searches → "Found X jobs for <title>"
        for (const run of (runsRes.data || []) as any[]) {
          if (run.status !== "completed") continue
          const when = run.completed_at || run.started_at
          if (!when) continue
          entries.push({
            title: `Found ${run.jobs_found ?? 0} job${run.jobs_found === 1 ? "" : "s"} for ${run.job_title_searched || "your search"}`,
            time: timeAgo(when),
            color: "var(--color-accent)",
            ts: new Date(when).getTime(),
          })
        }

        // Researched companies → "Researched <company>"
        for (const job of (jobsRes.data || []) as any[]) {
          if (job.company_research == null || !job.found_at) continue
          entries.push({
            title: `Researched ${job.company}`,
            time: timeAgo(job.found_at),
            color: "var(--color-info-medium)",
            ts: new Date(job.found_at).getTime(),
          })
        }

        entries.sort((a, b) => b.ts - a.ts)
        setItems(entries.slice(0, 6).map(({ ts, ...rest }) => rest))
      } catch (err) {
        console.error("Failed to load recent activity:", err)
        setItems([])
      }
    }
    load()
  }, [])

  if (items === null) {
    return (
      <div className="flex flex-col">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow last />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="text-text-muted text-sm py-4">
        No recent activity yet. Run a job search or research a company to see it here.
      </p>
    )
  }

  return <RecentActivity items={items} />
}
