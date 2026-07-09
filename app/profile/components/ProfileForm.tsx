"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Checkbox } from "@/components/ui/Checkbox"
import { Button } from "@/components/ui/Button"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import { Plus, X, Calendar, Loader2 } from "lucide-react"
import { profileFormSchema, ProfileFormValues } from "@/lib/validations/profile"
import { insforge } from "@/lib/insforge"
import { calculateProfileCompletion } from "@/lib/utils/profile-completion"

interface ProfileFormProps {
  initialData?: Partial<ProfileFormValues>
  extractedData?: Partial<ProfileFormValues>
  onValuesChange?: (values: Partial<ProfileFormValues>) => void
}

export function ProfileForm({ initialData, extractedData, onValuesChange }: ProfileFormProps) {
  const { register, control, handleSubmit, setValue, getValues, watch, reset, formState: { isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema) as any,
    defaultValues: initialData || {
      skills: [],
      industries: [],
      work_experience: [],
      education: [],
      job_titles_seeking: [],
      preferred_locations: []
    }
  })

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control,
    name: "work_experience"
  })

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: "education"
  })

  React.useEffect(() => {
    if (extractedData) {
      reset({ ...getValues(), ...extractedData })
      setGlobalSuccess("Profile auto-filled from resume! Please review the extracted information.")
    }
  }, [extractedData, reset, getValues])

  const allValues = watch()
  // Use JSON.stringify to avoid infinite render loop caused by new object references
  const serializedValues = JSON.stringify(allValues)
  
  React.useEffect(() => {
    if (onValuesChange) {
      onValuesChange(JSON.parse(serializedValues))
    }
  }, [serializedValues, onValuesChange])

  // Local states for tag inputs
  const [skillInput, setSkillInput] = React.useState("")
  const [industryInput, setIndustryInput] = React.useState("")
  const [jobTitleInput, setJobTitleInput] = React.useState("")
  const [locationInput, setLocationInput] = React.useState("")
  const [globalError, setGlobalError] = React.useState("")
  const [globalSuccess, setGlobalSuccess] = React.useState("")

  const addTag = (fieldName: "skills" | "industries" | "job_titles_seeking" | "preferred_locations", inputVal: string, setInputVal: (val: string) => void) => {
    if (!inputVal.trim()) return
    const current = getValues(fieldName) || []
    if (!current.includes(inputVal.trim())) {
      setValue(fieldName, [...current, inputVal.trim()], { shouldDirty: true })
    }
    setInputVal("")
  }

  const removeTag = (fieldName: "skills" | "industries" | "job_titles_seeking" | "preferred_locations", val: string) => {
    const current = getValues(fieldName) || []
    setValue(fieldName, current.filter(item => item !== val), { shouldDirty: true })
  }

  // Watch tag arrays to re-render badges
  const skills = watch("skills")
  const industries = watch("industries")
  const jobTitles = watch("job_titles_seeking")
  const locations = watch("preferred_locations")

  const onSubmit = async (data: ProfileFormValues) => {
    setGlobalError("")
    setGlobalSuccess("")

    try {
      const { data: { user }, error: authError } = await insforge.auth.getCurrentUser()
      
      if (authError || !user) {
        setGlobalError("Unauthorized. Please log in again.")
        return
      }

      const { isComplete } = calculateProfileCompletion(data)

      const dbPayload = {
        ...data,
        experience_level: data.experience_level === "" ? null : data.experience_level,
        work_authorization: data.work_authorization === "" ? null : data.work_authorization,
        remote_preference: data.remote_preference === "" ? null : data.remote_preference,
        cover_letter_tone: data.cover_letter_tone === "" ? null : data.cover_letter_tone,
      }

      const { error: updateError } = await insforge.database
        .from('profiles')
        .upsert({
          id: user.id,
          ...dbPayload,
          is_complete: isComplete,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        console.error("Database error saving profile:", updateError)
        setGlobalError("Failed to save profile. Please try again.")
        return
      }

      // When the profile is complete, send the user straight to Find Jobs.
      // Otherwise just reload so the completion banner updates.
      if (isComplete) {
        setGlobalSuccess("Profile complete! Taking you to Find Jobs...")
        setTimeout(() => {
          window.location.href = "/find-jobs"
        }, 1500)
      } else {
        setGlobalSuccess("Profile updated successfully")
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (err) {
      console.error(err)
      setGlobalError("An unexpected error occurred while saving.")
    }
  }

  const onInvalid = (errors: any) => {
    // react-hook-form nests array errors (e.g. work_experience.0.startDate), which
    // log as an unhelpful "{}". Flatten to the actual field paths so failures are clear.
    const collectPaths = (obj: any, prefix = ""): string[] => {
      if (!obj || typeof obj !== "object") return []
      if (obj.message && typeof obj.message === "string") return [prefix]
      return Object.keys(obj).flatMap((key) =>
        key === "ref" || key === "type" ? [] : collectPaths(obj[key], prefix ? `${prefix}.${key}` : key)
      )
    }
    const failed = collectPaths(errors)
    console.error("Form validation errors on fields:", failed, errors)
    setGlobalError(
      failed.length
        ? `Please fix these fields before saving: ${failed.join(", ")}`
        : "Please fill out all required fields correctly before saving."
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <Card className="flex flex-col gap-8">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Profile Information</h2>
          <p className="text-sm font-medium text-text-secondary">
            This context is used to accurately represent you in agent interactions.
          </p>
        </div>

        <div className="border-t border-border pt-8">
          <h3 className="text-base font-semibold text-text-primary mb-4">Personal Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>FULL NAME</Label>
              <Input {...register("full_name")} />
            </div>
            <div>
              <Label>EMAIL</Label>
              <Input {...register("email")} />
            </div>
            <div>
              <Label>PHONE NUMBER</Label>
              <Input {...register("phone")} />
            </div>
            <div>
              <Label>LOCATION</Label>
              <Input {...register("location")} placeholder="City, Country" />
            </div>
            <div>
              <Label>LINKEDIN URL</Label>
              <Input {...register("linkedin_url")} />
            </div>
            <div>
              <Label>PORTFOLIO / GITHUB</Label>
              <Input {...register("portfolio_url")} />
            </div>
            <div>
              <Label>WORK AUTHORIZATION</Label>
              <Select {...register("work_authorization")}>
                <option value="">Select...</option>
                <option value="citizen">Citizen</option>
                <option value="permanent_resident">Permanent Resident</option>
                <option value="visa_required">Visa Required</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <h3 className="text-base font-semibold text-text-primary mb-4">Professional Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <Label>CURRENT/RECENT JOB TITLE</Label>
              <Input {...register("current_title")} />
            </div>
            <div>
              <Label>EXPERIENCE LEVEL</Label>
              <Select {...register("experience_level")}>
                <option value="">Select...</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </Select>
            </div>
            <div>
              <Label>YEARS OF EXPERIENCE</Label>
              <Input {...register("years_experience")} type="number" />
            </div>
          </div>
          
          <div className="mb-4">
            <Label>SKILLS</Label>
            <div className="flex gap-2">
              <Input 
                value={skillInput} 
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag("skills", skillInput, setSkillInput))}
                placeholder="Add a skill" 
                className="flex-1" 
              />
              <Button type="button" variant="secondary" onClick={() => addTag("skills", skillInput, setSkillInput)} className="px-6">Add</Button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {skills?.map((skill) => (
                <Badge key={skill} variant="outline" className="gap-1 px-3 py-1 bg-surface-secondary border-none font-normal text-text-primary">
                  {skill} <X onClick={() => removeTag("skills", skill)} className="w-3 h-3 text-text-muted cursor-pointer hover:text-text-primary" />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>INDUSTRIES WORKED IN (OPTIONAL)</Label>
            <div className="flex gap-2">
              <Input 
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag("industries", industryInput, setIndustryInput))}
                placeholder="E.g. FinTech, Healthcare" 
                className="flex-1" 
              />
              <Button type="button" variant="secondary" onClick={() => addTag("industries", industryInput, setIndustryInput)} className="px-6">Add</Button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {industries?.map((ind) => (
                <Badge key={ind} variant="outline" className="gap-1 px-3 py-1 bg-surface-secondary border-none font-normal text-text-primary">
                  {ind} <X onClick={() => removeTag("industries", ind)} className="w-3 h-3 text-text-muted cursor-pointer hover:text-text-primary" />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-primary">Work Experience</h3>
            <Button type="button" variant="ghost" onClick={() => appendWork({ company: "", title: "", startDate: "", endDate: "", currentlyWorking: false, responsibilities: "" })} className="text-accent hover:text-accent-dark hover:bg-transparent px-0 h-auto">
              <Plus className="w-4 h-4 mr-1" /> Add role
            </Button>
          </div>
          
          <div className="flex flex-col gap-6">
            {workFields.map((field, index) => (
              <div key={field.id} className="border border-border rounded-xl p-6 flex flex-col gap-4 relative">
                <Button type="button" variant="ghost" onClick={() => removeWork(index)} className="absolute top-2 right-2 h-8 w-8 p-0 text-text-muted hover:text-error flex items-center justify-center">
                  <X className="w-4 h-4" />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>COMPANY NAME</Label>
                    <Input {...register(`work_experience.${index}.company`)} />
                  </div>
                  <div>
                    <Label>JOB TITLE</Label>
                    <Input {...register(`work_experience.${index}.title`)} />
                  </div>
                  <div>
                    <Label>START DATE</Label>
                    <div className="relative">
                      <Input {...register(`work_experience.${index}.startDate`)} className="pr-10" />
                      <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="mb-0">END DATE</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox {...register(`work_experience.${index}.currentlyWorking`)} id={`work-current-${index}`} />
                        <label htmlFor={`work-current-${index}`} className="text-xs font-medium text-text-primary cursor-pointer">
                          Currently working here
                        </label>
                      </div>
                    </div>
                    <Input {...register(`work_experience.${index}.endDate`)} disabled={watch(`work_experience.${index}.currentlyWorking`)} className={watch(`work_experience.${index}.currentlyWorking`) ? "bg-surface-secondary text-text-muted" : ""} />
                  </div>
                </div>
                <div>
                  <Label>KEY RESPONSIBILITIES</Label>
                  <Textarea {...register(`work_experience.${index}.responsibilities`)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-primary">Education</h3>
            <Button type="button" variant="ghost" onClick={() => appendEdu({ degree: "", fieldOfStudy: "", institution: "", graduationYear: "" })} className="text-accent hover:text-accent-dark hover:bg-transparent px-0 h-auto">
              <Plus className="w-4 h-4 mr-1" /> Add education
            </Button>
          </div>
          <div className="flex flex-col gap-6">
            {eduFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border rounded-xl p-6 relative">
                <Button type="button" variant="ghost" onClick={() => removeEdu(index)} className="absolute top-2 right-2 h-8 w-8 p-0 text-text-muted hover:text-error flex items-center justify-center">
                  <X className="w-4 h-4" />
                </Button>
                <div>
                  <Label>HIGHEST DEGREE</Label>
                  <Input {...register(`education.${index}.degree`)} />
                </div>
                <div>
                  <Label>FIELD OF STUDY</Label>
                  <Input {...register(`education.${index}.fieldOfStudy`)} />
                </div>
                <div>
                  <Label>INSTITUTION NAME</Label>
                  <Input {...register(`education.${index}.institution`)} />
                </div>
                <div>
                  <Label>GRADUATION YEAR</Label>
                  <Input {...register(`education.${index}.graduationYear`)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <h3 className="text-base font-semibold text-text-primary mb-4">Job Preferences</h3>
          <div className="flex flex-col gap-4">
            <div>
              <Label>JOB TITLES SEEKING</Label>
              <div className="flex gap-2">
                <Input 
                  value={jobTitleInput}
                  onChange={(e) => setJobTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag("job_titles_seeking", jobTitleInput, setJobTitleInput))}
                  className="flex-1" 
                />
                <Button type="button" variant="secondary" onClick={() => addTag("job_titles_seeking", jobTitleInput, setJobTitleInput)} className="px-6">Add</Button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {jobTitles?.map((title) => (
                  <Badge key={title} variant="outline" className="gap-1 px-3 py-1 bg-surface-secondary border-none font-normal text-text-primary">
                    {title} <X onClick={() => removeTag("job_titles_seeking", title)} className="w-3 h-3 text-text-muted cursor-pointer hover:text-text-primary" />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>REMOTE PREFERENCE</Label>
                <Select {...register("remote_preference")}>
                  <option value="">Select...</option>
                  <option value="any">Any</option>
                  <option value="remote">Remote Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </Select>
              </div>
              <div>
                <Label>SALARY EXPECTATION (OPTIONAL)</Label>
                <Input {...register("salary_expectation")} placeholder="E.g. $120k+" />
              </div>
            </div>
            <div>
              <Label>PREFERRED LOCATIONS (OPTIONAL)</Label>
              <div className="flex gap-2">
                <Input 
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag("preferred_locations", locationInput, setLocationInput))}
                  placeholder="E.g. New York, London" 
                  className="flex-1" 
                />
                <Button type="button" variant="secondary" onClick={() => addTag("preferred_locations", locationInput, setLocationInput)} className="px-6">Add</Button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {locations?.map((loc) => (
                  <Badge key={loc} variant="outline" className="gap-1 px-3 py-1 bg-surface-secondary border-none font-normal text-text-primary">
                    {loc} <X onClick={() => removeTag("preferred_locations", loc)} className="w-3 h-3 text-text-muted cursor-pointer hover:text-text-primary" />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          {globalError && (
            <div className="rounded-lg bg-error/10 p-4 text-sm text-error border border-error/20">
              {globalError}
            </div>
          )}
          {globalSuccess && (
            <div className="rounded-lg bg-success/10 p-4 text-sm text-success border border-success/20">
              {globalSuccess}
            </div>
          )}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              className="w-1/3 py-3 text-base text-error border-error/20 hover:bg-error/5 hover:text-error hover:border-error"
              onClick={async () => {
                if (window.confirm("Are you sure you want to clear your entire profile? This will wipe all the information from the form and save these changes.")) {
                  try {
                    const { data: { user } } = await insforge.auth.getCurrentUser()
                    if (user) {
                      await insforge.storage.from('resumes').remove(`${user.id}/resume.pdf`)
                      await insforge.database.from('profiles').update({ resume_pdf_url: null }).eq('id', user.id)
                    }
                  } catch (e) {
                    console.error("Failed to delete resume", e)
                  }

                  const emptyProfile = {
                    full_name: "",
                    email: "",
                    phone: "",
                    location: "",
                    linkedin_url: "",
                    portfolio_url: "",
                    current_title: "",
                    experience_level: "" as any,
                    years_experience: 0,
                    skills: [],
                    industries: [],
                    work_experience: [],
                    education: [],
                    job_titles_seeking: [],
                    preferred_locations: [],
                    salary_expectation: "",
                    work_authorization: "" as any,
                    remote_preference: "" as any,
                    cover_letter_tone: "" as any,
                  }
                  reset(emptyProfile)
                  await onSubmit(emptyProfile as any)
                }
              }}
            >
              Reset Profile
            </Button>
            <Button type="submit" variant="primary" className="flex-1 py-3 text-base" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : "Save Profile"}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  )
}
