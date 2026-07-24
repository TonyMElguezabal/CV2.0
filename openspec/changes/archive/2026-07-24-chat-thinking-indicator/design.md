## Context

`components/ChatPanel.tsx`'s `submit()` adds the visitor's message immediately, fires the `question_asked` analytics event, then enters `for await (const event of streamChat(trimmed))`. The assistant message bubble is only created when the **first `token` event** arrives (the "if this assistant id doesn't exist yet, create it with the first token" branch). Between submit and that first token — the embed → retrieve → LLM-time-to-first-token window (seconds; longer on a cold Worker) — nothing new renders. There is no loading/pending state anywhere in the component today.

JOS-93 asks for a "thinking" indicator in that window. All decisions are resolved with the owner: a **3-dot typing animation** (not a progress bar — the wait is indeterminate), shown **submit → first token only**, with **Send disabled while a request is in flight** (which also closes a latent concurrent-submit bug).

This is a client-only presentation change — the SSE contract (`streamed-chat-answers`), `POST /api/chat`, and `lib/chat/streamChat.ts` are untouched.

## Goals / Non-Goals

**Goals:**
- Immediate feedback that the bot received the question and is working, from submit until the first token.
- Cleanly hand off to the existing streaming render on the first token; never linger on error.
- Prevent concurrent in-flight requests (disable Send while busy).
- Honor the capability's established reduced-motion discipline and stay non-modal / accessible.

**Non-Goals:**
- Any change to the streaming contract, the endpoint, `streamChat`, or the RAG/generation pipeline.
- A determinate progress bar or percentage (there is no progress signal to show; once tokens stream, the text is the progress).
- Persisting the indicator alongside a streaming answer (redundant — the streaming text is the feedback once it starts).

## Decisions

### 1. A single in-flight boolean drives both the indicator and the disabled state
Add an `isAwaitingResponse` (or `isSending`) boolean state in `ChatPanel.tsx`:
- Set `true` at the start of `submit()`.
- Cleared as soon as the first `token` creates the assistant message (indicator hands off to the streaming bubble).
- Cleared in the `catch` for every error branch, and guaranteed via a `finally` so it can never get stuck if an unexpected throw occurs.
- The same flag disables the Send button and short-circuits `handleFormSubmit`/`submit` re-entry (AC "only one request in flight").

**Alternative considered — derive the pending state from the message list** (e.g. "last message is a visitor message and no assistant message follows"): rejected as fragile and ambiguous (it can't distinguish "awaiting" from "errored" from "done"), and it wouldn't cleanly gate the disabled-Send behavior. An explicit boolean is simpler and testable.

### 2. Render the indicator as an assistant-styled bubble inside the message list
When `isAwaitingResponse` is true, render a thinking bubble using the existing assistant bubble class plus a new dots element, positioned after the last message. It lives inside the existing `aria-live="polite"` region. The dots element is `aria-hidden`; a visually-hidden (or `role="status"`) "Thinking…" text carries the single SR announcement.

### 3. Reduced-motion: static form, gated on `useReducedMotion()`
The component already reads `useReducedMotion()` and branches the greeting/panel animations. The dots' looping animation is applied only when motion is allowed; under `prefers-reduced-motion: reduce`, the indicator renders a static form (static dots or static "Thinking…" text) with no looping animation — matching the capability's existing reduced-motion requirement (from JOS-91). The animation itself is transform/opacity-only (e.g. a staggered opacity pulse or small `translateY`), so 60fps and the perf budget are unaffected.

### 4. Styling stays in `ChatWidgetStyles.ts`, no new dependency
New class strings for the dots (animated + static variants) go in `components/ChatWidgetStyles.ts`, consistent with how every other chat style is defined. No library, no asset — the animation is a small CSS keyframe on opacity/transform. The chat panel is already code-split, so this adds nothing to First Load JS and does not touch the CSP.

## Risks / Trade-offs

- **[Risk] Testing "appears before the first token" with a synchronous fake generator.** The existing tests mock `streamChat` with `eventsOf([...])`, which yields synchronously. → Extend the fake to a generator that awaits a manually-controlled promise before yielding the first token, so a test can assert the indicator is visible in the meantime, then release it and assert the indicator is replaced. Called out in Tasks.
- **[Risk] The `finally` clearing the flag must not race the first-token clear.** → Clearing on first token and clearing in `finally` are idempotent (both set the same boolean false); no ordering hazard.
- **[Trade-off] Disabling Send is a small behavior change beyond the literal "thinking animation" ask.** → Explicitly owner-approved (JOS-93 D3); it also fixes the pre-existing concurrent-submit interleave, so it's a net correctness win.
- **[Risk] Screen-reader noise from an animated element inside `aria-live`.** → Dots are `aria-hidden`; only the single static "Thinking…" status is announced, so no repeated chatter.

## Migration Plan

Branch → add the `isAwaitingResponse` state + `finally` clearing in `submit()` → render the thinking bubble (dots + SR status) when awaiting → disable Send while in flight → add the animated/static dot styles → write tests (appears-on-submit-before-first-token, replaced-on-first-token, cleared-on-each-error-type, static-under-reduced-motion, Send-disabled-while-in-flight) and keep the existing streaming/error tests green → `npm test` / `tsc` / `validate:content` / `next build` clean → real browser check (submit a question, see the dots until the answer starts; verify reduced-motion static; verify Send disabled mid-request) → merge → sync the delta into `openspec/specs/chat-widget-entry-point/` and archive. Rollback is a plain revert; the delta spec is additive.

## Open Questions

- None blocking. The exact dot animation style (opacity pulse vs. small bounce) and the "Thinking…" copy are visual/wording details settled during implementation.
