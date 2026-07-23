## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-72-73-first-party-analytics-data-store` (Linear-provided branch name for JOS-72) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: this is the FIRST database + HTTP-write
endpoint in the repo. Unlike prior frontend stories, the DoD's
"Input/output validation (Zod)" and "OpenAPI documentation" lines are REAL
work here. There is still no local database in `npm test` — per this
repo's convention (see lib/chat/rateLimit.ts + streamGroundedAnswer), unit
tests use an INJECTED in-memory fake store and pure derive helpers, with NO
live DB/network calls. The live Postgres path is exercised only in a
manual/owner verification step gated on real POSTGRES_* credentials (same
shape as JOS-64's Upstash gap). Applicable gates: TDD unit tests, `npx
vitest run`, `npx tsc --noEmit`, `npm run validate:content` (a doc/content
file changes), `npm run lint` (broken repo-wide, same skip as prior
changes), curl verification of POST /api/events against a running dev
server (persistence assertion only if DB credentials are available), all
agent-executed.
-->

## 1. Dependencies and environment

- [x] 1.1 Add `@neondatabase/serverless` to `package.json` (swapped in for the originally-proposed `@vercel/postgres`, which npm flags as deprecated — see design.md Decision 1)
- [x] 1.2 Add a placeholder `DATABASE_URL` connection var to `.env.local` (gitignored) with a comment that a real value requires provisioning a Neon/Vercel Postgres database; note that without it the endpoint's live persistence path is unavailable but the unit tests (injected fake) are unaffected

## 2. Event schema + validation (TDD, pure — the single source of truth)

- [x] 2.1 Write failing tests in `lib/analytics/schema.test.ts`: the `eventType` enum contains exactly the six values from `docs/data-model.md` (`page_view`, `section_reach`, `chat_open`, `question_asked`, `resume_download`, `contact_click`); the request-payload Zod schema accepts a minimal valid `page_view`, requires `sectionId` for `section_reach`, requires `contactTarget ∈ {scheduling,email,linkedin}` for `contact_click`, bounds `scrollDepthPercent` to an int 0–100, rejects unknown `eventType`, rejects over-long `pagePath`/`sectionId`, and has **no field** that accepts question/message text
- [x] 2.2 Implement `lib/analytics/schema.ts`: the `EventType` enum/union, the `EventPayloadSchema` (client-supplied fields only — session id, eventType, pagePath, and the conditional sectionId/scrollDepthPercent/contactTarget), and the `StoredEvent` type (payload + server-derived dimensions + server `occurredAt`). Deliberately omit any content/text/IP/UA field
- [x] 2.3 Run `npx vitest run lib/analytics/schema.test.ts` and confirm all cases pass

## 3. Server-side anonymization helpers (TDD, pure — where "no PII" is proven)

- [x] 3.1 Write failing tests in `lib/analytics/derive.test.ts`: `countryFromHeaders` returns the `x-vercel-ip-country` value (and a safe fallback like `null`/`"unknown"` when absent) and never returns anything resembling an IP; `referrerDomainFromHeaders` reduces a full referrer URL to its host only (drops path/query) and handles missing/invalid referrers; `deviceClassFromUserAgent` maps representative mobile/tablet/desktop UA strings to exactly `mobile`/`tablet`/`desktop` and never returns the raw UA
- [x] 3.2 Implement `lib/analytics/derive.ts` with those three pure functions — each takes only what it needs (a headers object / UA string) and returns a low-cardinality derived value; no raw IP/UA/referrer-path is ever returned or logged
- [x] 3.3 Run `npx vitest run lib/analytics/derive.test.ts` and confirm all cases pass

## 4. Injectable store (TDD)

- [x] 4.1 Write failing tests in `lib/analytics/store.test.ts` using the in-memory fake: `recordEvent` on a new session id creates a `VisitSession` (with `startedAt`/`lastEventAt`) and inserts the event; a second `recordEvent` with the same session id updates `lastEventAt` and does not create a duplicate session; the stored records contain only the modeled fields (no IP/UA/text)
- [x] 4.2 Implement `lib/analytics/store.ts`: the `AnalyticsStore` interface (`recordEvent(event: StoredEvent): Promise<void>`), `createInMemoryAnalyticsStore()` (exported for tests, mirroring `rateLimit.ts`'s fake), and `createNeonAnalyticsStore()` (real impl using `@neondatabase/serverless`'s `sql\`\`` tagged template — parameterized only, no string interpolation; upsert the session then insert the event). Add `lib/analytics/schema.sql` defining the two tables per `docs/data-model.md` (opaque string session PK, auto-increment event PK, FK, UTC timestamps, the enum-constrained `eventType`, the optional/conditional columns, the three dimension columns), applied once at provisioning
- [x] 4.3 Run `npx vitest run lib/analytics/store.test.ts` and confirm all cases pass

