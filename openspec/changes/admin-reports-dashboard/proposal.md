## Why

The analytics store (7.3, JOS-72) has been persisting anonymized events since it shipped, but nothing reads them — `AnalyticsStore` exposes only `recordEvent`, so the owner has no way to see traffic, engagement, chat usage, or conversions. 7.4a (JOS-88) shipped the owner-only `/admin` gate and an empty "Insights" shell explicitly as a placeholder for this story. This change (7.4b, JOS-89) builds the read/aggregation surface and fills that shell with the actual reports — the dashboard that PRD §5 F9 promises and that doubles as the launch scorecard for the §10 success metrics.

## What Changes

- **A new read/aggregation layer** `lib/analytics/reports.ts`: an `AnalyticsReports` interface with a `createNeonAnalyticsReports()` implementation (parameterized aggregation SQL — `COUNT`/`GROUP BY`/`date_trunc`/`percentile_cont`) plus an **in-memory fake** computing the same aggregates from a fixtures array, keeping every report unit-testable with no live database (mirroring `lib/analytics/store.ts`'s existing fake). This is separate from the write-path store — the store stays write-only.
- **Four report families**, each an aggregate/trend over the existing `visit_session` + `analytics_event` schema, with **no new columns and no rollup tables** (query-time aggregation on the existing `occurred_at`/`session_id` indexes, per data-model.md principle 2):
  - **Traffic** — `page_view` count, unique `visit_session` count, a daily/weekly trend, and breakdowns by `device_class` / `country_or_region` / `referrer_domain`.
  - **Engagement depth** — median session duration, the share of sessions that reach the second career chapter, deepest-section distribution, and scroll-depth (maps §10.2: median > 2 min, ≥ 40% reach 2nd chapter).
  - **Chat usage** — `chat_open` count and share of sessions; `question_asked` **count only**, never text (maps §10.3: ≥ 25% open chat).
  - **Conversions** — `resume_download` count and `contact_click` count broken down by `contact_target` (maps §10.4).
- **The `/admin` dashboard UI** filled in: `app/admin/page.tsx` becomes a data-fetching server component (`runtime = "nodejs"`, queries at request time behind the 7.4a Basic-Auth gate) rendering `components/admin/*` — number cards, tables, and simple **SSR-rendered** bars/sparklines for trends. Includes an explicit **empty-data state** ("No data yet") for the pre-traffic period.
- **No charting dependency** — SSR-simple visualization satisfies "aggregates and trends"; a client chart library is noted as an optional later upgrade (harmless to the public perf budget since `/admin` is dynamic and owner-only).
- **Docs:** extend the README "Admin access" note to describe what the dashboard shows; optionally record the F9-reports→schema mapping in `docs/data-model.md`.
- **Out of scope:** the access gate itself (7.4a, shipped); any new HTTP endpoint (the server component queries directly — **no** `/api` route, so the OpenAPI DoD line is N/A); retention/rollup jobs (deferred, data-model.md §5); real-number verification against a populated DB (an owner/post-deploy step — the fixture-backed unit tests are the authoritative gate, same as 7.3).

## Capabilities

### New Capabilities
- `admin-reports`: owner-only reporting over the anonymized analytics store — aggregate and trend reports for traffic, engagement depth, chat usage, and conversions, surfaced on the protected `/admin` dashboard, exposing only anonymized aggregates (no PII, no raw per-session rows).

### Modified Capabilities
_None._ This is a new read surface. It does not change `analytics-event-store`'s requirements (the schema and write path are unchanged — this only reads what that store already persists) nor `admin-access-gate`'s (the gate and `noindex`/robots behavior are unchanged — this only fills the shell the gate already protects).

## Impact

- **New files:** `lib/analytics/reports.ts` (+ test); `components/admin/*` (report card/table/trend components + SSR tests).
- **Modified files:** `app/admin/page.tsx` (fill the shell — fetch reports and render them, replacing `AdminDashboardShell`'s placeholder body); `components/AdminDashboardShell.tsx` (host the real reports, or be superseded by the new admin components); `README.md` (Admin access note → what the dashboard shows); optionally `docs/data-model.md` (F9-reports→schema mapping).
- **No new dependencies** (reuses `@neondatabase/serverless` already in the store; no chart library), **no new environment variables** (reuses `DATABASE_URL`), **no schema changes**, **no new HTTP endpoint**.
- **No change to the public site** — all of this lives behind the owner-only `/admin` gate, dynamic and `noindex`, outside the public performance budget by design.
- **Depends on:** 7.4a (JOS-88, merged — the gate + shell) and 7.3 (JOS-72, Done — the store + schema). This story completes the Epic 7 admin dashboard.
