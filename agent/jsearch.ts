import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai"
import { searchJobs } from "@/lib/jsearch"

const batchScoreSchema: Schema = {
  type: SchemaType.ARRAY,
  description: "Array of scores for the provided jobs, in the exact same order they were provided.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      matchScore: { type: SchemaType.INTEGER, description: "Match score from 0 to 100" },
      matchReason: { type: SchemaType.STRING, description: "One paragraph explanation of the match" },
      matchedSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      missingSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
    required: ["matchScore", "matchReason", "matchedSkills", "missingSkills"]
  }
};

export async function findJobsAndScore(jobTitle: string, location: string, userId: string, profile: any, company?: string) {
  const rawJobs = await searchJobs(jobTitle, location, company);

  if (rawJobs.length === 0) {
    return { success: true, count: 0, jobs: [] };
  }

  // Score up to 20 jobs (two pages) so the results list can paginate without a
  // huge, slow Gemini prompt.
  const jobsToProcess = rawJobs.slice(0, 20);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: batchScoreSchema,
      temperature: 0.2,
    }
  });

  const workHistory = (profile.work_experience || [])
    .map((w: any) => [w.title, w.company].filter(Boolean).join(" at "))
    .filter((s: string) => s.trim())
    .join("; ");
  const education = (profile.education || [])
    .map((e: any) => [e.degree, e.fieldOfStudy].filter(Boolean).join(" in "))
    .filter((s: string) => s.trim())
    .join("; ");

  const profileSummary = `
    Current/Recent Title: ${profile.current_title || "Not specified"}
    Experience Level: ${profile.experience_level || "Not specified"} (${profile.years_experience || 0} years)
    Skills: ${(profile.skills || []).join(", ") || "Not specified"}
    Industries: ${(profile.industries || []).join(", ") || "Not specified"}
    Roles Seeking: ${(profile.job_titles_seeking || []).join(", ") || "Not specified"}
    Work History: ${workHistory || "Not specified"}
    Education: ${education || "Not specified"}
    Preferred Locations: ${(profile.preferred_locations || []).join(", ") || "Any"}
    Remote Preference: ${profile.remote_preference || "Any"}
  `;

  // Prepare a single batched prompt
  const jobsText = jobsToProcess.map((job: any, i: number) => `
    JOB [${i}]:
    Title: ${job.job_title}
    Company: ${job.employer_name}
    Description: ${job.job_description ? job.job_description.substring(0, 400) : "No description"}
  `).join("\n\n");

  let batchScores: any[] = [];
  let quotaScoringFailed = false;
  try {
    const prompt = `
      You are an expert technical recruiter. Score how well the candidate matches each job on a 0-100 scale.

      Scoring rubric (use the FULL range and differentiate jobs from one another):
      - 90-100: Excellent — title, core skills, and seniority align strongly.
      - 70-89: Strong — most key skills present and the right level.
      - 50-69: Moderate — meaningful overlap but notable gaps in skills or seniority.
      - 30-49: Weak — limited overlap in skills or role.
      - 0-29: Poor — different field or major gaps.

      Base each score primarily on skill overlap, then title/role alignment, then seniority fit.
      Do NOT give every job the same score — spread them according to real fit.
      If the profile is sparse, infer reasonably from the current title, roles sought, and work history rather than defaulting everything to a low score.
      For matchedSkills list the candidate skills the job needs; for missingSkills list job requirements the candidate lacks.

      Return a JSON array of exactly ${jobsToProcess.length} objects, in the same order as the jobs provided.

      CANDIDATE PROFILE:
      ${profileSummary}

      JOBS:
      ${jobsText}
    `;

    // Retry transient errors (429 rate limit / 503 overloaded) with backoff so a
    // momentary hiccup doesn't zero out every job's score.
    let result;
    let retries = 3;
    let delay = 2000;
    while (retries > 0) {
      try {
        result = await model.generateContent(prompt);
        break;
      } catch (e: any) {
        const transient = e?.status === 429 || e?.status === 503 ||
          e?.message?.includes("429") || e?.message?.includes("503");
        retries--;
        if (!transient || retries === 0) throw e;
        console.warn(`Gemini scoring transient error (status ${e?.status}). Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      }
    }

    const rawText = result!.response.text();
    batchScores = JSON.parse(rawText);
    console.log("Parsed batchScores:", JSON.stringify(batchScores).substring(0, 200));
  } catch (err: any) {
    // Daily-quota exhaustion (free tier = 20 req/day) surfaces here as a 429.
    const isQuota = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota");
    quotaScoringFailed = isQuota;
    console.error(`Batched Gemini scoring failed${isQuota ? " (API quota exceeded)" : ""}:`, err?.message || err);
  }

  // If scoring produced nothing, DON'T persist a page of misleading 0% jobs —
  // surface a clear error so the user retries instead of seeing "every job 0%".
  if (batchScores.length === 0) {
    throw new Error(
      quotaScoringFailed
        ? "AI match scoring is rate-limited right now (Gemini daily quota). Please try again in a little while."
        : "AI match scoring failed. Please try your search again."
    );
  }

  const scoredJobs = jobsToProcess.map((job: any, i: number) => {
    const scoreData = batchScores[i] || {
      matchScore: 0,
      matchReason: "AI scoring skipped or failed. Awaiting manual review.",
      matchedSkills: [],
      missingSkills: [],
    };

    const minSal = job.job_min_salary;
    const maxSal = job.job_max_salary;
    // JSearch omits salary for most listings; prefer its own formatted string,
    // then a computed range, and only fall back to "Not listed" when truly absent.
    let salaryString = job.job_salary_string || "Not listed";
    if (minSal && maxSal) {
      salaryString = `$${Math.round(minSal / 1000)}k - $${Math.round(maxSal / 1000)}k`;
    } else if (minSal) {
      salaryString = `$${Math.round(minSal / 1000)}k+`;
    } else if (maxSal) {
      salaryString = `Up to $${Math.round(maxSal / 1000)}k`;
    }

    return {
      user_id: userId,
      run_id: null,
      source: "search",
      source_url: job.job_apply_link,
      external_apply_url: job.job_apply_link,
      title: job.job_title,
      company: job.employer_name,
      location: [job.job_city, job.job_country].filter(Boolean).join(", "),
      salary: salaryString,
      job_type: job.job_employment_type || "fulltime",
      about_role: job.job_description ? (job.job_description.substring(0, 300) + "...") : "No description provided.",
      match_score: scoreData.matchScore || 0,
      match_reason: scoreData.matchReason,
      matched_skills: scoreData.matchedSkills || [],
      missing_skills: scoreData.missingSkills || [],
      found_at: new Date().toISOString(),
    };
  });

  return { success: true, count: scoredJobs.length, jobs: scoredJobs };
}
