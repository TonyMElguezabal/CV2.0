## Why

When a visitor submits a question in the chat widget, their message is added instantly, but nothing else renders until the **first streamed answer token arrives** — during the whole embed → retrieve → LLM-first-token window (seconds; longer on a cold Cloudflare Worker), the visitor sees only their own message with no sign the bot is working (JOS-93). It reads as broken or stuck.

The accepted `chat-widget-entry-point` capability covers token arrival, citations, and every error case, but says nothing about this pre-first-token window — so there is no "the bot is thinking" feedback by design. This change closes that gap with a lightweight thinking indicator.

## What Changes

- **Add a thinking indicator (3-dot "typing" animation).** From the moment a question is submitted (starter or free-text) until the first answer token arrives, an assistant-styled bubble with an animated 3-dot indicator is shown in the conversation. Chosen over a progress bar because the wait is indeterminate (no measurable percentage), and once tokens stream the text itself is the progress.
- **Replace it with the streaming answer on the first token, clear it on any failure.** The indicator disappears the instant the first token creates the assistant message (existing behavior takes over from there), and is removed if the request fails for any reason (429 / 503 / generic / mid-stream error), never lingering.
- **Disable Send while a request is in flight.** Send/Enter is disabled from submit until the request completes or errors. This reinforces the "busy" signal and closes a latent double-submit bug — today, submitting a second question mid-stream starts a second concurrent stream that interleaves into the message list.
- **Respect reduced motion and accessibility.** Under `prefers-reduced-motion: reduce` the indicator shows in a static form (no bouncing/pulsing), consistent with the capability's existing reduced-motion requirement. A single "Thinking…" status is announced to assistive tech (via `role="status"` / the existing `aria-live` region); the animated dots are `aria-hidden` so they don't spam repeated announcements. Non-modal behavior and close-on-Escape are preserved.
- **Out of scope:** any change to the SSE streaming contract (`streamed-chat-answers`), the `POST /api/chat` endpoint, `lib/chat/streamChat.ts`, or the RAG/generation pipeline. This is purely how the client presents the pending window.

## Capabilities

### New Capabilities
_None._ This is a presentational addition to the existing chat widget.

### Modified Capabilities
- `chat-widget-entry-point`: adds a pending-response ("thinking") indicator shown between question submission and the first streamed token, cleared on the first token or on any failure, static under `prefers-reduced-motion`, announced once to assistive tech, with the input disabled while a request is in flight. The existing submission, streamed-answer/citation rendering, error, non-modal, and dismiss requirements are unchanged; `streamed-chat-answers` (the SSE contract) is not touched.

## Impact

- **Modified files:** `components/ChatPanel.tsx` (add an in-flight state; render the indicator while awaiting the first token; clear it on first token / error / done via `finally`; disable Send while in flight), `components/ChatWidgetStyles.ts` (animated-dots styles + a reduced-motion static variant), `components/ChatPanel.test.tsx` (add coverage; existing streaming/error tests stay green).
- **Unchanged (verified):** `lib/chat/streamChat.ts`, `app/api/chat/route.ts`, the SSE event types, and every other accepted capability. The chat panel stays code-split; no new dependency.
- **No new dependency, no endpoint change, no schema change.** A small transform/opacity-only CSS animation; First Load JS, CSP, and the panel's code-split boundary are all unaffected.
