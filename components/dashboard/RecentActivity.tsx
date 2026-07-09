export type ActivityItem = {
  title: string
  time: string
  /** CSS variable color for the dot, e.g. "var(--color-accent)" */
  color: string
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <li key={i} className="flex gap-4">
            <div className="flex flex-col items-center pt-1.5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              {!isLast && (
                <span
                  className="w-px flex-1 mt-1.5"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
              )}
            </div>
            <div className={isLast ? "" : "pb-6"}>
              <p className="text-text-primary font-semibold text-sm">{item.title}</p>
              <p className="text-text-muted text-sm mt-0.5">{item.time}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
