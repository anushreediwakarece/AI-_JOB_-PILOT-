import { NextRequest, NextResponse } from "next/server"
import { findJobsAndScore } from "@/agent/jsearch"

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, location, company, userId, profile } = await req.json()

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title is required." }, { status: 400 })
    }

    if (!userId || !profile) {
      return NextResponse.json({ error: "Unauthorized or missing profile." }, { status: 401 })
    }

    // Run Job Discovery Agent
    let result;
    try {
      result = await findJobsAndScore(jobTitle, location, userId, profile, company);
    } catch (agentError: any) {
      console.error("Agent execution failed:", agentError);

      const msg: string = agentError?.message || "";
      // Pass through the clear, user-facing messages the agent throws (quota,
      // scoring failure); only show the generic provider error for raw API faults.
      let userError =
        "Failed to connect to the job search provider. Please check your API keys or try again later.";
      if (/quota|rate-limited|match scoring/i.test(msg)) {
        userError = msg;
      } else if (/JSearch|RapidAPI/i.test(msg)) {
        userError = "Couldn't reach the job search provider (JSearch). Please try again later.";
      }

      return NextResponse.json({ error: userError, details: msg }, { status: 502 });
    }

    return NextResponse.json({ success: true, count: result.count, jobs: result.jobs })

  } catch (error: any) {
    console.error("Unexpected error in /api/agent/find:", error)
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
