## Context

`POST /api/chat` (`app/api/chat/route.ts`) is public, unauthenticated, runs on the Node runtime (`export const runtime = "nodejs"` — `loadIndex()` uses `node:fs`, so it cannot move to edge), and calls the OpenAI API on every valid request. Two PRD §7 guardrail values already exist as side effects of prior stories:
- Input is already capped at 500 chars by the request Zod schema (`RequestSchema = z.object({ question: z.string().trim().min(1).max(500) })`).
- Output is already capped at `max_completion_tokens: 400` in `lib/rag/providers/openai.ts`, on both `generate()` and `generateStream()`.

Nothing limits *request rate*. There is no rate-limiting code anywhere in the repo, and no cookies/session concept exists (PRD §9 privacy — cookieless by design). The client (`lib/chat/streamChat.ts`) currently throws a single generic `Error` on any non-2xx response; `ChatWidget` catches it into one generic inline message.

## Goals / Non-Goals

**Goals:**
- Stop unbounded request volume from driving runaway provider cost (PRD §12).
- Give a rate-limited visitor a clear, polite explanation with a way to still reach out (contact links) instead of a broken/generic error.
- Keep the limiter's storage swappable/fake-injectable for tests, matching this repo's established pattern (`LlmProvider`, `streamGroundedAnswer`'s injected fakes).
- Close the test gap on the two guardrails that already work (input cap, output cap) without touching their implementation.

**Non-Goals:**
- Multi-turn conversation memory ("last 6 turns, in-browser only") — the widget already sends only the current question per request; there is no server-side memory to bound, so this PRD line is already satisfied by the current stateless design. Not touched.
- Outage/degradation detection and messaging (story 5.5, JOS-66) — not built here. The rate-limit fallback UI is deliberately generic ("polite message + contact links") so 5.5 can reuse the same presentation for a different trigger (provider outage) later, but 5.5's detection logic is out of scope.
- The monthly provider-spend alarm — this is OpenAI-console configuration (a usage limit/alert), not application code. Documented as a manual setup step; not part of this change's tests.
- True per-user identity or auth — the per-session cap is explicitly best-effort (see Decision 3).

## Decisions

### 1. Upstash Redis as the rate-limit store
Serverless function instances don't share memory and don't persist between cold starts, so an in-process counter is not a real limit — a second concurrent instance (or a redeploy) resets it. An external store is required regardless of runtime. **Upstash Redis** (`@upstash/ratelimit` + `@upstash/redis`) is chosen: REST-based (works from the Node runtime without a persistent connection), has a sliding-window algorithm out of the box matching the PRD's "10 messages / 5 minutes", and its free tier comfortably fits the <$50/mo budget (§10.6) for this traffic profile.
- *Alternative considered:* Vercel KV — equivalent shape, Vercel-native. Rejected only for concreteness; either would satisfy the requirement. Upstash chosen per owner decision.
- *Alternative considered:* in-memory `Map` — rejected, doesn't survive cold starts or horizontal scaling; not a real limit.

### 2. Injectable rate-limit interface, not a direct Upstash import in the route
`lib/chat/rateLimit.ts` defines a small interface (e.g. `RateLimitStore` with a `check(key: string): Promise<{ allowed: boolean; remaining: number }>`-shaped contract) and a factory that wires the real Upstash client. `app/api/chat/route.ts` depends on the interface. Unit tests inject an in-memory fake — **no live Redis calls in `npm test`**, matching how `generateGroundedAnswer`/`streamGroundedAnswer` take an injected `LlmProvider`/embeddings client rather than constructing `OpenAI` internally.
- *Alternative considered:* call `@upstash/ratelimit` directly in the route handler. Rejected — makes the guardrail logic untestable without live network calls, violating the repo's established fake-injection testing convention.

### 3. Per-IP is authoritative; per-session is best-effort
Per-IP (10 / 5 min) is enforced server-side via `x-forwarded-for` (Vercel) — this is the real abuse control. Per-session (20 messages) has no server-side identity to key on (no cookies, PRD §9) — solving this properly would mean adding a session mechanism the PRD explicitly avoids. Instead: `ChatWidget` generates an opaque random token once (e.g. `crypto.randomUUID()`, held in memory only — not persisted, matching "nothing persisted server-side") and sends it with each request; the server keys a second Upstash counter on it. This is **spoofable** (a visitor can refresh state by reloading) and is documented as a best-effort secondary control layered on top of the authoritative per-IP limit, not a security boundary.
- *Alternative considered:* skip per-session entirely, rely on per-IP only. Rejected — the AC explicitly asks for it, and it's cheap to add given the same rate-limit primitive already exists for per-IP.

### 4. 429 with a typed client-side error, not a special SSE event
A rate-limited request never starts generation, so there's nothing to stream — the endpoint returns a plain **429 JSON response** (`{ error: "rate_limited", message: "...", contact: { email, scheduling } }`, reusing `profile.contact` shape from `lib/content/schemas.ts`'s `ProfileContactSchema`) rather than opening an SSE stream. `lib/chat/streamChat.ts` changes from `throw new Error(...)` to a typed error carrying the HTTP status (e.g. a small `ChatRequestError extends Error` with a `status: number` field), so `ChatWidget` can branch: `status === 429` → render the specific rate-limit message + contact links; anything else → keep the existing generic message.
- *Alternative considered:* encode the rejection as a special `event: rate_limited` SSE frame to stay within the existing stream contract. Rejected — adds a new event type to the `streamed-chat-answers` contract for a case that never touches generation; a plain 429 is simpler and doesn't touch that spec at all.

## Risks / Trade-offs

- **[Risk]** Upstash outage or misconfiguration could make the rate limiter itself a single point of failure, blocking all chat. → **Mitigation:** the limiter check fails open on a store error (log and allow the request through) rather than fail closed — a rare limiter hiccup should not take down the whole feature; the PRD's resilience principle (§9: "site fully functional with chat unavailable" applies to the *chat*, not that a limiter bug should block it entirely).
- **[Risk]** Per-session cap is trivially bypassed (new tab/reload gets a new token). → **Mitigation:** already scoped as best-effort in Decision 3; the per-IP limit is the real backstop.
- **[Risk]** New external dependency (Upstash) and two new env vars add operational surface (another account/credential to manage). → **Mitigation:** REST-only client, no infra to run; free tier; credentials follow the existing `.env.local`/Vercel-env pattern already used for `OPENAI_API_KEY`.
- **[Trade-off]** The budget alarm isn't code, so this change can't "prove" it in CI — documented as a manual one-time step instead of a test, and called out explicitly rather than silently skipped.

## Migration Plan

No data migration. Requires a one-time manual step before this can work in any deployed environment: create an Upstash Redis database and set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` in `.env.local` (local) and the Vercel project's environment variables (production) — mirrors how `OPENAI_API_KEY` is already provisioned per CLAUDE.md §8. Rollback is a plain revert; no schema/state to unwind.

## Open Questions

- None blocking. Store choice (Upstash) and memory-statelessness were confirmed by the owner during enrichment/proposal.
