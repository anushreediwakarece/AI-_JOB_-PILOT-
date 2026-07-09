import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai"

// The dossier shape the Job Details page already renders (9 fields).
const dossierSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    companyOverview: { type: SchemaType.STRING, description: "What the company does, grounded in the research" },
    techStack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Technologies the company uses" },
    culture: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Values and working style" },
    whyThisRole: { type: SchemaType.STRING, description: "Why this role exists / what it's about" },
    yourEdge: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Specific links between THIS candidate and this role" },
    gapsToAddress: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Missing skills reframed as strategy" },
    smartQuestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Questions that show real research" },
    interviewPrep: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Topics to prepare for this role" },
    sources: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Pages the company info came from" },
  },
  required: [
    "companyOverview", "techStack", "culture", "whyThisRole",
    "yourEdge", "gapsToAddress", "smartQuestions", "interviewPrep", "sources",
  ],
}

export type CompanyDossier = {
  companyOverview: string
  techStack: string[]
  culture: string[]
  whyThisRole: string
  yourEdge: string[]
  gapsToAddress: string[]
  smartQuestions: string[]
  interviewPrep: string[]
  sources: string[]
}

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

// Hosts that are job boards / applicant tracking systems — NOT the employer's own site.
const AGGREGATOR_RE =
  /(indeed|linkedin|glassdoor|ziprecruiter|google|jsearch|rapidapi|adzuna|lever\.co|greenhouse|workday|myworkdayjobs|smartrecruiters|jobvite|bamboohr|ashbyhq|monster|dice|simplyhired|wellfound|angel\.co)/i

const SUBPAGE_RE = /\/(about|about-us|company|careers|jobs|culture|blog|engineering|team|mission|values)(\/|$|\?|#)/i

function cleanCompanyName(name: string): string {
  return (name || "")
    .replace(/\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Corporation|Co\.?|GmbH|Group|Technologies|Labs)\.?\s*$/i, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
}

// Naive registrable-domain: last two labels (good enough for .com/.io/.ai etc.).
function rootDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, "").split(".")
  if (parts.length <= 2) return parts.join(".")
  return parts.slice(-2).join(".")
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

async function fetchHtml(url: string, timeoutMs = 8000): Promise<{ finalUrl: string; html: string } | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": DESKTOP_UA, Accept: "text/html" },
    })
    if (!res.ok) return null
    const ct = res.headers.get("content-type") || ""
    if (!ct.includes("html")) return null
    const html = await res.text()
    return { finalUrl: res.url, html }
  } catch {
    return null
  }
}

// Decide the employer's real homepage: follow the apply link to its final host,
// but if that lands on a job board / ATS (or fails), construct from the company name.
async function resolveHomepageUrl(job: any): Promise<string> {
  const fallback = `https://www.${cleanCompanyName(job.company) || "example"}.com`
  const applyUrl: string | undefined = job.external_apply_url || job.source_url
  if (!applyUrl) return fallback
  try {
    const res = await fetch(applyUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": DESKTOP_UA },
    })
    const host = new URL(res.url).hostname
    if (AGGREGATOR_RE.test(host)) return fallback
    return `https://${rootDomain(host)}`
  } catch {
    return fallback
  }
}

function pickSubPages(html: string, homepageUrl: string): string[] {
  const origin = new URL(homepageUrl).origin
  const found = new Set<string>()
  const re = /href\s*=\s*["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) && found.size < 8) {
    try {
      const abs = new URL(m[1], homepageUrl)
      if (abs.origin !== origin) continue
      if (!SUBPAGE_RE.test(abs.pathname)) continue
      abs.hash = ""
      found.add(abs.toString())
    } catch {
      // ignore malformed hrefs
    }
  }
  return Array.from(found).slice(0, 2)
}

