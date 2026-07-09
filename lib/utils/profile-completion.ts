import { ProfileFormValues } from "../validations/profile"

export interface ProfileCompletionResult {
  isComplete: boolean
  percentage: number
  missingFields: string[]
}

const REQUIRED_FIELDS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'current_title', label: 'Current Job Title' },
  { key: 'experience_level', label: 'Experience Level' },
  { key: 'skills', label: 'Skills (at least one)' },
  { key: 'work_experience', label: 'Work Experience (at least one role)' },
  { key: 'job_titles_seeking', label: 'Target Job Titles (at least one)' },
]

export function calculateProfileCompletion(profile: Partial<ProfileFormValues> | null): ProfileCompletionResult {
  if (!profile) {
    return {
      isComplete: false,
      percentage: 0,
      missingFields: REQUIRED_FIELDS.map(f => f.label),
    }
  }

  const missingFields: string[] = []
  let completedCount = 0

  REQUIRED_FIELDS.forEach(field => {
    let isFieldComplete = false
    const value = profile[field.key as keyof ProfileFormValues]

    if (Array.isArray(value)) {
      isFieldComplete = value.length > 0
    } else {
      isFieldComplete = value !== null && value !== undefined && value !== ''
    }

    if (isFieldComplete) {
      completedCount++
    } else {
      missingFields.push(field.label)
    }
  })

  const percentage = Math.round((completedCount / REQUIRED_FIELDS.length) * 100)
  const isComplete = completedCount === REQUIRED_FIELDS.length

  return {
    isComplete,
    percentage,
    missingFields,
  }
}
