# Memory — JobPilot AI Job Finder (Profile · Find Jobs · Job Details · Dashboard)

Last updated: 2026-07-09

> Backend is **InsForge** (BaaS via `@insforge/sdk`), NOT Supabase. Earlier memory
> mislabeled it as Supabase — that was wrong. AI uses **Google Gemini**
> (`@google/generative-ai`, model `gemini-2.5-flash`) via `GEMINI_API_KEY` in
> `.env.local` ([REDACTED]). Live jobs come from RapidAPI **JSearch** (`RAPIDAPI_KEY`, [REDACTED]).

---

## What was built (earlier sessions)

- **AI Profile Extraction** — upload a PDF resume → `extractProfileFromResume`
  server action (`app/actions/ai.ts`) sends the raw PDF to Gemini and returns
  structured profile JSON, which auto-fills the profile form.
- **Resume PDF generation** — `generateResumePdf` (`app/actions/resume.ts`) polishes
  profile data with Gemini and renders a PDF via `@react-pdf/renderer`
  (`components/resume/ResumeTemplate`).
- **Resume storage** — upload/view via InsForge Storage bucket `resumes` (private).
- **Find Jobs** — `SearchControls` + `JobsList` (`components/find-jobs/`) fetch live
  jobs through `app/api/agent/find/route.ts` → `agent/jsearch.ts` (`findJobsAndScore`)
  → `lib/jsearch.ts` (`searchJobs`), then Gemini scores each job vs. the profile.
- Profile completion banner driven by `lib/utils/profile-completion.ts`; form uses
  react-hook-form + zod (`lib/validations/profile.ts`).

## What was done THIS session (all fixes verified: tsc clean, dev server healthy)

1. **Resume PDF "view" fix** (`app/profile/components/ResumeSection.tsx`) — root cause:
   original code requested a 1-YEAR signed URL but the InsForge SDK caps `expiresIn`
   at 7 days (604800s) → rejected; then it fell back to `getPublicUrl` on a PRIVATE
   bucket → guaranteed 404, and stored that dead URL in the DB. Now: store the stable
   object KEY (`<userId>/resume.pdf`) in `resume_pdf_url`, and generate a FRESH 1-hour
   signed URL on click (`createSignedUrl`, which works for both private+public buckets).
   Removed `getPublicUrl` fallback and the dead `{ upsert:true }` arg. Legacy full-URL
   rows are handled by re-deriving the key from the user id.

