## Context

`POST /api/chat` handles one outage shape cleanly today: missing `OPENAI_API_KEY` returns a 503 `{ error: "Service unavailable" }`. Two more are not handled at all:

1. **Pre-stream failure** — `await streamGroundedAnswer(...)` (the embedding call plus starting the LLM stream) is not wrapped in try/catch. If it throws, the exception propagates out of the route handler before any `Response` is constructed; Next.js returns a bare 500 with no JSON body.
2. **Mid-stream failure** — inside the `ReadableStream`'s `start()`, the `for await (const token of tokens)` loop is wrapped in try/finally, not try/catch. If the provider's stream throws partway through, the exception is swallowed; `finally` just closes the controller. No `citations`, `done`, or error signal is ever sent — the client sees a stream that simply ends, and `streamChat()`'s async generator finishes normally with no failure indication at all. The widget shows a truncated answer with no error message — worse than a clean failure, since nothing looks wrong.

From story 5.3 (merged), the infrastructure this change reuses already exists: `ChatRequestError` (`lib/chat/streamChat.ts`) carries an HTTP status; `ChatWidget` already branches on `error instanceof ChatRequestError && error.status === 429` to show a specific rate-limit message with contact links, falling back to one generic message otherwise. `route.ts` already has a `rateLimitedResponse()` helper that builds a `{ error, message, contact }` JSON response using `getProfile().contact`.

## Goals / Non-Goals

**Goals:**
- Every generation failure — before or during streaming — reaches the visitor as a clear "AI unavailable" message with contact links, never a raw crash or a silent truncation.
- Reuse the existing typed-error and contact-links infrastructure from 5.3; add one more branch, not a parallel system.
- Detection stays reactive (surfaced on the first failed send) — no new endpoint, no extra request per widget-open.

**Non-Goals:**
- AC2 (non-chat functionality keeps working during an outage) and AC3 (recovery without reload) need no new mechanism — the widget's existing non-modal, state-preserving design (5.1) already provides both. This change adds tests proving them, not new code for them.
- A proactive health-check endpoint — rejected in favor of reactive detection (see Decision 3).
- Retrying a failed generation automatically, or exposing retry-count/backoff UI — out of scope; the visitor's next manual submit is the retry path, same as any other message.

## Decisions

### 1. Pre-stream failures reuse the exact `rateLimitedResponse()`-shaped JSON, via a sibling helper
Wrap the `streamGroundedAnswer(...)` call in try/catch. On failure, return a 503 built the same way as `rateLimitedResponse()` — `{ error, message, contact: getProfile().contact }` — via a new `unavailableResponse()` helper in `route.ts`, not a copy-pasted literal. Both helpers now share the "clean JSON error response with contact info" shape; if a third failure mode ever needs this shape, that's the point to factor out a common builder — not yet, two call sites don't justify it.
- *Alternative considered:* let the missing-API-key branch and the new try/catch both build their own literal response bodies. Rejected — `rateLimitedResponse()` already proved the pattern; matching it keeps the three failure-response shapes (`rate_limited`, missing-key, generation-failure) visually and structurally consistent for anyone reading the route.

### 2. Mid-stream failures become a new `error` SSE event — a genuine extension to `streamed-chat-answers`
Inside the `ReadableStream`'s `start()`, wrap the token loop in try/catch (not just try/finally). On catch, `controller.enqueue(encoder.encode(formatSseEvent("error", { message: "..." })))` before closing — reusing the existing `formatSseEvent` encoder from `lib/rag/sse.ts` unchanged. This is a new event type in an existing, already-versioned stream contract (`streamed-chat-answers`), so it's a MODIFIED delta on that spec, not an internal-only change.
- *Alternative considered:* just close the stream cleanly on error, leaving the client to infer failure from an incomplete/missing `done` event. Rejected — that's exactly today's silent-truncation behavior; inferring failure from *absence* of a signal is fragile (a slow network could look the same) versus an explicit `error` event.
- *Alternative considered:* abort the underlying `Response` (e.g. `controller.error(...)`) instead of a clean SSE event. Rejected — that surfaces as a raw stream/network error on the client (`response.body` errors mid-read), which is harder to distinguish cleanly from an actual network failure and doesn't fit the existing `event:`/`data:` parsing path `streamChat` already has.

### 3. Client-side: an `error` SSE event becomes `ChatRequestError(503)` — one unavailable-message code path, not two
`lib/chat/streamChat.ts`'s `parseSseFrame` gets a new `case "error"`. Rather than introducing a second error type, the generator throws `new ChatRequestError(503)` when it sees this event — a mid-stream failure has no real HTTP status (headers were already sent as 200), but treating it as "503-shaped" lets `ChatWidget` reuse its *existing* branching (`error.status === 503` → unavailable message) without a third conditional path. The 503 value here is a semantic marker ("service unavailable"), not a literal transport-layer status.
- *Alternative considered:* a distinct `MidStreamError` class. Rejected — `ChatWidget` would need to branch on two types for the same user-facing outcome; reusing `ChatRequestError` with a synthetic status keeps one message path for one concept ("AI unavailable"), regardless of when it failed.

### 4. `ChatWidget`: a second specific branch, reusing the rate-limit message's rendering shape
Alongside the existing `error.status === 429` branch, add `error.status === 503` → a distinct "AI is temporarily unavailable — please try again shortly, or reach out directly" message, using the same `DisplayMessage.contact` field and mailto/scheduling link markup already built for the 429 case (just different copy). No JSX extraction — two call sites with slightly different text don't justify a new component; if a third status-specific message shows up later, that's the point to extract.
- *Alternative considered:* extract a shared `<ContactFallbackMessage>` now. Rejected as premature for two cases that already share a data shape (`DisplayMessage.contact`) — the duplication is a few JSX lines, not logic.

### 5. Detection stays reactive
No health-check endpoint on widget-open. The first failed `submit()` (whichever branch it lands in) is the first signal the visitor sees, matching the original enrichment's recommendation and avoiding a request-per-open that would work against 5.3's per-IP/per-session limits.

## Risks / Trade-offs

- **[Risk]** Treating a mid-stream error as a synthetic "503" could be confusing if `ChatRequestError.status` is ever logged/inspected expecting a real HTTP status. → **Mitigation:** documented inline at the throw site in `streamChat.ts`; the value is scoped to client-side branching only, never sent back to a server.
- **[Risk]** A provider failure that happens *after* some tokens were already shown could look jarring — partial answer, then an "unavailable" message appended. → **Mitigation:** accepted as correct behavior — better to show the visitor exactly what happened (partial answer + explicit failure) than to hide the truncation, which was the actual problem being fixed.
- **[Trade-off]** `unavailableResponse()` and `rateLimitedResponse()` remain two separate near-identical helpers rather than one parameterized builder. Deliberate — two clear, differently-named functions read better at each call site than a generic `errorResponse(kind)`, for two cases.

## Migration Plan

No data migration, no new dependencies, no environment variables. Standard PR rollout: implement per `tasks.md` → `npm test` / `tsc --noEmit` clean → manual verification (stub a failure at each of the three sites — missing key, pre-stream throw, mid-stream throw — and confirm the widget shows the unavailable message each time; confirm a sibling page control stays usable throughout; confirm a subsequent successful send works without reload) → merge. Rollback is a plain revert; purely additive error handling with no schema/state to unwind.

## Open Questions

None blocking. All three failure sites and the client-side normalization approach were decided during proposal.
