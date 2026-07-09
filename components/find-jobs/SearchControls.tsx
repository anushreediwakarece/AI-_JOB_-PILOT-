"use client"

import * as React from "react"
import { Search, Sparkles, Loader2, AlertCircle, Building2 } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

import { insforge } from "@/lib/insforge"

export function SearchControls({ onSearchComplete }: { onSearchComplete?: () => void }) {
  const [jobTitle, setJobTitle] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successCount, setSuccessCount] = React.useState<number | null>(null)

  const handleSearch = async () => {
    if (!jobTitle) return;
    
    setLoading(true)
    setError(null)
    setSuccessCount(null)

    try {
      // 1. Get authenticated user
      const { data: { user }, error: authError } = await insforge.auth.getCurrentUser()
      if (authError || !user) {
        throw new Error("You must be logged in to search for jobs.")
      }

      // 2. Get profile
      const { data: profile, error: profileError } = await insforge.database
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (profileError || !profile) {
        throw new Error("Please complete your profile before searching.")
      }

      // Match scores are only meaningful if there's something to match against.
      // With an empty profile Gemini (correctly) scores every job low, which reads
      // as a broken feature — so block the search and point the user to the profile.
      const hasProfileSignal =
        (profile.skills?.length || 0) > 0 ||
        !!profile.current_title ||
        (profile.work_experience?.length || 0) > 0 ||
        (profile.job_titles_seeking?.length || 0) > 0
      if (!hasProfileSignal) {
        throw new Error(
          "Your profile is too empty for accurate match scores. Add your job title, skills, and experience on the Profile page (or upload a resume and use Extract) first."
        )
      }

      // 3. Create run record
      const { data: run, error: runError } = await insforge.database
        .from("agent_runs")
        .insert({
          user_id: user.id,
          status: "running",
          job_title_searched: jobTitle,
          location_searched: location || "",
          started_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (runError) throw new Error("Failed to initialize search.")

      // 4. Call API
      const res = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, location, userId: user.id, profile }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        await insforge.database.from("agent_runs").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", run.id)
        throw new Error(data.error || data.details || "Failed to search jobs")
      }

      // 5. Save jobs to DB
      if (data.jobs && data.jobs.length > 0) {
        // Replace previous search results so stale, unscored (0%) rows don't linger.
        await insforge.database.from("jobs").delete().eq("user_id", user.id)

        const jobsToInsert = data.jobs.map((job: any) => ({ ...job, run_id: run.id }))
        const { error: insertError } = await insforge.database.from("jobs").insert(jobsToInsert)
        if (insertError) throw new Error("Failed to save discovered jobs.")
      }

      // 6. Complete run
      await insforge.database.from("agent_runs").update({ status: "completed", jobs_found: data.count, completed_at: new Date().toISOString() }).eq("id", run.id)

      setSuccessCount(data.count)
      if (onSearchComplete) onSearchComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Job Title Input */}
        <div className="flex-1 w-full">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-muted" />
            </div>
            <Input 
              className="pl-10 h-11 text-base" 
              placeholder="Job Title or Role (e.g. Backend Developer)" 
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Company Input */}
        <div className="flex-1 w-full">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 className="h-5 w-5 text-text-muted" />
            </div>
            <Input
              className="pl-10 h-11 text-base"
              placeholder="Company (optional, e.g. Google)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Location Input */}
        <div className="flex-1 w-full">
          <div className="relative w-full">
            <Input
              className="h-11 text-base"
              placeholder="Location (e.g. US, Remote)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Find Jobs Button */}
        <div className="w-full md:w-auto mt-4 md:mt-0">
          <Button 
            variant="primary" 
            className="h-11 w-full md:w-auto px-6 whitespace-nowrap text-base"
            onClick={handleSearch}
            disabled={loading || !jobTitle}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {loading ? "Discovering..." : "Find Jobs"}
          </Button>
        </div>
      </div>

      {/* Status Banners */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-md px-4 py-3 flex items-center gap-2 text-error">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {successCount !== null && (
        <div className="bg-success-lightest border border-success-light rounded-md px-4 py-3 flex items-center gap-2 text-success-dark">
          <Sparkles className="h-5 w-5 text-success-alt" />
          <span className="font-medium text-sm">Discovered and scored {successCount} new jobs based on your profile!</span>
        </div>
      )}
    </div>
  )
}
