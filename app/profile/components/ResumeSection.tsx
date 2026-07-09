"use client"

import * as React from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { CloudUpload, FileText, Loader2, Check } from "lucide-react"
import { extractProfileFromResume } from "@/app/actions/ai"
import { generateResumePdf } from "@/app/actions/resume"
import { insforge } from "@/lib/insforge"

const RESUME_BUCKET = "resumes"
// Fresh signed URL generated on every view, so a short TTL is plenty.
const VIEW_URL_TTL = 60 * 60 // 1 hour

// Always use a signed URL to view the resume. Per the InsForge SDK, createSignedUrl
// works for BOTH private buckets (time-limited URL) and public buckets (long-lived
// URL), so it is the single correct way to produce a viewable link. We never fall
// back to getPublicUrl — on a private bucket that produces a guaranteed 404.
async function createResumeSignedUrl(key: string): Promise<string> {
  const { data, error } = await insforge.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(key, VIEW_URL_TTL)
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not generate a link to view the resume.")
  }
  return data.signedUrl
}

export function ResumeSection({ resumeUrl, onExtractionComplete }: { resumeUrl?: string, onExtractionComplete?: (data: any) => void }) {
  const [isExtracting, setIsExtracting] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isOpening, setIsOpening] = React.useState(false)
  const [hasResume, setHasResume] = React.useState(!!resumeUrl)
  // The stored storage key for the resume (e.g. "<userId>/resume.pdf"). We store the
  // KEY in the DB rather than a signed URL, since signed URLs expire (7-day max) and
  // would become dead links. Legacy rows may contain a full URL — handled in handleView.
  const [resumeKey, setResumeKey] = React.useState(resumeUrl || "")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setHasResume(!!resumeUrl)
    setResumeKey(resumeUrl || "")
  }, [resumeUrl])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf" || file.size > 5 * 1024 * 1024) {
      alert("Please upload a PDF file under 5MB.")
      return
    }

    setIsUploading(true)
    try {
      const { data: { user } } = await insforge.auth.getCurrentUser()
      if (!user) throw new Error("Not authenticated")

      const filePath = `${user.id}/resume.pdf`

      const { data: uploadData, error: uploadError } = await insforge
        .storage
        .from(RESUME_BUCKET)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Use the canonical key the backend actually stored the object under.
      const storageKey = (uploadData?.key as string) || filePath

      // Persist the stable KEY (not a signed URL) so the link never expires.
      await insforge.database.from('profiles').update({ resume_pdf_url: storageKey }).eq('id', user.id)
      setResumeKey(storageKey)
      setHasResume(true)

      setIsExtracting(true)
      const formData = new FormData()
      formData.append("file", file)
      const extractResult = await extractProfileFromResume(formData)
      setIsExtracting(false)

      if (extractResult.success && onExtractionComplete) {
        onExtractionComplete(extractResult.data)
      } else if (!extractResult.success) {
        console.error("Extraction error:", extractResult.error)
        alert(extractResult.error || "Failed to extract text from resume.")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      alert("Failed to upload resume: " + (error?.message || "Please try again."))
    } finally {
      setIsUploading(false)
      setIsExtracting(false)
    }
  }

  const handleView = async () => {
    setIsOpening(true)
    try {
      let key = resumeKey
      // Fallback for legacy rows that stored a full (expired) signed URL, or if the
      // key is missing: uploads always go to "<userId>/resume.pdf", so re-derive it.
      if (!key || key.includes("://")) {
        const { data: { user } } = await insforge.auth.getCurrentUser()
        if (!user) throw new Error("Not authenticated")
        key = `${user.id}/resume.pdf`
      }
      const url = await createResumeSignedUrl(key)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error: any) {
      console.error("View error:", error)
      alert(error?.message || "Could not open resume.")
    } finally {
      setIsOpening(false)
    }
  }

  const handleGenerateResume = async () => {
    setIsGenerating(true)
    try {
      // 1. Authenticate user
      const { data: { user }, error: authError } = await insforge.auth.getCurrentUser()
      if (authError || !user) {
        throw new Error("Unauthorized. Please log in again.")
      }

      // 2. Fetch profile data
      const { data: profile, error: profileError } = await insforge.database
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error("Profile not found")
      }

      // 3. Generate PDF base64 via Server Action
      const result = await generateResumePdf(profile)

      if (!result.success || !result.base64Pdf) {
        throw new Error(result.error || 'Failed to generate resume')
      }

      // 4. Convert base64 to File
      const byteCharacters = atob(result.base64Pdf)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const pdfFile = new File([byteArray], "resume.pdf", { type: "application/pdf" })

      // 5. Upload to Storage
      const filePath = `${user.id}/resume.pdf`
      const { data: uploadData, error: uploadError } = await insforge
        .storage
        .from(RESUME_BUCKET)
        .upload(filePath, pdfFile)

      if (uploadError) throw uploadError
      const storageKey = (uploadData?.key as string) || filePath

      // 6. Save the stable KEY to profile DB
      await insforge.database.from('profiles').update({ resume_pdf_url: storageKey }).eq('id', user.id)
      setResumeKey(storageKey)
      setHasResume(true)

      // 7. Auto-download the PDF
      const blobUrl = URL.createObjectURL(pdfFile)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = "Polished_Resume.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)

      alert("Resume generated and downloaded successfully!")
    } catch (error: any) {
      console.error("Generate error:", error)
      alert(error.message || "An error occurred while generating the resume.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-text-primary">Resume</h2>
        <p className="text-sm font-medium text-text-secondary">
          Upload an existing resume to auto-fill the profile, or generate a new tailored one from your details below.
        </p>
      </div>

      <div className="border border-dashed border-border-muted rounded-xl p-8 flex flex-col items-center justify-center bg-surface-secondary/50 text-center gap-4 relative">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleUpload}
        />

        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasResume ? 'bg-success/20 text-success' : 'bg-accent-light text-accent'}`}>
          {(isUploading || isExtracting || isGenerating) ? <Loader2 className="w-5 h-5 animate-spin" /> : (hasResume ? <Check className="w-5 h-5" /> : <CloudUpload className="w-5 h-5" />)}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary mb-1">
            {isUploading ? "Uploading..." : isExtracting ? "Extracting profile data..." : isGenerating ? "Generating polished resume..." : (hasResume ? "Resume ready" : "Click to upload or drag and drop")}
          </p>
          {hasResume ? (
            <button
              type="button"
              onClick={handleView}
              disabled={isOpening}
              className="text-sm font-medium text-accent hover:underline cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {isOpening && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isOpening ? "Opening..." : "Click to view resume"}
            </button>
          ) : (
            <p className="text-xs font-normal text-text-muted">PDF formatting only. Maximum file size 5MB.</p>
          )}
        </div>
        <Button
          variant="secondary"
          className="mt-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isExtracting || isGenerating}
        >
          {hasResume ? "Replace Resume" : "Select Resume"}
        </Button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <p className="text-sm font-medium text-text-secondary">Need a fresh document based on the fields below?</p>
        <Button
          variant="primary"
          onClick={handleGenerateResume}
          disabled={isGenerating || isUploading || isExtracting}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-1.5" />
          )}
          {isGenerating ? "Generating..." : "Generate Resume from Profile"}
        </Button>
      </div>
    </Card>
  )
}
