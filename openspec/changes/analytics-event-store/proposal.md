## Why

The site can't yet measure whether it works — no page views, engagement depth, or conversions are recorded anywhere (PRD §5 F8, §10.2–10.4). Epic 7's three stories all depend on a persistence layer that doesn't exist: this is the **first database, first persistence, and first public-write endpoint in the entire repo**. Building it first unblocks 7.1 (cookieless baseline) and 7.2 (event tracking), which become thin instrumentation once the store and endpoint exist.

## What Changes

- Provision **Vercel Postgres (Neon)** and define the two-table schema — `VisitSession` and `AnalyticsEvent` — exactly per `docs/data-model.md`, with **anonymity by schema**: no column can hold a raw IP, User-Agent string, email/name, or free-text visitor input. `question_asked` has no content field at all.
- Add `POST /api/events`: a public, Zod-validated, rate-limited endpoint that accepts a client-supplied opaque session id + an event, **derives** the non-identifying dimensions (`countryOrRegion`, `referrerDomain`, `deviceClass`) server-side from request headers while **discarding the raw IP / UA / referrer path**, sets `occurredAt` server-side, upserts the `VisitSession`, and inserts the `AnalyticsEvent`.
- Add an injectable `AnalyticsStore` interface with a real Vercel-Postgres implementation and an in-memory fake, so the route/validation/anonymization logic is fully unit-testable with **no live DB** — mirroring `lib/chat/rateLimit.ts`'s injectable-store pattern from JOS-64.
- Reuse the existing `checkRateLimit` + Upstash rate limiter (already wired for `/api/chat`) to throttle the public write endpoint.
- Record the now-resolved Epic 7 decisions in `docs/data-model.md`'s "Open Items (TBD)" section (docs are the source of truth, CLAUDE.md §7): DB = Vercel Postgres, dimensions = all three, retention = 180 days, session attribution = in-memory per-tab UUID (cookieless, fingerprint-free), topology = first-party only.
- **Out of scope**: the client `track()` helper + `page_view`/`section_reach` instrumentation (7.1, JOS-70), the interaction event tracking (7.2, JOS-71), the footer privacy note (7.1's deliverable), a retention cleanup job (future), and the F9 admin dashboard (JOS-73). The schema must not *preclude* the dashboard's future aggregations, but no queries are built here.

## Capabilities

### New Capabilities
- `analytics-event-store`: the first-party persistence layer — the anonymized event schema, the `POST /api/events` write endpoint with its validation and server-side anonymization, and the injectable store.

### Modified Capabilities
_None._ All new files; reuses `lib/chat/rateLimit.ts`'s exports without modifying them.

## Impact

- **New files**: `lib/analytics/schema.ts` (Zod event schema + `eventType` enum), `lib/analytics/derive.ts` + test (pure header→dimension anonymization helpers), `lib/analytics/store.ts` + test (interface + Vercel-Postgres impl + in-memory fake), `lib/analytics/schema.sql` (or an init step) for the two tables, `app/api/events/route.ts` + test.
- **Modified files**: `docs/data-model.md` (resolve the TBD open items), `README.md` (DB provisioning + 180-day retention ops note), `.env.local` (placeholder `POSTGRES_*`), `.gitignore` if any new local artifact needs it.
- **New dependency**: `@neondatabase/serverless` (lightweight, direct parameterized SQL — no ORM/migrations framework for a two-table model; swapped in for the originally-proposed `@vercel/postgres`, which npm flags as deprecated in favor of this package — see design.md Decision 1).
- **New environment variables**: `POSTGRES_*` / `DATABASE_URL` (whatever the Neon connection string requires), local in `.env.local` (gitignored) + Vercel project env for production.
- **⚠️ Stale doc flagged**: `docs/api-spec.yml` is the old unrelated LTI project's spec — the OpenAPI DoD line is handled in `design.md`, not by extending that file.
