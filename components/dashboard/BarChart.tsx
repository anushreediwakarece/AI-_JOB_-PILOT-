export type ChartDatum = { label: string; value: number }

// Self-contained, responsive SVG vertical bar chart. Colors are passed as CSS
// variables (e.g. "var(--color-info-medium)") so it stays token-driven.
export function BarChart({
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
  const W = 560
  const H = 340
  const padL = 42
  const padR = 14
  const padT = 16
  const padB = 36
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const yFor = (v: number) => padT + plotH * (1 - v / maxY)
  const band = plotW / data.length
  const barW = Math.min(48, band * 0.42)
  const baseY = yFor(0)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
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

      {/* bars + x-axis labels */}
      {data.map((d, i) => {
        const cx = padL + band * i + band / 2
        const y = yFor(d.value)
        const h = Math.max(0, baseY - y)
        return (
          <g key={d.label}>
            <rect x={cx - barW / 2} y={y} width={barW} height={h} rx={5} style={{ fill: color }} />
            <text
              x={cx}
              y={H - 12}
              textAnchor="middle"
              fontSize={12}
              style={{ fill: "var(--color-text-muted)" }}
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