2. **Profile save was silently failing** (`lib/validations/profile.ts` + `ProfileForm.tsx`)
   — the zod schema was too strict: `linkedin_url`/`portfolio_url` required a full URL
   (AI/users enter bare domains) and work_experience/education subfields were required,
   so partial/AI-filled data blocked the save. `onInvalid` logged an empty `{}` (nested
   array errors don't render). Relaxed URL + nested fields to optional; `onInvalid` now
   lists the exact failing field paths.

3. **Redirect to Find Jobs** — on Save, if profile is complete, redirect to `/find-jobs`
   (else reload). Reset still just reloads.

4. **Live company search** — added a Company field to `SearchControls`, threaded through
   route → `findJobsAndScore` → `searchJobs`, building JSearch query
   `"<title> at <company> in <location>"`.

5. **Gemini quota was the real AI blocker** — the old key was free-tier **20 req/day**
   and exhausted (verified 429 FreeTier/PerDay). User supplied a new working key
   ([REDACTED], swapped into `.env.local`). Added 429/503 retry-with-backoff to
   `ai.ts`, `resume.ts`, and `agent/jsearch.ts`, plus clear "quota exceeded" messaging.

6. **Empty-profile resume guard** (`resume.ts`) — refuses to generate (clear message)
   when profile has no title/skills/work experience, instead of an empty "no data" PDF.

7. **Match scores were uniform (0% then 5%)** — old rows were stale (scored during
   quota outage); and the scoring prompt sent only 4 thin profile fields with no rubric.
   Fixed in `agent/jsearch.ts`: send a RICH profile (title, skills, industries, roles
   sought, work history, education, locations, remote pref) + explicit 0–100 rubric that
   forces score spread. Verified live: varied scores (e.g. 95/45/75/5/10).
   `SearchControls` now DELETEs the user's previous jobs before inserting a new search,
   so stale rows don't linger.

8. **Pagination "Next" was permanently disabled** — backend fetched only 1 page (~10
   jobs) and capped scoring at 10, so there was never a 2nd page. Now `lib/jsearch.ts`
   fetches `num_pages: 3` (verified ~26 jobs) and `agent/jsearch.ts` scores up to 30 →
   multiple pages → Next/Previous work.

9. Also fixed two pre-existing bugs in `ProfileForm.tsx` Reset: invalid Button
   `variant="outline"` → `secondary`; and `storage.remove([array])` → `remove(string)`
   (SDK takes a string, so resume deletion on reset was broken).

## Latest session (2026-07-09) — feature 11, perf/pagination, feature 12

- **Feature 11 (Filter + Sort + Pagination)** brought in line with `context/build-plan.md`
  §11 in `components/find-jobs/JobsList.tsx`: High/Low match threshold corrected to
  `>= 70` / `< 70` (was 80); the single "Filter by company or role" box now matches
  company OR title (removed the redundant second company-only input); sort
  score/newest/oldest unchanged.
- **Discovery speed fix** — the discover flow was slow because both network calls were
  sized for max volume. `lib/jsearch.ts` `num_pages` 3 → 2 (JSearch aggregates upstream
  SERP pages server-side, so page count is the dominant latency), and `agent/jsearch.ts`
  now scores up to 20 jobs (was 30) with 400-char (was 600) descriptions → smaller/faster
  Gemini prompt.
- **Pagination correctness fixes** (`JobsList.tsx`): (1) `refreshTrigger` added to the
  page-reset effect so a new search snaps back to page 1 instead of stranding you on a
  now-empty page 2; (2) `safePage = clamp(currentPage, 1..totalPages)` drives slicing,
  the "X to Y of N" label, and Prev/Next so an empty page past the end is impossible;
  (3) page size 20 → **10** so the ~20-result set actually paginates (spec says 20, but
  that never splits into pages given JSearch volume; deviation is intentional).
- **Feature 12 (Job Details Page — Full UI)** rebuilt to match
  `context/designs/job-details.png` exactly in `app/find-jobs/[id]/page.tsx`: header pill
  "N% Match Score" inline after company (green) + outline "View Job Post"; horizontal
  colored-icon info tiles (Salary/Location/Job Type/Date Found); removed the extra
  standalone match-score progress-bar card; "AI MATCH REASONING" small-label card with
  green sparkle icon; single "REQUIRED SKILLS VS YOUR PROFILE" card with green ✓ "You have"
  pills and purple × "Gap skills" pills; "Job Description" card; "Company Research" card
  with the enabled purple "Research Company" button in the header + "No research yet"
  empty state; full-width "Apply Now at {company}" button. Research button is UI-only
  (its agent is feature 13). Data still wired to the `jobs` row from Phase 3.

## Auth: force fresh sign-in every browser session (2026-07-09)

- Requirement: opening the site must NOT auto-restore a previous login — the user
  signs in fresh each browser open.
- Root cause of persistence: InsForge browser SDK keeps the session as a backend
  **httpOnly refresh cookie**; on every load `getCurrentUser()` silently calls
  `/api/auth/refresh` and logs the user back in. JS can't read/expire an httpOnly cookie.
- Fix: `components/SessionGate.tsx` (wraps the app in `app/layout.tsx`). On the first
  load of each browser session (detected via a `sessionStorage` flag, which is wiped on
  browser/tab close) it calls `insforge.auth.signOut()` (clears the refresh cookie
  server-side) + clears the `insforge-auth` hint cookie, then reveals public pages or
  redirects protected ones to `/login`. It renders a spinner (not children) until the
  reset resolves, so the Navbar never flashes a stale "Sign out". The OAuth return
  (`/auth/*`) is excluded so logins in progress aren't killed.
- Works with `proxy.ts` (Next 16's renamed middleware; matches `/dashboard`,`/profile`,
  `/find-jobs`) which redirects to `/login` when no `insforge`/`session`/`auth` cookie
  exists. After SessionGate's signOut, that cookie is gone → protected routes gate.
- Caveats: (1) sessionStorage is per-tab, so opening the app in a NEW tab also forces a
  re-login and can end the session in other open tabs; (2) gating renders the app behind
  a client spinner on hard loads, so the public homepage isn't server-rendered for SEO.

## Match score + salary investigation & fixes (2026-07-09)

- **Diagnosed with a live throwaway script** (JSearch + Gemini using the real keys):
  the 20-job scoring path works fine (`finishReason=STOP`, all parsed, varied scores
  e.g. `[95,10,90,95,15,50,…]`). With an EMPTY profile the SAME code collapses to low
  scores (`[40,20,45,35,10,…]`, max 65). So "every job scores low" = the profile being
  scored is empty, NOT a scoring bug. Field names in `agent/jsearch.ts`'s prompt DO
  match the `profiles` columns/`profileFormSchema`.
- **Fixes:**
  - `components/find-jobs/SearchControls.tsx` — blocks a search when the profile has no
    title/skills/work_experience/job_titles_seeking, with a clear "profile too empty for
    accurate match scores" message (instead of silently returning misleading low scores).
  - `agent/jsearch.ts` — if Gemini scoring returns nothing (quota/failure), THROW a clear
    error instead of persisting a page of 0% jobs; tracks `quotaScoringFailed` for a
    quota-specific message. `app/api/agent/find/route.ts` now passes those quota/scoring
    messages through to the user instead of the generic "provider" error.
  - Salary: JSearch returns salary for only ~15% of jobs (rest are null at the provider —
    not a bug). `agent/jsearch.ts` now also handles max-only (`Up to $Xk`) and uses a
    consistent "Not listed" placeholder across list + details.
- **Sample resume for testing:** `public/sample-resume.pdf` (generated via
  `@react-pdf/renderer`) — "Alex Morgan, Senior Backend Engineer", Node/TS/AWS/PG, Stripe
  + Shopify. Served at `http://localhost:3000/sample-resume.pdf`. Use it to populate the
  profile so match scores vary. NOTE: existing saved jobs were scored vs the old empty
  profile and won't change retroactively — re-run a search after updating the profile.

## Environment / ops (2026-07-09)

- **`F:` drive had NTFS corruption** in `node_modules/autoprefixer/data` → build error
  "Cannot find module '../data/prefixes'". No npm reinstall could fix it (the corrupted
  entry couldn't even be deleted). Fix required the user to run `chkdsk F: /f` (admin) which
  repaired it live; then `npm install` restored autoprefixer + cleared `.next`. If a similar
  "corrupted and unreadable" / missing-module error recurs, it's disk-level — run
  `chkdsk F: /r` and check the drive's SMART health. Next also warns the `F:` filesystem is
  slow.

## Housekeeping fixes (2026-07-09)

- Fixed a real dead-token UI bug: the Find Jobs SOURCE badge used `bg-primary/10
  text-primary` but there is **no `primary` color token** (only `text.primary` →
  `text-text-primary`). Changed to `bg-accent-light text-accent`. When adding pills, use
  accent tokens — never `bg-primary`/`text-primary`.
- Removed an unused `insforge` import in `app/actions/resume.ts`.
- `context/ui-registry.md` updated with the Find Jobs results table and Job Details page
  patterns.
- Lint note: the repo has many PRE-EXISTING `@typescript-eslint/no-explicit-any` errors
  (house style, `any` used throughout). tsc is clean and the app runs; these were left
  as-is (a mass `any` refactor is out of scope). `next build` would fail on them unless
  eslint is configured to not fail builds — flag before any deploy.

## Feature 13 — Company Research Agent (DONE, 2026-07-09)

- Built with **Gemini + server-side fetch** (user-chosen), NOT the docs' Browserbase +
  Stagehand + GPT-4o. Why: app runs on Gemini (no `OPENAI_API_KEY`), browser deps not
  installed, and Stagehand pins zod 3 while the app uses zod 4 (would break profile
  validation). `architecture.md`/`library-docs.md` are pre-pivot/aspirational (they say
  OpenAI + Adzuna + `@insforge/ssr` server client; reality is Gemini + JSearch + single
  browser client + client-side DB writes).
- `agent/research.ts` — `researchCompany(job, profile)`: resolves the employer homepage by
  following `external_apply_url` to its final host (falls back to `https://www.<clean
  company>.com` when it lands on a job board/ATS — see `AGGREGATOR_RE` — or fails), reads
  homepage + up to 2 same-origin sub-pages via `fetch` + a regex `htmlToText()` (no cheerio),
  then Gemini (`gemini-2.5-flash`, JSON responseSchema) synthesizes the 9-field dossier.
  Reuses jsearch.ts's 429/503 retry + quota handling. ALWAYS returns all 9 fields; falls
  back to job+profile-only synthesis when no site text (sources = "none…").
- `app/api/agent/research/route.ts` — POST `{ job, profile }` → `{ dossier }`; surfaces
  quota/fetch errors (mirrors `/api/agent/find`). No auth check (like find route).
- `app/find-jobs/[id]/page.tsx` — "Research Company" button wired: fetches profile via
  browser client, POSTs, writes `company_research` to the job row (user-scoped) via browser
  SDK, `setJob(...)` to render instantly, fires PostHog `company_researched`. Loading +
  error + "Re-research" states added.
- **Deviations:** no `agent_logs` writes (no server client; table may not exist) — errors go
  to console + UI. Client-side DB write (no `@insforge/ssr` server client in this app).
- **Verified via curl (no login needed):** real site (Stripe) → 200, all 9 fields, real
  pages in sources, grounded overview; fallback (aggregator/unreachable) → 200, all 9
  fields, honest "no external site" sources, no crash. NOT driven in-app (auth needs email
  verification); tsc clean covers the client wiring.

## Feature 14 — Dashboard Full UI (DONE, 2026-07-09)

- Built to match `context/designs/dashboard.png` with MOCK data (feature 14 is UI only;
  15-17 wire real data). `app/dashboard/page.tsx` (server component) + new
  `components/dashboard/{StatCard,RecentActivity,BarChart,AreaChart}.tsx`.
- Layout: 4 stat cards (Total Jobs Found / Avg. Match Rate / Companies Researched / Jobs
  This Week — note design uses "Jobs This Week", not the build-plan's "Cover Letters
  Generated"); row 2 = Recent Activity timeline | Company Research Activity (blue bars);
  row 3 = Jobs Found Over Time (purple area, col-span-2) | Match Score Distribution (green).
- **Charts are custom self-contained SVG**, NOT recharts (recharts isn't installed; avoided
  a new dep on the Next 16 / React 19 stack). They take `{label,value}[]` + `maxY`/`ticks`/
  `color` (CSS-var string) props, so features 15-17 can feed real DB/PostHog data directly.
  `AreaChart` uses Catmull-Rom smoothing + gradient fill.
- No incomplete-profile banner (design shows none) — add when wiring real profile in f15.
- Verified: tsc clean; `/dashboard` renders 200 (checked via dummy `insforge-auth` cookie to
  pass `proxy.ts`); 3 chart `viewBox`, correct token colors + gridlines + labels in output.

## Feature 15 — Stats Bar real data (DONE, 2026-07-09)

- `components/dashboard/StatsBar.tsx` (client) replaces the mock stat row in
  `app/dashboard/page.tsx`. Fetches the user's jobs (`getCurrentUser` +
  `insforge.database.from("jobs").select("match_score, company_research, found_at").eq("user_id")`
  — same client-side pattern as `JobsList`, since there's no server InsForge client and the
  SDK has no count API) and computes in JS: Total Jobs Found = row count; Avg. Match Rate =
  mean match_score of scored rows; Companies Researched = rows where `company_research != null`;
  Jobs This Week = rows with `found_at` in last 7 days. Shows a 4-card skeleton while loading.
- **Dropped the design's "+12% vs last week" delta pills** — real deltas aren't computable
  (jobs table is ephemeral/replaced each search; no historical snapshots). Used descriptive
  subtitles instead ("In your list", "Across your jobs", "Total researched", "New this week").
  `StatCard` still supports an optional `delta` prop if a real trend source appears later.
- Reminder: because each search DELETEs prior jobs, "Total Jobs Found" reflects the CURRENT
  search set (~20), not a lifetime cumulative — a real cumulative count would need a schema
  change (stop deleting, or a separate counter/history table).
- Verified: tsc clean; `/dashboard` 200; mock `284` gone. Real values need an authenticated
  browser session to see (can't drive auth here).

## Feature 16 — Recent Activity real data (DONE, 2026-07-09)

- `components/dashboard/RecentActivityFeed.tsx` (client) replaces the mock list in the
  dashboard's Recent Activity card; renders via the existing presentational
  `RecentActivity` component. Fetches `agent_runs` + `jobs` (Promise.all, user-scoped),
  builds entries: completed runs → "Found N jobs for <job_title_searched>" (dot = accent);
  jobs with `company_research != null` → "Researched <company>" (dot = info-medium). Sorts
  by timestamp desc, takes top 6. Skeleton while loading; empty-state message when none.
- Timestamps: runs use `completed_at` (fallback `started_at`); research entries use
  `found_at` (jobs has no `researched_at` column — imperfect proxy for when research ran).
- Dot color mapping (spec says "info blue, success green" but design's top 2 rows are
  purple/blue): searches = accent (purple), research = info (blue) — matches the design's
  first two items and is a clean per-type mapping.
- Verified: tsc clean; `/dashboard` 200; mock activity removed; charts intact. Real entries
  need an authenticated browser session.

## Feature 17 — Dashboard Analytics Charts (DONE, 2026-07-09) — BUILD COMPLETE (all 17)

- DB-derived (user-chosen), NOT PostHog. PostHog unusable: no MCP, only the public ingest
  key (no Personal API key to query), `job_found` never captured, `posthog.identify` never
  called (events anonymous). DB has good sources (`agent_runs` is persistent).
- `lib/utils/dashboard.ts` — pure, unit-tested helpers: `jobsFoundSeries(runs)` (sum
  completed `agent_runs.jobs_found` per day, last 7), `researchSeries(jobs)` (researched jobs
  per day), `matchDistribution(jobs)` (5 buckets 50–100%, <50 omitted), `niceScale(max)`
  (auto integer y-axis, e.g. 12→[0,3,6,9,12], 85→[0,25,50,75,100]), `last7Days`, `seriesTotal`.
- Three client wrappers (`components/dashboard/{JobsOverTimeChart,MatchDistributionChart,
  CompanyResearchChart}.tsx`) fetch user-scoped rows and render the existing `AreaChart`/
  `BarChart`; skeleton + empty state each. Wired into `app/dashboard/page.tsx` (mock arrays
  removed). Jobs Over Time = accent/area; Match Dist = success/bars; Company Research =
  info/bars.
- Caveat: Company Research Activity is session-limited (jobs table ephemeral, no
  `researched_at`); real but sparse. 7-day window (matches design), not spec's 30 days.
- Verified: 11/11 helper unit tests pass (throwaway node script, now deleted); tsc clean;
  `/dashboard` 200 with all 3 wrappers wired, mock gone. Real bars/area need a signed-in
  session with search/research history.

## Dark mode + theme toggle (2026-07-09)

- App now defaults to **DARK** and has a **Bright/Dark** switcher on the landing page.
- Mechanism: the whole app already styles from CSS variables in `app/globals.css` `:root`
  (light). Added a `:root.dark { … }` block overriding EVERY `--color-*` token with dark
  values — one block re-themes every page (no per-component changes needed, since everything
  uses the tokens, including the SVG charts which read `var(--color-*)`).
- `app/layout.tsx`: `<html>` gets `class="dark"` by default + `suppressHydrationWarning`, and
  a tiny inline `themeScript` at the top of `<body>` applies `localStorage.theme` before paint
  (default dark; only removes `.dark` when saved theme is `light`) → no flash.
- `components/ThemeToggle.tsx` (client): segmented "Bright"/"Dark" (Sun/Moon), toggles the
  `dark` class on `<html>` + persists to `localStorage`. Placed on the landing page
  (`app/page.tsx`, top-right, labeled "Appearance").
- Overlay tokens (`--color-overlay`/`-dark`) kept dark in both themes (they back the BottomCTA
  dark band + Navbar CTA) so no component edits were needed. Resume PDF (`ResumeTemplate.tsx`)
  intentionally stays light — it's a printed document, not web UI.
- Verified: tsc clean; `/` renders 200 with default `dark` class; dark tokens
  (`#0b0e14`, `#151a23`, `#f2f4f8`, `#8b74ff`) present in compiled CSS.

## Decisions made

- Store storage KEY (not signed URL) in `resume_pdf_url`; mint signed URLs on demand.
- Always use `createSignedUrl` for private buckets; never `getPublicUrl`.
- Profile schema is permissive so partial profiles always save; completeness is tracked
  separately by the banner, not by validation.
- Each new job search REPLACES prior results for that user (jobs table is ephemeral
  search results; there is no saved-jobs feature yet).
- Gemini scoring is a single batched call per search (all jobs in one prompt) to avoid
  rate limits.

## Current state (ALL 17 build-plan features done ✅)

- Resume upload, view, and AI auto-fill work (Gemini) once quota is available.
- Profile save works and redirects to Find Jobs when complete.
- Find Jobs: live search (with company), faster discovery (~20 jobs / 2 pages), working
  filter/sort/pagination (10 per page), and differentiated AI match scores.
- Job Details page matches the design (f12); **Company Research button is wired** (f13) —
  Gemini + server fetch, `/api/agent/research`, dossier saved to `jobs.company_research`.
- **Dashboard** (`app/dashboard/page.tsx`): full UI to `dashboard.png` (f14, custom SVG
  charts); Stats Bar → real DB metrics (f15, `StatsBar.tsx`); Recent Activity → real
  `agent_runs` + researched jobs (f16, `RecentActivityFeed.tsx`); 3 analytics charts → real
  DB-derived series (f17, `lib/utils/dashboard.ts` + `{JobsOverTime,MatchDistribution,
  CompanyResearch}Chart.tsx`). Everything on the dashboard is real data now.
- Auth: `SessionGate` forces fresh sign-in each browser session (see the auth section).
- InsForge MCP server is NOT connected; SDK ground truth from `node_modules/@insforge/sdk`
  type defs. No server InsForge client / no `@insforge/ssr` — everything is the browser
  client with client-side fetches/writes.
- Backend requires EMAIL VERIFICATION before login, so throwaway test users can't drive the
  authenticated flow end-to-end. Agent routes (`/api/agent/find`, `/api/agent/research`) are
  testable via curl without login; protected pages can be rendered past `proxy.ts` with a
  dummy `insforge-auth` cookie for a compile/render check.

## Next session starts with

- **All 17 build-plan features are complete.** No feature work queued. Likely follow-ups
  (none started):
  - **Deploy prep:** `next build` FAILS on the repo-wide pre-existing `no-explicit-any` lint
    errors. Before deploying, either set `eslint.ignoreDuringBuilds` in `next.config` or clean
    the `any`s. Also do a real signed-in end-to-end pass (email verification blocks throwaway
    users here).
  - **Data-model gaps surfaced during f15–f17** (only if the user wants richer dashboards):
    jobs table is ephemeral (deleted each search) → no lifetime "Total Jobs Found", no
    persistent research history; no `researched_at` column. Fixes need schema changes (stop
    deleting jobs / add a history or research-event table) via InsForge — MCP not connected,
    so the user runs SQL.
  - **Real product analytics:** if PostHog dashboards are wanted, add `posthog.identify(userId)`
    on login + capture `job_found`/`company_researched` consistently, then a query layer with a
    Personal API key.

## Open questions

- The Gemini key is still an `AQ.Ab8…`-type key that likely still has a modest daily
  cap. If AI features stop mid-day, it's the daily quota again (resets ~midnight PT).
  Consider enabling billing or moving to InsForge's provisioned OpenRouter AI later.
