## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-89-74b-admin-dashboard-reports-and-queries` (Linear-provided branch name for JOS-89) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: this story adds an analytics READ layer and
the owner-only dashboard UI. There is still no live database in `npm test`
(same as 7.3): the aggregation logic lives in a PURE, injectable reports layer
(`lib/analytics/reports.ts`) with an in-memory fake, fully unit-tested from
fixture events with no network — that is the authoritative gate. The report
views are pure server components tested via `renderToStaticMarkup` with fixture
props. The Neon impl uses the same parameterized-`sql` pattern as the proven
`store.ts`; a real-numbers check needs a populated `DATABASE_URL` and is an
owner/post-deploy step. Applicable gates: TDD on the reports layer, SSR tests
on the admin components, `npx vitest run`, `npx tsc --noEmit`,
`npm run validate:content`, `npm run lint` (broken repo-wide, same skip),
`next build` (`/admin` stays dynamic/nodejs, public routes stay static), and a
dev-server curl behind the 7.4a gate to eyeball the rendered dashboard.
"OpenAPI documentation" is N/A — there is no new HTTP endpoint (the server
component queries the reports layer directly). "Database state verification" is
N/A locally — no live DB in the test suite; the fake-backed unit tests cover
all aggregation behavior.
-->

## 1. Report fixtures + in-memory fake (test scaffolding)

- [x] 1.1 Add an analytics-events fixture helper for tests (a small factory building `StoredEvent`s of each `eventType` with controllable `sessionId`, `occurredAt`, `sectionId`, `scrollDepthPercent`, `contactTarget`, `deviceClass`, `countryOrRegion`, `referrerDomain`), so report tests can compose realistic multi-session scenarios deterministically
- [x] 1.2 Define the `AnalyticsReports` interface and a `createInMemoryAnalyticsReports(events, orderedChapterIds)` fake stub (throwing/`TODO` bodies) in `lib/analytics/reports.ts` so the failing tests in group 2 have a type to compile against

## 2. Traffic report (TDD) (AC1)

- [x] 2.1 Write failing tests in `lib/analytics/reports.test.ts` for the traffic report: from fixture events, assert total `page_view` count, unique `visit_session` count, a per-day trend bucketed by `occurred_at`, and breakdowns by `device_class` / `country_or_region` / `referrer_domain`
- [x] 2.2 Implement the traffic aggregation in the in-memory fake so the tests pass
- [x] 2.3 Run `npx vitest run lib/analytics/reports.test.ts` and confirm the traffic cases pass

## 3. Engagement-depth report (TDD) (AC1)

- [x] 3.1 Write failing tests for the engagement report: median session duration (`last_event_at − started_at` across sessions), share of sessions with a `section_reach` for the chapter id at order-index 1 (the "second chapter", from the injected `orderedChapterIds`), and a deepest-section / scroll-depth distribution
- [x] 3.2 Implement engagement aggregation in the fake so the tests pass (including the injected-ordered-ids logic from design Decision 3)
- [x] 3.3 Run the reports tests and confirm the engagement cases pass

## 4. Chat-usage + conversions reports (TDD) (AC1, AC2)

- [x] 4.1 Write failing tests for chat usage (`chat_open` count + share of sessions; `question_asked` **count only**) and conversions (`resume_download` count; `contact_click` count grouped by `contactTarget`)
- [x] 4.2 Add an AC2 test asserting the reports surface returns only aggregate shapes — no raw session rows and no PII fields, and that `question_asked` contributes a count with no text field anywhere in the returned data
- [x] 4.3 Implement the chat + conversions aggregation in the fake so the tests pass
- [x] 4.4 Add an empty-store test: with zero events every report returns a well-defined empty/zero result (not a throw), backing the dashboard "no data yet" state
- [x] 4.5 Run the reports tests and confirm all cases pass

## 5. Neon reports implementation

