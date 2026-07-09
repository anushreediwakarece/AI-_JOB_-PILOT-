"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { ProfileBanner } from "./components/ProfileBanner"
import { ResumeSection } from "./components/ResumeSection"
import { ProfileForm } from "./components/ProfileForm"
import { insforge } from "@/lib/insforge"
import { calculateProfileCompletion } from "@/lib/utils/profile-completion"

export default function Profile() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [initialData, setInitialData] = React.useState<any>(null)
  const [currentData, setCurrentData] = React.useState<any>(null)
  const [extractedData, setExtractedData] = React.useState<any>(null)

  React.useEffect(() => {
    async function loadProfile() {
      const { data: { user }, error } = await insforge.auth.getCurrentUser()
      if (error || !user) {
        router.push("/login")
        return
      }

      const { data: profile } = await insforge.database
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        const loadedData = {
          ...profile,
          work_experience: Array.isArray(profile.work_experience) ? profile.work_experience : [],
          education: Array.isArray(profile.education) ? profile.education : [],
          skills: profile.skills || [],
          industries: profile.industries || [],
          job_titles_seeking: profile.job_titles_seeking || [],
          preferred_locations: profile.preferred_locations || []
        }
        setInitialData(loadedData)
        setCurrentData(loadedData)
      }
      setLoading(false)
    }
    loadProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto mb-4"></div>
        <p className="text-text-secondary font-medium">Loading profile...</p>
      </div>
    )
  }

  const { percentage, missingFields, isComplete } = calculateProfileCompletion(currentData || null)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-8 flex flex-col gap-6">
        <ProfileBanner percentage={percentage} missingFields={missingFields} isComplete={isComplete} />
        <ResumeSection resumeUrl={initialData?.resume_pdf_url} onExtractionComplete={setExtractedData} />
        <ProfileForm initialData={initialData} extractedData={extractedData} onValuesChange={setCurrentData} />
      </main>
      <Footer />
    </div>
  )
}
