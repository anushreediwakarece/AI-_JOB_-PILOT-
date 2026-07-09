import { NextRequest, NextResponse } from "next/server"
import { researchCompany } from "@/agent/research"

export async function POST(req: NextRequest) {
  try {
    const { job, profile } = await req.json()

    if (!job || !job.company) {
      return NextResponse.json({ error: "A job with a company is required." }, { status: 400 })
    }

    let result
    try {
      result = await researchCompany(job, profile || {})
    } catch (agentError: any) {
      console.error("Research agent failed:", agentError)
      const msg: string = agentError?.message || ""
      // Pass through the clear, user-facing messages the agent throws.
      const userError =
        /quota|rate-limited|research/i.test(msg)
          ? msg
          : "Company research failed. Please try again later."
      return NextResponse.json({ error: userError }, { status: 502 })
    }

    return NextResponse.json({ success: true, dossier: result.dossier })
  } catch (error: any) {
    console.error("Unexpected error in /api/agent/research:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
