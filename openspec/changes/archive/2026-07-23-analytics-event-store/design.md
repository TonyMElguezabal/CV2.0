## Context

The repo has no database, no ORM, and no analytics — only one API route (`/api/chat`). Everything ships as static content + React + a single serverless function. This change introduces the first persistence layer. `docs/data-model.md` already specifies the target model in detail (`VisitSession` 1-→∞ `AnalyticsEvent`, anonymity-by-schema, an `eventType` enum, per-event validation rules) and lists five open items, all resolved with the owner during enrichment: DB = Vercel Postgres, dimensions = all three, retention = 180 days, session attribution = in-memory per-tab UUID, topology = first-party only.

Two prior-art patterns from JOS-64 (`lib/chat/`) are directly reusable: `rateLimit.ts`'s injectable-store-with-fake (for no-live-network unit tests) and `session.ts`'s in-memory `crypto.randomUUID()` session id (for cookieless attribution — though the *client* session generation belongs to 7.1; this story's server just accepts and upserts it).

## Goals / Non-Goals

**Goals:**
- A working, anonymized, rate-limited `POST /api/events` + Postgres store that 7.1/7.2 can emit into.
- "No PII" provable by construction: the schema has no column for identity/UA/IP/message text, and the anonymization helpers are pure and unit-tested.
- Full unit-testability with no live DB, matching the repo convention.

**Non-Goals:**
- Client instrumentation (`track()`, `page_view`, `section_reach`, interaction events) — 7.1/7.2.
- The footer privacy note — 7.1's deliverable.
- A retention cleanup job — future; the schema just doesn't preclude it (`occurredAt` is indexable).
- F9 dashboard queries — JOS-73; the schema must *support* them but this change builds none.
- Server-minted session ids — deliberately excluded (see Decision 3).

## Decisions

### 1. `@neondatabase/serverless` with tagged-template SQL, not an ORM
Two tables and a handful of queries don't justify Prisma's schema-file + client-generation + migration weight, or Drizzle's config layer. `@neondatabase/serverless` gives the `sql\`...\`` tagged template that parameterizes automatically (no manual escaping, no injection surface), same shape as `@vercel/postgres`'s API. The schema is a single `lib/analytics/schema.sql` applied once at provisioning (documented as an ops step), not a migrations framework.
- *Package swap during implementation:* `@vercel/postgres` (originally chosen here) is npm-deprecated — Vercel migrated existing Vercel Postgres databases to Neon as a native integration and points new setups at `@neondatabase/serverless` (or another Marketplace option). Confirmed with the owner during implementation; swapped before writing any store code. The API is a drop-in equivalent (`neon(...)` returns the same `sql` tagged-template function), so this doesn't change Decisions 2–7 below.
- *Alternative considered:* Prisma. Rejected — heavy for two tables, adds a codegen build step and a migration runtime to a repo that deliberately has no backend framework (PRD §8 "deliberately minimal").
- *Alternative considered:* Drizzle. Rejected for now — good type-safety story but still adds a config/kit layer; revisit only if the query surface grows (F9).

### 2. Anonymization happens server-side from headers; the client sends none of it
`countryOrRegion`, `referrerDomain`, `deviceClass` are **derived on the server** from `x-vercel-ip-country`, `referer`, and `user-agent` request headers, then the raw inputs are dropped — the raw IP, full UA string, and referrer path/query are **never stored and never logged**. The client's event payload carries only the session id and the event's own fields (type, pagePath, sectionId, etc.), never dimensions or timestamps. This is the single most important privacy property, and it lives in pure helpers (`lib/analytics/derive.ts`: `countryFromHeaders`, `referrerDomainFromHeaders`, `deviceClassFromUserAgent`) that are unit-tested exhaustively — "no PII" is proven at the function level, not asserted in prose.
- `deviceClass` maps UA → exactly `mobile | tablet | desktop` (3 buckets); it is stored as its own low-cardinality column, never combined with the others into a composite key.

### 3. The server accepts a client-supplied session id; it never mints one
Session attribution must be cookieless *and* fingerprint-free. The client generates an opaque random `crypto.randomUUID()` per tab (7.1, reusing `session.ts`'s pattern) and sends it with each event; the server upserts a `VisitSession` on that id. If the server minted the id instead, it would have to correlate requests by IP/UA/timing — which is exactly the fingerprinting the model forbids. Consequence, documented honestly: a "session" is a page-load-until-reload window (a reload yields a new id). That's an acceptable, privacy-preserving definition for the engagement metrics (§10.2) this feeds.

### 4. `occurredAt` is server-set; timestamps are never trusted from the client
The endpoint sets `occurredAt = now()` (UTC) server-side. A client-supplied timestamp is ignored — it's untrusted input and irrelevant (the beacon fires at event time anyway). Same principle already applied to the chat rate limiter.

### 5. Injectable `AnalyticsStore`, real impl constructed only at request time
`AnalyticsStore` is an interface (`recordEvent(event: StoredEvent): Promise<void>`, upserting the session and inserting the event). `createVercelPostgresStore()` builds the real one; an in-memory fake (`createInMemoryAnalyticsStore()`) backs unit tests. The route depends on the interface; `route.test.ts` injects the fake and asserts validation, server-set `occurredAt`, derived dimensions, session upsert, unknown-`eventType` rejection, and that `question_asked` has no content path. Exactly mirrors `rateLimit.ts`'s `RateLimitStore` + fake. No live DB in `npm test`.

### 6. Rate limiting reuses the existing chat limiter
`POST /api/events` is public and writes to a DB — a spam/cost vector worse than chat (no LLM cost, but unbounded row inserts). Reuse `checkRateLimit` + `createUpstashRateLimitStore` from `lib/chat/rateLimit.ts`, per-IP (and optionally per-session), fail-open on limiter error (same as `/api/chat`). No new limiter code.

### 7. OpenAPI DoD line: document the real endpoints, don't extend the LTI file
`docs/api-spec.yml` is the old LTI project's spec (candidates/positions) — unrelated stale content (same provenance CLAUDE.md §9 flags for the standards docs). **Decision:** replace it with a fresh minimal OpenAPI documenting the two real endpoints (`POST /api/events` now; `POST /api/chat`, never previously documented, folded in since we're here). This satisfies the DoD line honestly and removes a misleading stale artifact, rather than the prior chatbot stories' "treat as N/A" workaround.

## Risks / Trade-offs

- **[Risk]** A public write endpoint invites abuse (row-flooding, cost). → **Mitigation:** rate limiting (Decision 6) + Zod validation rejecting malformed/over-long payloads + a bounded schema (no free-text columns to bloat).
- **[Risk]** With all three dimensions captured, `country + referrer + device + timestamp` could theoretically narrow identity on a high-traffic site. → **Mitigation:** for a low-traffic personal profile this is negligible; more importantly, each dimension is low-cardinality and independent, no raw IP/UA is retained, and no field ties to identity — the schema can't reconstruct a person even in principle.
- **[Risk]** Provisioning a real Postgres is an out-of-band step; without credentials the endpoint can't persist. → **Mitigation:** like JOS-64's Upstash gap, the injected in-memory fake is the authoritative unit-test gate; the live path is a documented owner/agent verification step gated on `POSTGRES_*` being set. The endpoint fails cleanly (5xx) without credentials rather than crashing the site (analytics is fire-and-forget; a failed beacon never affects the page).
- **[Trade-off]** Server-derived dimensions mean the endpoint must run on the Node runtime with header access (not static) — consistent with `/api/chat` already being `runtime = "nodejs"`.

## Migration Plan

One-time manual provisioning: create a Vercel Postgres database, apply `lib/analytics/schema.sql`, set `POSTGRES_*` in `.env.local` (local) and the Vercel project env (production) — mirrors how `OPENAI_API_KEY`/Upstash were provisioned. Then implement per `tasks.md` → `npm test` / `tsc` / `validate:content` clean → live smoke-test `POST /api/events` against the real DB if credentials are available → merge. Rollback is a plain revert; the new table can be dropped (it holds only anonymized analytics, nothing the site reads to render).

## Open Questions

- None blocking. All five prior open items are resolved (recorded into `docs/data-model.md` as part of this change).
