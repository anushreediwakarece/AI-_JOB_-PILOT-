import * as z from "zod"

// Subfields are optional so a partial entry (e.g. from AI auto-fill) never blocks
// a save. Profile completeness is tracked separately by calculateProfileCompletion.
export const workExperienceSchema = z.object({
  company: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  currentlyWorking: z.boolean().default(false),
  responsibilities: z.string().optional().nullable(),
})

export const educationSchema = z.object({
  degree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  institution: z.string().optional().nullable(),
  graduationYear: z.string().optional().nullable(),
})

export const profileFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")).nullable(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  current_title: z.string().optional().nullable(),
  experience_level: z.enum(['junior', 'mid', 'senior', 'lead']).optional().or(z.literal("")).nullable(),
  years_experience: z.coerce.number().nonnegative().optional().nullable(),
  skills: z.array(z.string()).optional().default([]),
  industries: z.array(z.string()).optional().default([]),
  work_experience: z.array(workExperienceSchema).optional().default([]),
  education: z.array(educationSchema).optional().default([]),
  job_titles_seeking: z.array(z.string()).optional().default([]),
  remote_preference: z.enum(['remote', 'onsite', 'hybrid', 'any']).optional().or(z.literal("")).nullable(),
  preferred_locations: z.array(z.string()).optional().default([]),
  salary_expectation: z.string().optional().nullable(),
  cover_letter_tone: z.enum(['formal', 'casual', 'enthusiastic']).optional().or(z.literal("")).nullable(),
  // Kept as plain strings — AI extraction and users often enter bare domains
  // (e.g. "linkedin.com/in/you") without a protocol, which a strict URL check rejects.
  linkedin_url: z.string().optional().or(z.literal("")).nullable(),
  portfolio_url: z.string().optional().or(z.literal("")).nullable(),
  work_authorization: z.enum(['citizen', 'permanent_resident', 'visa_required']).optional().or(z.literal("")).nullable(),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>
export type WorkExperience = z.infer<typeof workExperienceSchema>
export type Education = z.infer<typeof educationSchema>
