## Context

The analytics store (7.3, JOS-72, Done) persists anonymized events: `visit_session(id, started_at, last_event_at)` and `analytics_event(session_id, event_type[6-enum], occurred_at, page_path, section_id, scroll_depth_percent, contact_target[scheduling/email/linkedin], country_or_region, referrer_domain, device_class)`, indexed on `occurred_at` and `session_id`. `lib/analytics/store.ts` is **write-only** — `AnalyticsStore` exposes only `recordEvent`, with a `createNeonAnalyticsStore()` and a `createInMemoryAnalyticsStore()` fake. 7.4a (JOS-88, merged) ships the owner-only `/admin` Basic-Auth gate and an empty `AdminDashboardShell` ("Insights" + "Reports coming soon (7.4b)") behind it, `runtime = "nodejs"`, `noindex`. This story adds the missing read path and fills the shell. data-model.md principle 2 mandates query-time aggregation with no rollup tables in the MVP; the anonymized schema (no PII column exists) structurally guarantees the "no PII" acceptance criterion.

## Goals / Non-Goals

**Goals:**
- Give the owner the four F9 report families (traffic, engagement depth, chat usage, conversions) as aggregates + trends, doubling as the §10 launch scorecard.
- Keep every report unit-testable with no live DB, via an injectable reports interface + in-memory fake (mirroring the store).
- Fill the `/admin` shell with a real, accessible, empty-state-aware dashboard, entirely behind the existing gate.

**Non-Goals:**
- The access gate (7.4a, shipped) — unchanged.
- Any new HTTP/`/api` endpoint — the server component queries the reports layer directly.
- Rollup tables, a retention job, or a charting dependency (all deferred/avoided).
- Verifying real production numbers — that needs a populated `DATABASE_URL` (owner/post-deploy); fixture-backed unit tests are the authoritative gate.

## Decisions

### 1. A separate read layer `lib/analytics/reports.ts`, not bolted onto the write-path store
Add `AnalyticsReports` as its own interface (`createNeonAnalyticsReports()` + an in-memory fake), leaving `AnalyticsStore` write-only. Reads and writes have different shapes, different SQL, and different test fixtures; keeping them separate keeps each small and matches the single-responsibility split already implied by the store's design.
- *Fake strategy:* the in-memory fake computes the same aggregates in TypeScript from a `StoredEvent[]` (+ derived session start/last-event times) fixture array, so a test asserts "these events → these aggregates" with no network. This mirrors `createInMemoryAnalyticsStore` and the repo's no-live-network test convention.
- *Alternative considered:* extending `AnalyticsStore` with read methods — rejected; it would bloat the write interface and force the write fake to grow read logic.

### 2. Query-time aggregation, no rollup tables
Each report is parameterized aggregation SQL (`COUNT`, `COUNT(DISTINCT session_id)`, `GROUP BY`, `date_trunc(...)` for trend buckets, `percentile_cont(0.5)` for the median duration) over the existing indexes — exactly data-model.md principle 2. The event volume at launch is tiny (~50–150 chunks of content, low traffic), so query-time cost is negligible; rollups are a documented future upgrade only "if dashboard performance requires them."

### 3. "Reached the second career chapter" is computed from ordered chapter ids passed in, not hard-coded
The engagement metric "% of sessions reaching the 2nd career chapter" needs the ordered chapter ids. `section_reach` events carry `sectionId` = the experience/chapter id (the same id `CareerTimeline` observes). The reports layer stays decoupled from content-reading: the caller (the `/admin` server component) passes the ordered chapter ids from `getExperiences()`; the report checks whether each session has a `section_reach` for the id at order index 1 (the second chapter). This keeps `reports.ts` pure and testable with fixture chapter ids, and avoids the reports layer importing the content layer.
- *Rationale:* the "second chapter" is content-defined, not analytics-defined; injecting the ordered ids keeps the coupling one-directional and the unit tests hermetic.

