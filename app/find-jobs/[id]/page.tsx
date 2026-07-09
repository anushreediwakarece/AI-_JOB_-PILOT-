"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { insforge } from "@/lib/insforge"
import { usePostHog } from "posthog-js/react"
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  Check,
  X,
  Building2,
  Loader2,
  Sparkles,
  Search,
  FileText,
} from "lucide-react"

function matchPillClass(score: number) {
  // Design shows a green "N% Match Score" pill; keep green for strong matches
  // and fall back to amber for weak ones so the color still means something.
  if (score >= 70) return "bg-success-lightest text-success-foreground"
  return "bg-accent-light text-accent"
}

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const posthog = usePostHog()
  const [job, setJob] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [researching, setResearching] = React.useState(false)
  const [researchError, setResearchError] = React.useState<string | null>(null)

  const handleResearch = async () => {
    if (!job) return
    setResearching(true)
    setResearchError(null)
    try {
      const { data: { user } } = await insforge.auth.getCurrentUser()
      if (!user) throw new Error("You must be signed in to research a company.")

      // Profile powers the candidate-specific parts of the dossier (yourEdge, gaps).
      const { data: profile } = await insforge.database
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      const res = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, profile: profile || {} }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Company research failed.")

      // Persist the dossier (user-scoped) and reflect it immediately.
      const { error: saveError } = await insforge.database
        .from("jobs")
        .update({ company_research: data.dossier })
        .eq("id", job.id)
        .eq("user_id", user.id)
      if (saveError) throw new Error("Research generated but could not be saved.")

      setJob({ ...job, company_research: data.dossier })
      posthog?.capture("company_researched", { jobId: job.id, company: job.company })
    } catch (err: any) {
      setResearchError(err.message)
    } finally {
      setResearching(false)
    }
  }

  React.useEffect(() => {
    async function fetchJob() {
      setLoading(true)
      try {
        const { data: { user } } = await insforge.auth.getCurrentUser()
        if (!user) return

        const { data, error } = await insforge.database
          .from("jobs")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single()

        if (!error && data) {
          setJob(data)
        }
      } catch (err) {
        console.error("Failed to fetch job:", err)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchJob()
  }, [params.id])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)]">
          <Loader2 className="w-10 h-10 animate-spin text-text-muted" />
        </main>
        <Footer />
      </>
    )
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] gap-4">
          <p className="text-text-muted text-lg">Job not found.</p>
          <Button variant="secondary" onClick={() => router.push("/find-jobs")}>
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </Button>
        </main>
        <Footer />
      </>
    )
  }

  const research = job.company_research as any | null
  const matchedSkills: string[] = job.matched_skills || []
  const missingSkills: string[] = job.missing_skills || []

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col w-full min-h-[calc(100vh-140px)] px-6 py-8 max-w-[960px] mx-auto gap-6">

        {/* Back link */}
        <button
          onClick={() => router.push("/find-jobs")}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>

        {/* Job Header */}
        <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-surface-secondary border border-border flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-text-muted" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-text-secondary">{job.company}</span>
                <span className="text-text-muted">•</span>
                <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-semibold ${matchPillClass(job.match_score)}`}>
                  {job.match_score}% Match Score
                </span>
              </div>
            </div>
          </div>
          {job.external_apply_url && (
            <a href={job.external_apply_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              <Button variant="secondary" className="text-sm">
                <ExternalLink className="w-4 h-4" /> View Job Post
              </Button>
            </a>
          )}
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-success-lightest flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-text-primary text-sm truncate">{job.salary || "Not listed"}</p>
              <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Salary Est.</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-info-lightest flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-info-dark" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-text-primary text-sm truncate">{job.location || "—"}</p>
              <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Location</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-text-primary text-sm truncate capitalize">{job.job_type || "—"}</p>
              <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Job Type</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-text-muted" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-text-primary text-sm truncate">{timeAgo(job.found_at)}</p>
              <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Date Found</p>
            </div>
          </Card>
        </div>

        {/* AI Match Reasoning */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-success-lightest flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-success" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">AI Match Reasoning</h2>
          </div>
          <p className="text-text-primary leading-relaxed">
            {job.match_reason || "No match reasoning available for this job yet."}
          </p>
        </Card>

        {/* Required Skills vs Your Profile */}
        <Card>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Required Skills vs Your Profile</h2>

          <div className="mb-5">
            <p className="text-sm text-text-muted mb-2">You have</p>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length > 0 ? (
                matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-success-lightest px-3 py-1 text-sm font-medium text-success-foreground"
                  >
                    <Check className="w-3.5 h-3.5" /> {skill}
                  </span>
                ))
              ) : (
                <p className="text-text-muted text-sm">No matched skills recorded.</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-text-muted mb-2">Gap skills</p>
            <div className="flex flex-wrap gap-2">
              {missingSkills.length > 0 ? (
                missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent"
                  >
                    <X className="w-3.5 h-3.5" /> {skill}
                  </span>
                ))
              ) : (
                <p className="text-text-muted text-sm">No gap skills identified.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Job Description */}
        <Card>
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-text-muted" /> Job Description
          </h2>
          <p className="text-text-secondary leading-relaxed whitespace-pre-line">
            {job.about_role || "No description available."}
          </p>
        </Card>

        {/* Company Research Card */}
        <Card>
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4 mb-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" /> Company Research
            </h2>
            <Button
              variant="primary"
              className="text-sm flex-shrink-0"
              onClick={handleResearch}
              disabled={researching}
            >
              {researching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {researching ? "Researching…" : research ? "Re-research" : "Research Company"}
            </Button>
          </div>

          {researchError && (
            <div className="mb-4 rounded-md bg-error/10 border border-error/20 px-4 py-3 text-sm text-error font-medium">
              {researchError}
            </div>
          )}

          {research ? (
            <div className="flex flex-col gap-5">
              {research.companyOverview && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1">Company Overview</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{research.companyOverview}</p>
                </div>
              )}

              {research.techStack?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {research.techStack.map((tech: string) => (
                      <Badge key={tech} variant="outline">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {research.culture?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Culture &amp; Values</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {research.culture.map((item: string, i: number) => (
                      <li key={i} className="text-text-secondary text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {research.whyThisRole && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1">Why This Role</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{research.whyThisRole}</p>
                </div>
              )}

              {research.yourEdge?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-success" /> Your Edge
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {research.yourEdge.map((item: string, i: number) => (
                      <li key={i} className="text-text-secondary text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {research.gapsToAddress?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Gaps to Address</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {research.gapsToAddress.map((item: string, i: number) => (
                      <li key={i} className="text-text-secondary text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {research.smartQuestions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Smart Questions for Interview</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {research.smartQuestions.map((q: string, i: number) => (
                      <li key={i} className="text-text-secondary text-sm">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {research.interviewPrep?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Interview Prep</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {research.interviewPrep.map((item: string, i: number) => (
                      <li key={i} className="text-text-secondary text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {research.sources?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-muted mb-1">Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {research.sources.map((src: string, i: number) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">{src}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : researching ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
              <p className="font-bold text-text-primary mb-1">Researching {job.company}…</p>
              <p className="text-text-muted text-sm max-w-xs">
                Reading their public pages and building a candidate-specific dossier. This can take a moment.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-text-muted opacity-40" />
              </div>
              <p className="font-bold text-text-primary mb-1">No research yet</p>
              <p className="text-text-muted text-sm max-w-xs">
                Click &ldquo;Research Company&rdquo; to let the AI browse {job.company}&rsquo;s public pages and build a dossier.
              </p>
            </div>
          )}
        </Card>

        {/* Bottom Apply Button */}
        {job.external_apply_url && (
          <a href={job.external_apply_url} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="primary" className="w-full h-12 text-base font-semibold">
              Apply Now at {job.company}
            </Button>
          </a>
        )}

      </main>
      <Footer />
    </>
  )
}
