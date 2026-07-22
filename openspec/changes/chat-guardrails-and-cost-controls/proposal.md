## Why

`POST /api/chat` is a public, unauthenticated endpoint that calls a paid LLM API on every request. Nothing currently stops a single visitor (or a script) from sending unlimited requests, so there is no protection against runaway provider cost — the exact risk PRD §12 calls out ("Public chat endpoint abused → Runaway API cost"). Two of the PRD §7 guardrail values are already enforced as a side effect of other stories (input length, output tokens); the missing piece is request-rate limiting and the fallback UX for it.

## What Changes

- Add per-IP rate limiting (10 messages / 5 minutes) and a best-effort per-session cap (20 messages) to `POST /api/chat`, backed by Upstash Redis (serverless-safe; the endpoint runs on the Node runtime, not edge, so an external store is required regardless).
- A rate-limited request gets a clean, non-streamed `429` response carrying a polite fallback message and the site's contact links, instead of attempting generation.
- `lib/chat/streamChat.ts`'s error handling changes from throwing a generic `Error` to a typed/structured error that carries the HTTP status, so the widget can distinguish "rate limited" from other failures.
- `ChatWidget` renders a specific rate-limit fallback message (with contact links) instead of its existing generic error message when a request is rejected for rate limiting.
- Document the two guardrail values that are **already implemented** as a byproduct of prior stories (500-char input cap in the request schema; ~400-token output cap in the OpenAI provider) with an explicit regression test each — no behavior change there, just closing the test gap.
- Document the monthly provider-spend alarm as a manual, one-time provider-console setup step (OpenAI usage limit/alert) — this is operational configuration, not application code, and is not part of this change's testable surface.
- **Out of scope:** multi-turn conversation memory (the widget already sends only the current question per request — "in-browser only" memory is trivially satisfied by sending nothing server-side; no change needed) and any outage/degradation detection (story 5.5) — though the rate-limit fallback UI is built so 5.5 can reuse the same "polite message + contact links" presentation later.

## Capabilities

### New Capabilities
- `chat-guardrails-and-cost-controls`: per-IP and per-session rate limiting on `POST /api/chat`, the output-token cap, and the input-length cap (already-implemented, now specified and regression-tested).

### Modified Capabilities
- `chat-widget-entry-point`: the existing "Streamed answer and citations are rendered" requirement's generic "Request fails" scenario is narrowed to exclude rate-limit (429) responses, which now get their own specific fallback-message scenario.

## Impact

- **New files**: `lib/chat/rateLimit.ts` (+ test) — rate limiter with an injectable store interface (unit tests use a fake, never live Upstash).
- **Modified files**: `app/api/chat/route.ts` (rate-limit check before generation; 429 response shape), `lib/chat/streamChat.ts` (typed error carrying HTTP status), `components/ChatWidget.tsx` + `ChatWidgetStyles.ts` (rate-limit-specific fallback rendering), `package.json` (`@upstash/ratelimit`, `@upstash/redis`).
- **New dependencies**: `@upstash/ratelimit`, `@upstash/redis`.
- **New environment variables**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (local `.env.local`, gitignored; Vercel project env for production).
- **No change** to the SSE token/citation/done contract (`streamed-chat-answers` spec is untouched) — rate limiting is checked before any retrieval/generation begins.