### 4. The `/admin` page fetches at request time; presentation lives in `components/admin/*`
`app/admin/page.tsx` (already `runtime = "nodejs"`, gated, `noindex`) becomes an `async` server component: it constructs `createNeonAnalyticsReports()`, awaits the report values, and renders them. Following the repo convention that `page.tsx` is a thin wrapper and testable presentation lives in `components/` with SSR tests, the report views are pure server components in `components/admin/*` (number cards, semantic tables, SSR-rendered bar/sparkline trends) that take already-computed report data as props — so they render deterministically in `renderToStaticMarkup` tests with fixture props, no DB. `AdminDashboardShell` (7.4a's placeholder) is superseded and deleted; `AdminDashboard` composes the four report sections.
- **Bonus discovered during implementation:** `runtime = "nodejs"` alone does **not** force dynamic rendering. An `async` server component with no `cookies()`/`headers()`/`searchParams` usage is still eligible for static prerendering — and with a real `DATABASE_URL` present at build time (as in local dev), `next build` actually executed the Neon queries and baked `/admin` in as a **static** (`○`) route, which would have shipped stale, build-time-frozen numbers in production. Fixed by adding `export const dynamic = "force-dynamic"` alongside `runtime = "nodejs"`, confirmed by `next build` showing `/admin` as `ƒ` (Dynamic) while public routes stay `○` (Static).

### 5. No charting dependency — SSR-simple visualization
Trends and distributions render as inline SSR bars/sparklines (divs/SVG sized from the aggregate values), no client chart library. This honors the minimal-deps ethos, keeps the views pure server components (SSR-testable), and needs no client JS. A client chart lib is a noted optional upgrade — harmless to the public perf budget because `/admin` is dynamic and owner-only, but unnecessary for "aggregates and trends."

### 6. Anonymity + empty state are first-class
The reports return only aggregate shapes (counts, shares, medians, distributions, trend buckets) — never raw session rows — so AC2 holds structurally *and* by construction (there is no PII column to leak, and no code path returns per-row data). `question_asked` contributes a count only (no text is stored). The dashboard renders an explicit "No data yet" empty state, since the DB has ~zero events until the site is deployed and collecting — asserted with an empty-fixture test.

## Risks / Trade-offs

- **[Risk]** Query-time aggregation could get slow at high volume. → **Mitigation:** launch traffic is low and columns are indexed; rollups are a documented, non-blocking future upgrade (data-model.md principle 2).
- **[Risk]** The "second chapter" metric depends on chapter ordering that can change as content evolves. → **Mitigation:** ids are injected from `getExperiences()` at render time, so the metric always reflects current content order; no id is hard-coded in `reports.ts`.
- **[Risk]** No live-DB test coverage of the real SQL (same gap as 7.3). → **Mitigation:** the Neon impl uses the same parameterized-`sql` pattern as the proven `store.ts`; the fake covers all aggregation logic; a real-data check is an explicit owner/post-deploy step.
- **[Trade-off]** SSR-only visualization is less interactive than a chart library. Accepted — it fully satisfies "aggregates and trends," adds zero dependencies, and stays purely server-rendered.

## Migration Plan

Implement per `tasks.md` (test-first on `reports.ts` with the fake) → build `components/admin/*` with SSR tests → wire `app/admin/page.tsx` to fetch and render, with an empty state → `npm test` / `tsc` / `validate:content` clean → `next build` (confirm `/admin` stays dynamic/`nodejs` and public routes stay static) → dev-server curl behind the gate to eyeball the rendered dashboard (empty-state, since local DB is empty) → real-number verification is an owner post-deploy step against a populated `DATABASE_URL`. Rollback is reverting `reports.ts` + the admin components and restoring the shell placeholder; nothing else depends on it.

## Open Questions

- None blocking. Real production credentials/data are an owner deploy-time concern (like `DATABASE_URL` already is for the store), not a code decision.
