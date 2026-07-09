# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** 5 - Dashboard (complete)
**Last completed:** 17 Analytics Charts — Real Data
**Next:** — all 17 build-plan features complete 🎉

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [x] 07 AI Profile Extraction from Resume
- [x] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [x] 10 JSearch Job Discovery _(pivoted from Adzuna)_
- [x] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [x] 12 Job Details Page — Full UI
- [x] 13 Company Research Agent

### Phase 5 — Dashboard

- [x] 14 Dashboard Page — Full UI
- [x] 15 Stats Bar — Real Data
- [x] 16 Recent Activity — Real Data
- [x] 17 Analytics Charts — Real Data _(DB-derived; PostHog was unusable — see notes)_

---

## Decisions Made During Build

- **AI provider: Gemini, not OpenAI.** The whole app uses `@google/generative-ai`
  (`gemini-2.5-flash`) via `GEMINI_API_KEY` — scoring, profile extraction, resume polish,
  and company research. `architecture.md`/`library-docs.md` still say GPT-4o (aspirational).
  No `OPENAI_API_KEY` exists.
- **Job discovery: JSearch (RapidAPI), not Adzuna** (feature 10 pivot). `lib/jsearch.ts`
  fetches `num_pages: 2` (~20 jobs); `agent/jsearch.ts` scores up to 20 in one batched
  Gemini call.
- **InsForge: single browser client** (`lib/insforge.ts`, `@insforge/sdk`), with client-side
  DB writes from components. No `@insforge/ssr` server client, despite the docs.
- **Feature 13 = Gemini + server fetch**, not Browserbase/Stagehand (Browserbase keys exist
  but deps aren't installed and Stagehand's zod-3 pin would break the app's zod-4 profile
  validation). Reads the employer site with `fetch` + regex html→text; always returns a
  complete 9-field dossier.
- **Filter thresholds / page size** (feature 11): High/Low match at `>= 70` / `< 70`;
  10 results per page (spec said 20, which never paginated given JSearch volume).
- **Auth resets each browser session** (`components/SessionGate.tsx`): on a fresh browser
  session the app signs out so the user must log in again.
- **Dashboard real data (f15/f16):** stats + recent activity fetch client-side (same pattern
  as `JobsList`; no server client, SDK has no count API). Dropped the "+12% vs last week"
  delta pills — no historical snapshots to diff. "Total Jobs Found" reflects the CURRENT
  search set because each search deletes prior jobs (a true lifetime count needs a schema
  change). Recent Activity merges completed `agent_runs` + jobs with `company_research`.
- **f17 charts = DB-derived, not PostHog.** PostHog was unusable: no MCP, no Personal API
  key (only the public ingest key), `job_found` never captured, `posthog.identify` never
  called. Sources instead: Jobs Found Over Time ← `agent_runs` (persistent, last 7 days);
  Match Score Distribution ← current `jobs.match_score` buckets (50–100%, <50 omitted);
  Company Research Activity ← researched jobs by day (real but session-limited, jobs are
  ephemeral). Pure helpers in `lib/utils/dashboard.ts` (unit-tested); charts auto-scale the
  y-axis via `niceScale`. 7-day window (design's Mon–Sun), not the spec's 30 days.

---

## Notes

- Route protection is `proxy.ts` (Next 16's renamed `middleware.ts`), matching
  `/dashboard`, `/profile`, `/find-jobs`.
- `agent_logs` table is not written to (no server InsForge client; may not exist in the live
  DB) — agent errors go to console + UI instead.
- Backend requires email verification, so the authenticated flow can't be driven with
  throwaway users; agent routes (`/api/agent/find`, `/api/agent/research`) can be tested via
  curl without login.
- Pre-existing repo-wide `@typescript-eslint/no-explicit-any` lint errors (house style). tsc
  is clean and the app runs, but `next build` would fail on them — address before deploy.
- Sample resume for testing lives at `public/sample-resume.pdf`.
- **Dashboard charts are custom self-contained SVG** (`components/dashboard/BarChart.tsx`,
  `AreaChart.tsx`), NOT recharts — avoids a new dep on the Next 16 / React 19 stack. They
  take `{label,value}[]` + color props, so features 15-17 wire real DB/PostHog data straight
  in. Feature 14 uses mock data; the design's 4th stat is "Jobs This Week" (not the
  build-plan's "Cover Letters Generated"). No incomplete-profile banner yet (design shows
  none; add when wiring real profile data in feature 15).
