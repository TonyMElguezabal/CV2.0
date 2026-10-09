# Step 11 Report (follow-up) — 11.4 and 11.6, deferred on 2026-10-06

- Date: 2026-10-08
- Change: disruptive-footer (JOS-191)
- Agent: Claude (opsx:apply)

The 2026-10-06 report deferred 11.4 and 11.6 "live," reasoning each request
would count against the real production Upstash limiter / write to the live
DB. Running them found that reasoning was based on an incorrect assumption
— see below.

## 11.4 — rate-limit loop

**Finding: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in
`.env.local` are both empty strings** (`KEY=` with nothing after `=`) —
not live credentials. There is no production Upstash instance configured
in this local environment at all, so the 2026-10-06 concern about "each
request counting against the production limiter" did not apply.

- Started a fresh `next dev` (killing a stale Tuesday-session server
  first, confirmed still running on port 3100 despite that report saying
  "all were stopped"), with a test `WHATSAPP_NUMBER` on the command line.
- Looped 12 requests (24 real HTTP calls — the loop checks status and
  headers separately) against `GET /go/whatsapp`. All returned `302`, none
  `429`.
- Dev server log showed why: `[Upstash Redis] Unable to find environment
  variable: UPSTASH_REDIS_REST_URL` / `_TOKEN` on every request —
  `checkRateLimit`'s try/catch (`lib/chat/rateLimit.ts`) caught the
  resulting error and failed open, exactly as designed and as
  `README.md`'s "Chatbot operations" section already documents ("Without
  these, the rate limiter fails open").
- This is not specific to the WhatsApp route — `/api/chat` reuses the same
  `createUpstashRateLimitStore()`/`checkRateLimit` pair, so it fails open
  identically in this environment right now.
- **The live 429 path cannot be exercised end-to-end in this local
  environment** because there is no real limiter backing it. It remains
  covered by `app/go/whatsapp/route.test.ts`'s injected fake store (task
  3.1), which does assert the `429`/no-`Location` behaviour.
- **Owner follow-up worth knowing about independent of this change:** if
  production (Vercel) also lacks real Upstash credentials, both `/api/chat`
  and `/go/whatsapp` are rate-limit-free in production today, by the same
  fail-open design. Worth confirming the production env vars are actually
  set, since the code's fail-open behavior means a missing credential
  produces no visible error, just silently unlimited access.

## 11.6 — `POST /api/events` with `contactTarget: "whatsapp"`

- **With `DATABASE_URL` configured** (the real one in `.env.local`):
  `POST /api/events` with `{"contactTarget":"whatsapp", ...}` returned
  `500`. Expected: the live `analytics_event_contact_target_check` CHECK
  constraint still only allows the original three targets —
  `lib/analytics/migrations/2026-10-disruptive-footer-contact-targets.sql`
  is written but, per its own header and task 2.6, applied by the owner
  only, never by the agent. Postgres rejects the insert at the constraint,
  so no row was written and no cleanup was needed.
- **With `DATABASE_URL` unset**: `POST /api/events` returned `500`
  ("fails cleanly (5xx) rather than crashing the site," matching
  `README.md`'s "Analytics store" section). Note: task 11.6's phrase "the
  endpoint's documented no-store behaviour" doesn't match anything in this
  endpoint's actual spec/design — no-store/`X-Robots-Tag` headers are a
  `/go/whatsapp`-specific requirement (design.md Decision 7), and
  `/api/events`'s 500 response carries the standard security headers only,
  no `Cache-Control`. Flagging as a likely task-wording echo from the
  WhatsApp route rather than a missed implementation — nothing in
  design.md or the `engagement-event-tracking`/`whatsapp-contact-redirect`
  specs asks `/api/events` for a no-store header.
- **The `whatsapp`/`github` success path (2xx, then delete by `sessionId`)
  remains blocked until the owner runs the migration** against the live
  Neon database. Covered today only by the Zod schema unit tests
  (`EventPayloadSchema` accepting `github`/`whatsapp`, task 2.1).

## Cleanup

- All test dev servers (ports 3100, 3110, 3111) stopped.
- `.env.local` was never written to.
- No database rows were created (constraint rejection prevented the insert
  both times events were posted).

## Outcome

- 11.4: **executed**, confirms fail-open behavior in this environment;
  the actual 429 path remains test-only pending real Upstash credentials.
- 11.6: **executed**, confirms the documented fail-cleanly 500 without a
  DB, and confirms the migration gate is still in effect against the live
  constraint (expected, not a bug).
