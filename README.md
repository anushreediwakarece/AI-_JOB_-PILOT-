<p align="center"> <img src="public/logo.png" alt="JobPilot logo" width="120" /> </p> <h1 align="center">JobPilot</h1> <h3 align="center">Open-Source AI-Powered Job Hunting Assistant</h3> <p align="center"> Find relevant jobs, get intelligent match scores, research companies, and prepare for interviews — all powered by AI. </p> <p align="center"> <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" /> <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js" /> <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" /> <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /> <img src="https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /> <img src="https://img.shields.io/badge/AI-Gemini%202.5%20Flash-8E75FF?logo=googlegemini&logoColor=white" alt="Google Gemini" /> <img src="https://img.shields.io/badge/Backend-InsForge-6C4CFF" alt="InsForge" /> <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" /> </p> <p align="center"> <a href="https://github.com/anushreediwakarece/AI-_JOB_-PILOT-/issues"><b>🐛 Report a Bug</b></a> · <a href="https://github.com/anushreediwakarece/AI-_JOB_-PILOT-/issues"><b>✨ Request a Feature</b></a> </p>
Why JobPilot?

Job hunting is slow and repetitive: scrolling through listings that don't fit, guessing whether you're qualified, and researching every company by hand before an interview. This is especially hard for students and early-career developers who don't yet know what to look for.

JobPilot automates the boring parts. Upload your resume once, and an AI agent finds real jobs, scores how well each one matches you, tells you which skills you have and which you're missing, and builds an interview-prep dossier on the company.

It's free, open source, and self-hostable — anyone can run it with their own API keys.

Table of Contents
Features
Screenshots
Tech Stack
Getting Started
Environment Variables
Scripts
Project Structure
How It Works
Roadmap
Contributing
Notes & Limitations
License
Author
Features
AI profile extraction — upload a PDF resume and Gemini auto-fills your profile.
Resume generation — generate a clean, polished PDF resume from your profile.
Live job discovery — search real jobs (title · company · location) via JSearch.
AI match scoring — every job is scored 0–100 against your profile, with a match reason and matched/missing skills.
Filter · sort · pagination — high/low match filters, sort by score or date, search by company or role.
Company research agent — reads the employer's public site and generates a 9-field dossier (overview, tech stack, culture, your edge, gaps to address, smart interview questions, prep, sources).
Dashboard — real stats, a recent-activity timeline, and analytics charts (jobs over time, match-score distribution, research activity).
Dark / light theme — dark by default, with a Bright/Dark switch on the landing page (persisted).
Screenshots
Landing	Dashboard
Landing page	Dashboard
Find Jobs	Job Details
Find jobs	Job details
Tech Stack
Layer	Technology
Framework	Next.js 16.2.10 (App Router) · React 19.2.4 · TypeScript 5
Styling	Tailwind CSS 3.4 (pinned — do not upgrade to v4) · autoprefixer · CSS-variable design tokens
Backend (BaaS)	InsForge — auth, Postgres, storage (@insforge/sdk)
Auth	InsForge OAuth (Google · GitHub)
AI	Google Gemini (gemini-2.5-flash, @google/generative-ai)
Job data	JSearch via RapidAPI
Company research	Server-side fetch of the employer site + Gemini synthesis
Forms & validation	react-hook-form · @hookform/resolvers · zod
Icons	lucide-react
PDF	@react-pdf/renderer
Analytics	PostHog (posthog-js)
Charts	Custom self-contained SVG (no chart library)
Tooling	ESLint (eslint-config-next) · Turbopack dev server

The full dependency list is in package.json.

Getting Started
Prerequisites
Node.js 20+ (developed on Node 24)
An InsForge project (URL + anon key)
API keys: Google Gemini and RapidAPI (JSearch). PostHog is optional.
Installation
bash
# 1. Clone the repository
git clone https://github.com/anushreediwakarece/AI-_JOB_-PILOT-.git
cd AI-_JOB_-PILOT-

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# then edit .env.local with your keys

# 4. Start the dev server
npm run dev

Open http://localhost:3000. Sign in, complete your profile (upload public/sample-resume.pdf to try AI extraction), then run a job search.

