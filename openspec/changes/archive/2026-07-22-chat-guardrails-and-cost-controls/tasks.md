## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-64-53-chat-guardrails-and-cost-controls` (Linear-provided branch name for JOS-64) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with prior changes on this repo, there
is no database, so database-state steps from
docs/openspec-tasks-mandatory-steps.md don't apply. This change DOES modify
an existing HTTP endpoint (POST /api/chat gains a 429 path), so manual
curl-based verification is applicable here (unlike the frontend-only
chat-widget-entry-point change) — but only runnable if live Upstash
credentials are configured locally; if not available, this step is
documented as a manual owner step rather than skipped silently. Applicable
mandatory gates: TDD unit tests (fake rate-limit store, no live network),
`npx vitest run`, `npx tsc --noEmit`, `npm run lint` (currently broken
repo-wide per the chat-widget-entry-point change — same skip applies),
curl verification of the 429 path (if credentials available), and
in-browser manual verification of the fallback UI via claude-in-chrome,
all agent-executed.
-->

## 1. Dependencies

- [x] 1.1 Add `@upstash/ratelimit` and `@upstash/redis` to `package.json`
- [x] 1.2 Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` placeholders to `.env.local` (gitignored) — **owner follow-up:** real values require an Upstash account (console.upstash.com); left blank for now, so task 7.4's live curl verification will be documented as deferred, not fabricated

## 2. `lib/chat/rateLimit.ts` — injectable rate limiter (TDD)

- [x] 2.1 Write failing tests in `lib/chat/rateLimit.test.ts` using an injected in-memory fake store: (a) allows requests while under the configured limit for a key, (b) rejects once a key reaches the limit within the window, (c) tracks per-IP and per-session keys independently (hitting one key's limit doesn't affect another key), (d) fails open (allows the request) when the store throws/errors, without an unhandled rejection
- [x] 2.2 Implement `lib/chat/rateLimit.ts`: a `RateLimitStore` interface (e.g. `check(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean }>`), a `checkRateLimit(store, key, limit, windowSeconds)` helper with the fail-open try/catch, and a factory `createUpstashRateLimitStore()` wiring `@upstash/ratelimit` + `@upstash/redis` from the env vars (only invoked at request time in the route, never in tests)
- [x] 2.3 Run `npx vitest run lib/chat/rateLimit.test.ts` and confirm all cases pass

## 3. Regression tests for already-implemented guardrails

- [x] 3.1 Add a test in `app/api/chat/route.test.ts` asserting a request with a `question` over 500 characters is rejected with a 4xx status before any retrieval/generation occurs (documents existing `RequestSchema.max(500)` behavior — no implementation change) — **already existed** from story 5.2c (`"returns 400 for an over-length question"`), no duplicate added
- [x] 3.2 Add a test in `lib/rag/providers/openai.test.ts` (new file) asserting both `generate()` and `generateStream()` request `max_completion_tokens: 400` from the OpenAI client (documents existing behavior — no implementation change)
- [x] 3.3 Run both tests and confirm they pass immediately (honest record: these are regression tests for pre-existing behavior, not new functionality) — 3/3 passed (1 pre-existing over-length test + 2 new provider tests)

## 4. Wire rate limiting into `POST /api/chat` (TDD)

- [x] 4.1 Write failing tests in `app/api/chat/route.test.ts` with an injected fake rate-limit store: (a) a request from an IP under the per-IP limit proceeds normally, (b) a request from an IP at/over the per-IP limit (10/5min) returns 429 with a JSON body containing a fallback message and `contact: { email, scheduling }`, without calling the embedding/generation dependencies, (c) same for the per-session limit (20 messages) keyed on a client-supplied session header, (d) a request with no session header still enforces the per-IP limit correctly
- [x] 4.2 Implement the route change: extract client IP from `x-forwarded-for`; extract session id from a request header (`x-chat-session-id`); call `checkRateLimit` for both per-IP (limit 10, window 300s) and per-session (limit 20, window 24h) before any retrieval/embedding/generation; on rejection, return a 429 JSON response with `contact: getProfile().contact`
- [x] 4.3 Run `npx vitest run app/api/chat/route.test.ts` and confirm all cases pass — 8/8 passed

## 5. `lib/chat/streamChat.ts` — typed error with HTTP status (TDD)

- [x] 5.1 Update `lib/chat/streamChat.test.ts`: replace/extend the existing "throws on non-ok response" test to assert the thrown error is a `ChatRequestError` (or equivalent) carrying `status: 429` for a 429 response, and carries the actual status for other non-2xx responses; add a test that `streamChat` sends a session-id header (a stable value across two calls, proving the token is generated once and reused, not regenerated per call)
- [x] 5.2 Implement: add `lib/chat/session.ts` exporting `getSessionId(): string` (lazily creates and caches one `crypto.randomUUID()` per browser session, in-memory only — never persisted, matching "nothing persisted server-side"); update `lib/chat/streamChat.ts` to send `x-chat-session-id: getSessionId()` on the fetch and to throw `ChatRequestError extends Error` carrying `status` instead of a generic `Error`
- [x] 5.3 Run `npx vitest run lib/chat/streamChat.test.ts` and confirm all cases pass — 6/6 passed

## 6. `ChatWidget` — rate-limit-specific fallback (TDD)

- [x] 6.1 Write failing tests in `components/ChatWidget.test.tsx`: (a) when `streamChat` rejects with a `ChatRequestError` whose `status` is 429, the widget renders a specific message stating the usage limit was reached, including visible contact links (email + scheduling), distinct from the existing generic error message; (b) when `streamChat` rejects with a non-429 error (or a plain `Error`), the existing generic message still renders unchanged (no regression)
- [x] 6.2 Implement in `components/ChatWidget.tsx`: branch on `error instanceof ChatRequestError && error.status === 429` to render the rate-limit fallback (message + `mailto:`/scheduling links); new `contact: ProfileContact` prop, threaded from `app/layout.tsx`'s `getProfile()`; added `chatContactLinksClass`/`chatContactLinkClass` to `ChatWidgetStyles.ts`; updated `ChatWidget.ssr.test.tsx` for the new required prop
- [x] 6.3 Run `npx vitest run components/ChatWidget.test.tsx` and confirm all cases pass — 11/11 passed; full suite 139/139, `tsc --noEmit` clean

## 7. Full verification (agent executes all of this itself)

- [x] 7.1 Run `npx vitest run` (full suite) and confirm no regressions — 139/139 passed, 30 files
- [x] 7.2 Run `npx tsc --noEmit` clean — no errors
- [x] 7.3 Run `npm run lint` — **skipped, pre-existing repo gap**: same missing `eslint.config.mjs` as the `chat-widget-entry-point` change; still absent, not introduced by this change
- [x] 7.4 **Owner follow-up — Upstash credentials not available locally** (placeholders only, per task 1.2), so the live 11-requests-triggers-429 curl check against real Upstash could not run; cannot fabricate credentials. Instead verified the specific failure mode that mattered most before shipping this without credentials configured: with `UPSTASH_REDIS_REST_URL`/`TOKEN` empty, `curl -X POST http://localhost:3000/api/chat -d '{"question":"Who is Jose?"}'` against the real dev server returned a normal `200` streamed answer — confirmed the fail-open path (design.md Decision/Risk 1) actually holds end-to-end, not just in the unit test, so an unconfigured deployment degrades to "no rate limiting" rather than "chat broken". The unit-tested rate-limit logic (§2, §4) remains the authoritative gate for the 429 behavior itself; real 429-triggering is deferred to the owner once an Upstash account exists
- [x] 7.5 Via claude-in-chrome against the dev server: opened the widget from the persistent trigger, selected a starter question ("What problems has he solved?"), confirmed it streamed a real grounded answer with citations through the new rate-limit-gated route — no regression to the working chatbot. Full 429 fallback UI (message + contact links) is unit-tested (§6) but not exercised live, for the same credential-availability reason as 7.4
- [x] 7.6 Stop the dev server; confirm no stray processes left running — confirmed, port 3000 free

## 8. Documentation

- [x] 8.1 Document the manual monthly budget-alarm setup step (OpenAI usage limit/alert in the provider console) in `README.md` or a short ops note — this is infra configuration, not a code deliverable, and has no automated test — added a new "Chatbot operations" section to `README.md` covering both the Upstash setup and the budget alarm

## 9. OpenSpec sync

- [x] 9.1 After merge, sync `specs/chat-guardrails-and-cost-controls/spec.md` and the `chat-widget-entry-point` delta into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
