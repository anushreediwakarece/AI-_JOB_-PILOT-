import { Card } from "@/components/ui/Card"
import { AlertCircle, CheckCircle } from "lucide-react"

interface ProfileBannerProps {
  percentage: number
  missingFields: string[]
  isComplete: boolean
}

export function ProfileBanner({ percentage, missingFields, isComplete }: ProfileBannerProps) {
  if (isComplete) {
    return (
      <Card className="flex items-center justify-between border-success/20 bg-success/5" style={{ borderColor: 'rgba(34, 197, 94, 0.2)', backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
            <h2 className="text-base font-semibold text-text-primary">Profile Complete</h2>
          </div>
          <p className="text-sm font-medium text-text-primary">
            Your profile is fully complete. You are ready to generate tailored resumes and receive accurate matches.
          </p>
        </div>

        <div className="relative w-24 h-24 flex shrink-0 items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-border"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              strokeWidth="3.5"
              strokeDasharray="100, 100"
              stroke="#22c55e"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-2xl font-bold text-text-primary">100%</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex items-center justify-between border-error/20 bg-error/5" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
          <h2 className="text-base font-semibold text-text-primary">Profile needs attention</h2>
        </div>
        <p className="text-sm font-medium text-text-primary">
          Complete the missing fields to improve your chance of getting tailored matches and generating quality resumes.
        </p>
        {missingFields.length > 0 && (
          <div className="flex gap-2 mt-1 flex-wrap">
            {missingFields.slice(0, 3).map((field) => (
              <span
                key={field}
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444'
                }}
              >
                {field.toUpperCase()}
              </span>
            ))}
            {missingFields.length > 3 && (
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444'
                }}
              >
                +{missingFields.length - 3} MORE
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative w-24 h-24 flex shrink-0 items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-border"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            strokeWidth="3.5"
            strokeDasharray={`${Math.max(0, percentage)}, 100`}
            stroke="#ef4444"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="absolute text-2xl font-bold text-text-primary">{percentage}%</span>
      </div>
    </Card>
  )
}