- [x] 5.1 Implement `createNeonAnalyticsReports()` in `lib/analytics/reports.ts`: parameterized aggregation SQL (`COUNT`, `COUNT(DISTINCT session_id)`, `GROUP BY`, `date_trunc` for trend buckets, `percentile_cont(0.5)` for median duration) over `visit_session`/`analytics_event`, reading `DATABASE_URL` and reusing the `@neondatabase/serverless` `neon()` pattern from `store.ts`; throw a clear error if `DATABASE_URL` is unset. (No new live-DB test — same coverage boundary as `store.ts`; the fake covers the aggregation semantics)

## 6. Admin dashboard UI (AC1, AC2, empty state)

- [x] 6.1 Build the report view components under `components/admin/*` (number/stat cards, semantic tables, and SSR-rendered bar/sparkline trend elements) as pure server components taking already-computed report data as props; reuse 8.2 a11y patterns (semantic tables, headings, `focusRingClass`, AA-contrast tokens). Add `*.ssr.test.tsx` tests rendering each with fixture props via `renderToStaticMarkup`, including the empty-data ("No data yet") state
- [x] 6.2 Wire `app/admin/page.tsx` to fetch reports at request time: make it an `async` server component that builds `createNeonAnalyticsReports()`, passes the ordered chapter ids from `getExperiences()`, awaits the report values, and renders the admin components (replacing `AdminDashboardShell`'s placeholder body / composing a new `AdminDashboard`). Keep `runtime = "nodejs"`, the `noindex` metadata, and the 7.4a gate intact. Fix the stale `app/admin/page.tsx` comment that still says "gated by middleware.ts" → `proxy.ts`. **Note:** `AdminDashboardShell.tsx`/`.ssr.test.tsx`/`AdminDashboardShellStyles.ts` (the 7.4a placeholder) were deleted — fully superseded by `components/admin/AdminDashboard.tsx`, no dangling references
- [x] 6.3 Run `npx vitest run components/admin` and confirm all SSR cases pass

## 7. Docs

- [x] 7.1 Update `README.md`'s "Admin access" section to describe what the dashboard shows (the four report families) and that numbers populate only once the deployed site is collecting events
- [x] 7.2 Record the F9-reports→schema mapping in `docs/data-model.md` principle 2 (which report reads which columns/aggregations); also fixed the stale `middleware.ts` → `proxy.ts` reference in principle 4 left over from 7.4a

## 8. Full verification (agent executes all of this itself)

- [x] 8.1 Run `npx vitest run` (full suite) and confirm no regressions — 305/305 pass
- [x] 8.2 Run `npx tsc --noEmit` clean
- [x] 8.3 Run `npm run validate:content` clean
- [x] 8.4 Run `npm run lint` — same pre-existing repo-wide failure (missing `eslint.config.mjs`), unrelated to this change; skipped with the same rationale as prior stories
- [x] 8.5 Run `next build` and confirm `/admin` stays dynamic (`ƒ`/nodejs) and the public routes (`/`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`) stay `○ Static` — the reports fetch must not pull public pages into dynamic rendering. **Real finding:** `runtime = "nodejs"` alone didn't force dynamic rendering — with a real `DATABASE_URL` present, the first build statically prerendered `/admin` (baking in build-time numbers). Fixed by adding `export const dynamic = "force-dynamic"` to `app/admin/page.tsx`; rebuild confirmed `/admin` as `ƒ`. See design.md Decision 4
- [x] 8.6 Started the dev server and curled `/admin` behind the 7.4a Basic-Auth gate: no credentials → `401`; `-u owner:change-me-locally` → `200` rendering the real dashboard (all four report section headings present — the local `DATABASE_URL` has live data, so this exercised the actual Neon query path, not just the empty state), all 8.4 CSP/hardening headers present, `/robots.txt` still disallows `/admin`, public `/` still `200` with no auth challenge. Stopped the dev server; confirmed port 3000 free
- [x] 8.7 Real-number verification against a populated `DATABASE_URL` is an owner/post-deploy step (this session's curl check happened to hit live data already); the OpenAPI DoD line is N/A — no new HTTP endpoint. Both noted in the PR description

## 9. OpenSpec sync

- [x] 9.1 After merge, sync `specs/admin-reports/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
