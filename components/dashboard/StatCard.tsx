import { Card } from "@/components/ui/Card"

export function StatCard({
  title,
  value,
  delta,
  subtitle,
}: {
  title: string
  value: string
  delta?: string
  subtitle: string
}) {
  return (
    <Card className="p-6">
      <p className="text-text-secondary text-sm font-medium">{title}</p>
      <p className="text-4xl font-bold text-text-primary mt-2 mb-3">{value}</p>
      <div className="flex items-center gap-2">
        {delta && (
          <span className="rounded-md bg-success-lightest text-success-foreground text-xs font-semibold px-2 py-1">
            {delta}
          </span>
        )}
        <span className="text-text-muted text-sm">{subtitle}</span>
      </div>
    </Card>
  )
}