## 5. `POST /api/events` endpoint (TDD)

- [x] 5.1 Write failing tests in `app/api/events/route.test.ts` (following `app/api/chat/route.test.ts`'s mocking pattern — inject a fake `AnalyticsStore` and a fake rate-limit store): (AC1) a valid event returns 2xx and calls the fake store's `recordEvent` once with the right shape; (AC2/no-PII) the recorded event carries the server-derived dimensions and no raw IP/UA/text; (AC3) a `question_asked` payload with an extra `text`/`question` field does not land any content on the stored event; unknown `eventType` and missing conditional fields return 4xx with no `recordEvent` call; malformed JSON returns 4xx; `occurredAt` is server-set even if the client sends one; a rate-limited request returns without persisting; the limiter failing open still allows the event
- [x] 5.2 Implement `app/api/events/route.ts` (`export const runtime = "nodejs"`): parse + `EventPayloadSchema`-validate the body (4xx on failure); check `checkRateLimit` (reuse `createUpstashRateLimitStore` from `lib/chat/rateLimit.ts`, per-IP via `x-forwarded-for`, fail-open); derive the three dimensions from headers via `lib/analytics/derive.ts`; set `occurredAt` server-side; call the store's `recordEvent`; return a lightweight 2xx (204 or tiny ack). Construct the real `createNeonAnalyticsStore()` only at request time
- [x] 5.3 Run `npx vitest run app/api/events/route.test.ts` and confirm all cases pass

## 6. Documentation

- [x] 6.1 Update `docs/data-model.md`'s "Open Items (TBD)" section: move the five now-resolved items to resolved — DB = Neon (Vercel Marketplace integration), dimensions = `countryOrRegion` + `referrerDomain` + `deviceClass` (all derived server-side, raw IP/UA never stored), retention = 180 days, session attribution = client-supplied in-memory per-tab UUID (cookieless, fingerprint-free; session = page-load-until-reload), topology = first-party only. Also fill the `**TBD dimensions**` note in the `AnalyticsEvent` field list now that all three are decided
- [x] 6.2 Update `README.md`: add an "Analytics store" note (sibling to the existing "Chatbot operations" section from JOS-64) documenting the one-time Neon database provisioning + applying `lib/analytics/schema.sql` + setting `DATABASE_URL`, and the 180-day retention intent (cleanup job is a future story)
- [x] 6.3 Replace `docs/api-spec.yml` (currently the stale, unrelated LTI project's spec) with a fresh minimal OpenAPI documenting the real `POST /api/events` (request schema, 2xx/4xx/429 responses) and the previously-undocumented `POST /api/chat` — satisfying the DoD "OpenAPI documentation" line honestly and removing the misleading stale artifact (per design.md Decision 7)

## 7. Full verification (agent executes all of this itself)

- [x] 7.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 7.2 Run `npx tsc --noEmit` clean
- [x] 7.3 Run `npm run validate:content` clean
- [x] 7.4 Run `npm run lint` — expect the same pre-existing repo-wide failure (missing `eslint.config.mjs`); skip with the same rationale unless it has since been fixed
- [x] 7.5 Started the dev server and curled `POST /api/events`: unknown `eventType` → 400, malformed JSON → 400, both confirmed with no `recordEvent` call (per the unit tests). The valid `page_view` request validated and passed rate limiting (fail-open, no `UPSTASH_*` configured, same pre-existing gap as `/api/chat`) but returned 500 at `createNeonAnalyticsStore()` because no real `DATABASE_URL` is configured — this is the documented fail-clean behavior (design.md risk mitigation: "the endpoint fails cleanly (5xx) without credentials rather than crashing the site"), not a bug. Live persistence against a real Neon database remains an **owner follow-up** once `DATABASE_URL` is provisioned (cannot fabricate DB credentials); the injected-fake unit tests (`store.test.ts`, `route.test.ts`) are the authoritative gate — same pattern as JOS-64's Upstash gap
- [x] 7.6 Stopped the dev server; confirmed no stray processes left running

## 8. OpenSpec sync

- [x] 8.1 After merge, sync `specs/analytics-event-store/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
