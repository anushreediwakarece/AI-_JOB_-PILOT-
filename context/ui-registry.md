# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Auth Split Layout (Login Page)

File: `app/login/page.tsx`
Last updated: 2026-07-06

| Property         | Class           |
| ---------------- | --------------- |
| Background       | `bg-background` (page), `bg-surface` (right), `bg-accent-muted` (left) |
| Border           | `border-border` |
| Border radius    | `rounded-[32px]` (container), `rounded-xl` (large buttons), `rounded-full` (pill) |
| Text — primary   | `text-text-darkest` (headings), `text-text-primary` (buttons) |
| Text — secondary | `text-text-secondary` (descriptions, small labels) |
| Spacing          | `p-12 lg:p-16` (panel padding), `gap-3` (buttons) |
| Hover state      | `hover:bg-surface-tertiary`, `hover:bg-surface-secondary` |
| Shadow           | `shadow-lg` (container), `shadow-sm` (pill/button) |
| Accent usage     | `text-accent` (icons) |

**Pattern notes:**
This layout is a massive centered split-card (1040px max-width) used for authentication and potentially onboarding. It pairs a tinted accent background on the left with a clean white surface on the right. Large action buttons have `rounded-xl` and generous padding `py-3.5`. All icons inside buttons or pills pull from the `lucide-react` library.

---

### Find Jobs — Results Table (filter + sort + pagination)

File: `components/find-jobs/JobsList.tsx`
Last updated: 2026-07-09

| Property         | Class           |
| ---------------- | --------------- |
| Container        | `bg-surface border border-border rounded-xl shadow-sm overflow-hidden` |
| Filter bar       | `p-4 md:p-6 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4` |
| Filter input     | `pl-10 text-sm` with left `Search` icon `h-5 w-5 text-text-muted` |
| Dropdowns        | `Select` — `w-full md:w-40`/`md:w-48 text-sm h-10` (All Matches, Sort) |
| Table head       | `border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider`; `th` `px-6 py-4` |
| Table row        | `hover:bg-surface-secondary transition-colors group cursor-pointer`; cells `px-6 py-5` |
| Company logo cell| `w-10 h-10 rounded bg-surface border border-border` + `Building2` icon |
| Match score bar  | track `h-2 rounded-full bg-surface-muted`; fill `bg-success` (≥90) / `bg-info-medium` (≥80) / `bg-warning` (else) |
| Source badge     | `rounded-full text-xs font-medium bg-accent-light text-accent capitalize` (link adds `hover:opacity-80`) |
| Pagination bar   | `p-4 md:p-6 border-t border-border flex ... justify-between`; page numbers `text-sm font-medium px-3` |
| Empty / loading  | `h-[300px] flex items-center justify-center`; `Loader2 animate-spin text-text-muted` |

**Pattern notes:**
Client-side filter/sort/pagination over the fetched job set. Page size **10**. Filter search matches company OR title; match filter thresholds are `>= 70` (High) / `< 70` (Low). Uses `safePage = clamp(currentPage, 1..totalPages)` for slicing and controls so a shrunk result set never shows an empty page. Do NOT use `bg-primary/text-primary` — there is no `primary` color token; the accent pill token is `bg-accent-light text-accent`.

---

### Job Details Page

File: `app/find-jobs/[id]/page.tsx`
Last updated: 2026-07-09

