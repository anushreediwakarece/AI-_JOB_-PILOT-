// Pure helpers that turn raw DB rows into dashboard chart series. No I/O — kept
// pure so they're unit-testable without auth or a running app.

export type Series = { label: string; value: number }[]

type Day = { start: number; end: number; label: string }

const DAY_MS = 24 * 60 * 60 * 1000

/** The last 7 calendar days (oldest → today), each labelled by weekday (Mon…Sun). */
export function last7Days(now: number = Date.now()): Day[] {
  const base = new Date(now)
  base.setHours(0, 0, 0, 0)
  const days: Day[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    const start = d.getTime()
    days.push({ start, end: start + DAY_MS, label: d.toLocaleDateString("en-US", { weekday: "short" }) })
  }
  return days
}

function inDay(ts: number, day: Day): boolean {
  return ts >= day.start && ts < day.end
}

/** Jobs Found Over Time — sum of `jobs_found` from completed runs, per day (last 7 days). */
export function jobsFoundSeries(runs: any[], now?: number): Series {
  return last7Days(now).map((day) => {
    let value = 0
    for (const r of runs || []) {
      if (r?.status !== "completed") continue
      const when = r.completed_at || r.started_at
      if (!when) continue
      if (inDay(new Date(when).getTime(), day)) value += Number(r.jobs_found) || 0
    }
    return { label: day.label, value }
  })
}

/** Company Research Activity — count of researched jobs per day (last 7 days). */
export function researchSeries(jobs: any[], now?: number): Series {
  return last7Days(now).map((day) => {
    let value = 0
    for (const j of jobs || []) {
      if (j?.company_research == null || !j.found_at) continue
      if (inDay(new Date(j.found_at).getTime(), day)) value += 1
    }
    return { label: day.label, value }
  })
}

const MATCH_BUCKETS = [
  { label: "50-60%", min: 50, max: 60 },
  { label: "60-70%", min: 60, max: 70 },
  { label: "70-80%", min: 70, max: 80 },
  { label: "80-90%", min: 80, max: 90 },
  { label: "90-100%", min: 90, max: 100.01 },
]

/** Match Score Distribution — count of jobs per 10-point band (50–100; <50 omitted, per design). */
export function matchDistribution(jobs: any[]): Series {
  return MATCH_BUCKETS.map((b) => ({
    label: b.label,
    value: (jobs || []).filter((j) => {
      const s = j?.match_score
      return typeof s === "number" && s >= b.min && s < b.max
    }).length,
  }))
}

const NICE_STEPS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 100, 200, 250, 500, 1000]

/** A clean y-axis for a chart: 5 evenly-spaced integer ticks that cover `maxValue`. */
export function niceScale(maxValue: number): { maxY: number; ticks: number[] } {
  const max = Math.max(1, Math.ceil(maxValue))
  const rough = max / 4
  const step = NICE_STEPS.find((s) => s >= rough) ?? Math.ceil(rough)
  const maxY = step * 4
  return { maxY, ticks: [0, step, step * 2, step * 3, maxY] }
}

/** Total of a series — used to decide the empty state. */
export function seriesTotal(series: Series): number {
  return series.reduce((sum, d) => sum + d.value, 0)
}