The InsForge backend needs these tables — profiles, agent_runs, jobs, agent_logs — and a private resumes storage bucket. See context/architecture.md for the full schema.

Environment Variables

Copy .env.example → .env.local and fill in your values. .env.local is gitignored — never commit real secrets.

Variable	Required	Description
NEXT_PUBLIC_INSFORGE_URL	✅	InsForge backend URL
NEXT_PUBLIC_INSFORGE_ANON_KEY	✅	InsForge anon/public key
GEMINI_API_KEY	✅	Google Gemini API key (all AI features)
RAPIDAPI_KEY	✅	RapidAPI key for JSearch
NEXT_PUBLIC_POSTHOG_KEY	⚪	PostHog ingest key (analytics)
NEXT_PUBLIC_POSTHOG_HOST	⚪	PostHog host (e.g. https://us.i.posthog.com)

NEXT_PUBLIC_* variables are exposed to the browser; the rest are server-only.

Scripts
Command	Description
npm run dev	Start the dev server (Turbopack)
npm run build	Production build
npm run start	Serve the production build
npm run lint	Run ESLint
Project Structure
app/
  page.tsx                     Landing page (+ theme toggle)
  layout.tsx                   Root layout, theme + PostHog providers
  login/ · auth/callback/      OAuth sign-in + callback
  dashboard/                   Stats, recent activity, analytics charts
  profile/                     Profile form, resume upload/generate
  find-jobs/                   Search + results list
  find-jobs/[id]/              Job details + company research
  api/agent/find/              Job discovery + Gemini scoring (route)
  api/agent/research/          Company research agent (route)
  actions/                     Server actions (AI extraction, resume)
agent/
  jsearch.ts                   JSearch discovery + batched Gemini scoring
  research.ts                  Company research (fetch + Gemini synthesis)
components/                    UI (ui/, layout/, homepage/, dashboard/, find-jobs/, …)
lib/
  insforge.ts                  InsForge browser client
  jsearch.ts                   JSearch API client
  utils/                       Shared helpers (dashboard metrics, profile completion)
context/                       Project docs (architecture, build-plan, ui-registry, designs)
proxy.ts                       Route protection (Next 16 middleware)
How It Works
Job discovery — the client calls POST /api/agent/find → agent/jsearch.ts queries JSearch, then Gemini scores every job against your profile in one batched call.
Company research — POST /api/agent/research → agent/research.ts resolves the employer's homepage (follows the apply link, falls back to www.<company>.com), reads a few public pages, and Gemini synthesizes a dossier saved to jobs.company_research.
Dashboard — stats, activity, and charts are computed client-side from the user's own jobs and agent_runs rows.
Theming — the whole UI is driven by CSS-variable tokens; a :root.dark override re-themes every page, toggled via the landing-page switch and persisted in localStorage.
Roadmap
 Support multiple AI providers (OpenAI alongside Gemini), selectable via env config
 Fix remaining no-explicit-any lint issues so next build passes cleanly
 Add unit and integration tests + GitHub Actions CI
 Keep search history instead of replacing results on each new search
 AI-generated cover letters tailored to each job
 Application tracker (applied / interviewing / offer / rejected)
 Docker setup for one-command self-hosting

Have an idea? Open an issue.

Contributing

Contributions are welcome — whether it's a bug fix, a new feature, or better docs.

Fork the repository
Create a branch: git checkout -b feature/your-feature
Commit your changes: git commit -m "Add your feature"
Push: git push origin feature/your-feature
Open a Pull Request

Please run npm run lint before submitting. For larger changes, open an issue first to discuss the approach.

Notes & Limitations
AI provider: the app currently runs on Google Gemini. Multi-provider support is on the roadmap.
Job source: JSearch via RapidAPI.
Dashboard charts are DB-derived. Total Jobs Found reflects your current search set, since each new search replaces the previous results.
Deploy: the codebase has existing @typescript-eslint/no-explicit-any lint findings, so next build fails by default. Set eslint.ignoreDuringBuilds in next.config (or fix them) before deploying.
License

This project is licensed under the MIT License — see the LICENSE file for details.

Author

Anushree Diwakar — B.Tech ECE student, DES Pune University

GitHub: @anushreediwakarece

If JobPilot helps you, please consider giving it a ⭐ — it helps others find the project!
