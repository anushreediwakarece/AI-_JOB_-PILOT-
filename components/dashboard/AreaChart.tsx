export type ChartDatum = { label: string; value: number }

type Pt = { x: number; y: number }

// Catmull-Rom → cubic bezier: a smooth curve passing through every point,
// matching the soft wave in the design.
function smoothPath(points: Pt[]): string {
  if (points.length < 2) return points.length ? `M ${points[0].x} ${points[0].y}` : ""
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

// Self-contained, responsive SVG smooth area chart. Color is a CSS variable
// (e.g. "var(--color-accent)") used for both the line and the gradient fill.
export function AreaChart({
  data,
  maxY,
  ticks,
  color,
  ariaLabel,
}: {
  data: ChartDatum[]
  maxY: number
  ticks: number[]
  color: string
  ariaLabel: string
}) {
  const W = 820
  const H = 340
  const padL = 44
  const padR = 18
  const padT = 18
  const padB = 36
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const yFor = (v: number) => padT + plotH * (1 - v / maxY)
  const xFor = (i: number) => padL + (plotW / Math.max(1, data.length - 1)) * i
  const baseY = yFor(0)

  const pts: Pt[] = data.map((d, i) => ({ x: xFor(i), y: yFor(d.value) }))
  const line = smoothPath(pts)
  const area = `${line} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`
  const gradId = "areaFill"

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* gridlines + y-axis labels */}
      {ticks.map((t) => {
        const y = yFor(t)
        return (
          <g key={t}>
            <line
              x1={padL}
              y1={y}
              x2={W - padR}
              y2={y}
              strokeWidth={1}
              strokeDasharray="4 5"
              style={{ stroke: "var(--color-border)" }}
            />
            <text
              x={padL - 10}
              y={y + 4}
              textAnchor="end"
              fontSize={12}
              style={{ fill: "var(--color-text-muted)" }}
            >
              {t}
            </text>
          </g>
        )
      })}

      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: color }} />

      {/* x-axis labels */}
      {data.map((d, i) => (
        <text
          key={d.label}
          x={xFor(i)}
          y={H - 12}
          textAnchor="middle"
          fontSize={12}
          style={{ fill: "var(--color-text-muted)" }}
        >
          {d.label}
        </text>
      ))}
    </svg>
  )
}
