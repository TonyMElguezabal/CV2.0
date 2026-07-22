## Why

One AI outage should never take down the profile (PRD §9 resilience), but today only one failure path is handled cleanly — a missing `OPENAI_API_KEY` returns a 503. Two real outage shapes are not: a pre-stream provider failure (embedding call or stream start throws) crashes the route with a bare, JSON-less 500, and a mid-stream provider failure silently truncates the answer with no error signal at all. Neither reaches the visitor as "unavailable" — they either see a raw failure or an answer that just stops.

## What Changes

- `app/api/chat/route.ts` wraps the pre-stream generation call in a try/catch, returning the same clean 503 `{ error, message, contact }` shape already established by story 5.3's rate-limit response, instead of letting the exception crash the handler.
- A mid-stream provider failure (after tokens have already started) is now caught inside the `ReadableStream`'s `start()` and surfaced as a new `event: error` SSE frame before the stream closes — today this fails completely silently, truncating the answer with no signal to the client at all.
- `lib/chat/streamChat.ts` decodes the new `error` event and raises the same `ChatRequestError` used for the pre-stream case (status 503), so `ChatWidget` has exactly one "unavailable" branch regardless of when the failure happened.
- `ChatWidget` adds a second specific fallback branch (alongside 5.3's existing 429 rate-limit branch) for "AI temporarily unavailable" — reusing the same contact-links message shape already built for rate limiting, not new UI infrastructure.
- Detection is reactive (surfaced on the first failed send), not a proactive health-check on widget-open — avoids a new endpoint and an extra request every time the widget opens, which would work against 5.3's rate limits.
- **Out of scope**: AC2 (non-chat functionality keeps working) and AC3 (recovery without reload) are already structurally true given the widget's existing non-modal, state-preserving design (5.1) — this change adds tests proving it, not new mechanism.

## Capabilities

### New Capabilities
_None._

### Modified Capabilities
- `streamed-chat-answers`: adds a new `error` SSE event, sent when generation fails after streaming has already started — a genuine extension to the stream contract (previously only `token`/`citations`/`done`).
- `chat-widget-entry-point`: the existing "Streamed answer and citations are rendered" requirement gains a third scenario alongside the existing generic-failure and rate-limit scenarios (added by 5.3) — a service-unavailable scenario, covering both the pre-stream 503 and the new mid-stream `error` event.

## Impact

- **Modified files**: `app/api/chat/route.ts` (try/catch around the pre-stream call; `error` SSE event on mid-stream failure), `app/api/chat/route.test.ts`, `lib/chat/streamChat.ts` (decode the `error` event), `lib/chat/streamChat.test.ts`, `components/ChatWidget.tsx` (+ `ChatWidgetStyles.ts` if needed), `components/ChatWidget.test.tsx`.
- **No new dependencies, no new endpoint.** The 503 status code and `ChatRequestError` type already exist (from 5.3); this change extends their use to two more failure sites and adds one new SSE event type to the existing stream.