// Reads the employer site (best-effort — never throws). Returns collected text + sources.
async function gatherSiteResearch(job: any): Promise<{ text: string; sources: string[] }> {
  const homepageUrl = await resolveHomepageUrl(job)
  const home = await fetchHtml(homepageUrl)
  if (!home) return { text: "", sources: [] }

  const sources: string[] = [home.finalUrl]
  const chunks: string[] = [`HOMEPAGE (${home.finalUrl}):\n${htmlToText(home.html).slice(0, 8000)}`]

  for (const subUrl of pickSubPages(home.html, home.finalUrl)) {
    const sub = await fetchHtml(subUrl)
    if (!sub) continue
    const text = htmlToText(sub.html).slice(0, 4000)
    if (text.length < 120) continue
    sources.push(sub.finalUrl)
    chunks.push(`PAGE (${sub.finalUrl}):\n${text}`)
  }

  return { text: chunks.join("\n\n"), sources }
}

export async function researchCompany(job: any, profile: any): Promise<{ dossier: CompanyDossier }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY environment variable")

  const { text: siteText, sources } = await gatherSiteResearch(job)

  const workHistory = (profile?.work_experience || [])
    .map((w: any) => [w.title, w.company].filter(Boolean).join(" at "))
    .filter((s: string) => s.trim())
    .join("; ")

  const systemInstruction = `You are a sharp career strategist preparing a candidate to apply for a specific role.
You are given (a) research collected from the company's own website (may be empty), (b) the job posting, and (c) the candidate's profile.
Produce a concise, concrete briefing that gives THIS specific candidate an edge for THIS specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.
- yourEdge, gapsToAddress, and smartQuestions are the most valuable fields — never leave them empty.`

  const prompt = `COMPANY RESEARCH (from their website, may be empty):
${siteText || "(No company website content could be read — infer carefully from the job posting and profile, and say so.)"}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${(job.about_role || "").slice(0, 2000)}
Matched skills (already computed): ${(job.matched_skills || []).join(", ") || "none"}
Missing skills (already computed): ${(job.missing_skills || []).join(", ") || "none"}

CANDIDATE PROFILE:
Current title: ${profile?.current_title || "Not specified"}
Experience: ${profile?.years_experience || 0} years, level ${profile?.experience_level || "Not specified"}
Skills: ${(profile?.skills || []).join(", ") || "Not specified"}
Work history: ${workHistory || "Not specified"}

For the "sources" field, list exactly these URLs that were read: ${sources.length ? sources.join(", ") : "none — no external site was read"}.`

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: dossierSchema,
      temperature: 0.4,
    },
  })

  // Retry transient errors (429 rate limit / 503 overloaded) with backoff.
  let result
  let retries = 3
  let delay = 2000
  while (retries > 0) {
    try {
      result = await model.generateContent(prompt)
      break
    } catch (e: any) {
      const transient =
        e?.status === 429 || e?.status === 503 ||
        e?.message?.includes("429") || e?.message?.includes("503")
      retries--
      if (!transient || retries === 0) {
        const isQuota = e?.status === 429 || /429|quota/i.test(e?.message || "")
        throw new Error(
          isQuota
            ? "Company research is rate-limited right now (Gemini daily quota). Please try again in a little while."
            : "Company research failed to generate. Please try again."
        )
      }
      console.warn(`Gemini research transient error (status ${e?.status}). Retrying in ${delay}ms...`)
      await new Promise((r) => setTimeout(r, delay))
      delay *= 2
    }
  }

  let dossier: CompanyDossier
  try {
    dossier = JSON.parse(result!.response.text())
  } catch {
    throw new Error("Company research returned an unreadable response. Please try again.")
  }

  // Guarantee a complete dossier shape + honest sources.
  return {
    dossier: {
      companyOverview: dossier.companyOverview || "",
      techStack: dossier.techStack || [],
      culture: dossier.culture || [],
      whyThisRole: dossier.whyThisRole || "",
      yourEdge: dossier.yourEdge || [],
      gapsToAddress: dossier.gapsToAddress || [],
      smartQuestions: dossier.smartQuestions || [],
      interviewPrep: dossier.interviewPrep || [],
      sources: sources.length ? sources : (dossier.sources || []),
    },
  }
}