| Property         | Class           |
| ---------------- | --------------- |
| Page container   | `max-w-[960px] mx-auto px-6 py-8 gap-6 flex flex-col` |
| Card base        | (`components/ui/Card`) `bg-surface border border-border rounded-2xl p-6 shadow-sm` |
| Back link        | `text-sm text-text-secondary hover:text-accent` + `ArrowLeft` |
| Header logo box  | `w-14 h-14 rounded-xl bg-surface-secondary border border-border` + `Building2` |
| Header title     | `text-2xl font-bold text-text-primary`; company `text-text-secondary`, `•` `text-text-muted` |
| Match pill       | `rounded-full px-3 py-0.5 text-sm font-semibold` — `bg-success-lightest text-success-foreground` (≥70) / `bg-accent-light text-accent` (else) |
| Info tile        | `Card flex items-center gap-3 p-4`; icon box `w-10 h-10 rounded-lg` (`bg-success-lightest`/`bg-info-lightest`/`bg-accent-light`/`bg-surface-secondary`); value `font-bold text-text-primary text-sm`; label `text-text-muted text-xs font-medium uppercase tracking-wider` |
| Small section label | `text-xs font-bold uppercase tracking-wider text-text-secondary` (AI Match Reasoning, Required Skills) |
| Section heading  | `text-lg font-bold text-text-primary flex items-center gap-2` (Job Description, Company Research) |
| Skill pill — have| `rounded-full bg-success-lightest px-3 py-1 text-sm font-medium text-success-foreground` + `Check` |
| Skill pill — gap | `rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent` + `X` |
| Empty state      | icon circle `w-14 h-14 rounded-full bg-surface-secondary` + `font-bold text-text-primary` title + `text-text-muted text-sm` |
| Primary button   | `Button variant="primary"` (accent); full-width apply `w-full h-12 text-base font-semibold` |

**Pattern notes:**
Built to match `context/designs/job-details.png`. Green = "have"/strong-match (success tokens), purple = accent/gap (accent tokens), blue = location (info tokens). Small uppercase labels (`text-xs font-bold uppercase`) head the AI sections; larger `text-lg font-bold` headings head Job Description / Company Research. The "Research Company" button is wired (feature 13): it shows a spinner + "Researching…" while the agent runs, the card body shows an in-progress state, errors render in a `bg-error/10` banner, and a completed dossier flips the button label to "Re-research".

---

### Dashboard (stat cards, activity timeline, charts)

Files: `app/dashboard/page.tsx`, `components/dashboard/{StatCard,RecentActivity,BarChart,AreaChart}.tsx`
Last updated: 2026-07-09

| Element          | Class / detail  |
| ---------------- | --------------- |
| Page shell       | `main bg-background`; inner `max-w-[1360px] mx-auto px-6 py-10 flex flex-col gap-6` |
| Stat row         | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6` |
| Stat card        | `Card` + title `text-text-secondary text-sm font-medium`, value `text-4xl font-bold text-text-primary`, delta pill `bg-success-lightest text-success-foreground text-xs font-semibold rounded-md px-2 py-1`, subtitle `text-text-muted text-sm` |
| Row 2            | `grid grid-cols-1 lg:grid-cols-2 gap-6` — Recent Activity \| Company Research Activity |
| Row 3            | `grid grid-cols-1 lg:grid-cols-3 gap-6` — Jobs Found Over Time (`lg:col-span-2`) \| Match Score Distribution |
| Card heading     | `text-lg font-bold text-text-primary` (mb-4/mb-6) |
| Chart card body  | `flex flex-col` card + `flex-1 flex items-center` wrapper so the SVG centers and fills |
| Activity item    | colored dot `w-3 h-3 rounded-full` (inline `style` CSS-var color) + connector `w-px flex-1` `var(--color-border)`; title `font-semibold text-sm`, time `text-text-muted text-sm` |

**Pattern notes:**
Charts are **custom responsive SVG** (`viewBox` + `w-full h-auto`), not a chart lib — take
`data: {label,value}[]`, `maxY`, `ticks`, and a `color` **CSS-variable string** (e.g.
`var(--color-info-medium)`) applied via inline `style` `fill`/`stroke` (satisfies the
no-hardcoded-hex invariant). `BarChart` = vertical bars (rounded top, dashed gridlines);
`AreaChart` = Catmull-Rom smooth curve + top-down gradient fill. Dashboard palette: blue
`info-medium` (research activity), purple `accent` (jobs over time + purple activity dots),
green `success` (match distribution + green activity dots). Built to match
`context/designs/dashboard.png` with mock data (feature 14).

Data wiring: `StatsBar.tsx` (f15) renders the 4 stat cards from real DB metrics (with a
4-card skeleton), and `RecentActivityFeed.tsx` (f16) renders the timeline from real
`agent_runs` + researched jobs (skeleton + empty state). Both are thin client wrappers over
the presentational `StatCard` / `RecentActivity` above — reuse those, don't re-style. The 3
charts remain mock until feature 17.
