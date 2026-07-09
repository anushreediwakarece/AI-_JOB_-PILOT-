"use client"

import * as React from "react"
import { Search, Building2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { insforge } from "@/lib/insforge"

function getScoreColorClass(score: number) {
  if (score >= 90) return 'bg-success'
  if (score >= 80) return 'bg-info-medium'
  return 'bg-warning'
}

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}

export function JobsList({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [jobs, setJobs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterMatch, setFilterMatch] = React.useState("all")
  const [sortType, setSortType] = React.useState("newest")

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1)
  const JOBS_PER_PAGE = 10

  React.useEffect(() => {
    async function fetchJobs() {
      setLoading(true)
      try {
        const { data: { user } } = await insforge.auth.getCurrentUser()
        if (!user) return

        const { data } = await insforge.database
          .from("jobs")
          .select("*")
          .eq("user_id", user.id)
          .order("found_at", { ascending: false })
          
        setJobs(data || [])
      } catch (err) {
        console.error("Failed to fetch jobs:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchJobs()
  }, [refreshTrigger])

  // Reset to page 1 when filters change or a new search loads fresh results.
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterMatch, sortType, refreshTrigger])

  // Apply filters and sorting
  let processedJobs = [...jobs]

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    processedJobs = processedJobs.filter(j =>
      j.company?.toLowerCase().includes(q) ||
      j.title?.toLowerCase().includes(q)
    )
  }

  if (filterMatch === "high") {
    processedJobs = processedJobs.filter(j => j.match_score >= 70)
  } else if (filterMatch === "low") {
    processedJobs = processedJobs.filter(j => j.match_score < 70)
  }

  if (sortType === "score") {
    processedJobs.sort((a, b) => b.match_score - a.match_score)
  } else if (sortType === "oldest") {
    processedJobs.sort((a, b) => new Date(a.found_at).getTime() - new Date(b.found_at).getTime())
  } else {
    // newest
    processedJobs.sort((a, b) => new Date(b.found_at).getTime() - new Date(a.found_at).getTime())
  }

  // Pagination calculations. Clamp to a valid page so that if the result set
  // shrinks (new search, filter change) we never render an empty page past the end.
  const totalJobs = processedJobs.length
  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE) || 1
  const safePage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (safePage - 1) * JOBS_PER_PAGE
  const currentJobs = processedJobs.slice(startIndex, startIndex + JOBS_PER_PAGE)

  return (
    <div className="w-full bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Filter Bar */}
      <div className="p-4 md:p-6 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-text-muted" />
          </div>
          <Input 
            className="pl-10 text-sm" 
            placeholder="Filter by company or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex w-full md:w-auto gap-4 items-center">
          <Select
            className="w-full md:w-40 text-sm h-10"
            value={filterMatch}
            onChange={(e) => setFilterMatch(e.target.value)}
          >
            <option value="all">All Matches</option>
            <option value="high">High Match (70+)</option>
            <option value="low">Low Match</option>
          </Select>
          <Select
            className="w-full md:w-48 text-sm h-10"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option value="newest">Sort by Newest</option>
            <option value="oldest">Sort by Oldest</option>
            <option value="score">Sort by Match Score</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[300px]">
        {loading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
          </div>
        ) : currentJobs.length === 0 ? (
          <div className="w-full h-[300px] flex flex-col items-center justify-center text-text-muted">
            <Search className="w-10 h-10 mb-4 opacity-20" />
            <p>No jobs found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-text-secondary tracking-wider uppercase">
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Match Score</th>
                <th className="px-6 py-4 font-semibold">Salary Est.</th>
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold">Date Found</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentJobs.map((job) => (
                <tr key={job.id} className="hover:bg-surface-secondary transition-colors group cursor-pointer" onClick={() => window.location.href = `/find-jobs/${job.id}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-surface border border-border flex items-center justify-center flex-shrink-0 text-text-muted group-hover:border-border-light transition-colors">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-text-primary">{job.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-text-dark font-medium">{job.title}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 w-48">
                      <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getScoreColorClass(job.match_score)}`}
                          style={{ width: `${Math.max(0, Math.min(100, job.match_score))}%` }}
                        />
                      </div>
                      <span className="font-semibold text-text-primary w-10 text-right">{job.match_score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-text-secondary text-sm">
                    {job.salary || "Not listed"}
                  </td>
                  <td className="px-6 py-5">
                    {job.external_apply_url ? (
                      <a 
                        href={job.external_apply_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-accent-light text-accent hover:opacity-80 capitalize transition-opacity"
                      >
                        {job.source || "Search"}
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-accent-light text-accent capitalize">
                        {job.source || "Search"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-text-secondary text-sm whitespace-nowrap">
                    {timeAgo(job.found_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalJobs > 0 && (
        <div className="p-4 md:p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-text-secondary">
            Showing <span className="font-semibold text-text-primary">{startIndex + 1}</span> to <span className="font-semibold text-text-primary">{Math.min(startIndex + JOBS_PER_PAGE, totalJobs)}</span> of <span className="font-semibold text-text-primary">{totalJobs}</span> results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="h-9 px-3 text-sm"
              disabled={safePage === 1}
              onClick={() => setCurrentPage(safePage - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium px-3">{safePage} / {totalPages}</span>
            </div>
            <Button
              variant="secondary"
              className="h-9 px-3 text-sm"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
