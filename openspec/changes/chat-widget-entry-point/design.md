## Context

`POST /api/chat` (implemented in stories 5.0/5.2, archived) already streams grounded, cited answers over SSE. Nothing on the frontend calls it. `components/HeroCtas.tsx` has a disabled `"Ask AI — coming soon"` button reserved for this feature. The site is currently a single scrolling page (`app/page.tsx`) rendered under `app/layout.tsx`, with no global client state and no chat-specific UI. `content/faq.md` is already typed-read via `getFaq()` and its five Q&A pairs are the PRD's five core recruiter questions — a ready-made source for starter questions.

Component convention in this repo: flat files in `components/`, a companion `*Styles.ts` holding Tailwind class constants, and `*.test.tsx` (jsdom pragma) / `*.ssr.test.tsx` companions. No Redux/Zustand/etc. — cross-component communication so far has been prop-based because the tree has been shallow; this is the first feature needing communication across sibling subtrees (`layout.tsx` vs. `page.tsx` → `HeroCtas`).

## Goals / Non-Goals

**Goals:**
- Ship a persistent, unobtrusive entry point reachable from any section of the page, satisfying JOS-62 AC1–AC4.
- Let a visitor submit a starter question or free text and see the streamed answer + citations, reusing the existing SSE contract unchanged.
- Wire the pre-existing `HeroCtas` "Ask AI" CTA into the same widget instance rather than building a second entry point.
- Keep the widget non-modal so "unobtrusive" and "page remains fully usable" hold both while open and after close.

**Non-Goals:**
- Rate limiting, per-session message caps, or spend guardrails (5.3).
- Refusal/injection-resistance copy and behavior (5.4) — beyond what `/api/chat` already does server-side.
- Graceful-degradation UX for provider outages/rate limits beyond a single generic inline error (5.5).
- Persisted chat history (explicitly excluded at the epic level, PRD §2).
- Any change to `POST /api/chat`, `lib/rag/*`, or the SSE wire format.

## Decisions

### 1. Non-modal panel, not a `role="dialog"` overlay
A backdrop + focus trap is the standard accessible pattern for a "dialog," but it actively contradicts this feature's own requirements: PRD §5 F5 calls the entry point "unobtrusive," and AC4 requires the underlying page to remain fully usable while the widget is open, not just after it closes. **Decision:** render the panel as `role="region"` with `aria-label="Ask about Jose"`, positioned via fixed CSS, no backdrop element, no `document.body` scroll lock, no focus trap. Focus moves into the panel on open (to the close button or input) and returns to the trigger on close, but `Tab`/pointer interaction with the rest of the page is never blocked.
- *Alternative considered:* a modal `<dialog>`/focus-trapped panel (common chat-widget pattern, e.g. Intercom in "expanded" mode). Rejected — it's the more common pattern but conflicts with explicit product intent here.

### 2. Cross-tree communication via a small React Context, not prop drilling or a state library
`ChatWidget` mounts once in `app/layout.tsx` (so it's present on every route per AC1); `HeroCtas` is nested three levels down inside `app/page.tsx`. They are siblings under `layout.tsx`, not parent/child, so props alone can't connect them without threading an open/close callback through `page.tsx`.
**Decision:** `ChatWidgetContext` (a plain `createContext` + `useContext`, no external library) exposes `{ isOpen, openChat, closeChat }`. `ChatWidgetProvider` wraps `{children}` and `<ChatWidget />` together in `layout.tsx`; both `HeroCtas` and `ChatWidget` consume the same context instance.
- *Alternative considered:* introduce Zustand/Jotai. Rejected — one boolean and two callbacks don't justify a new dependency; matches the repo's existing "local `useState`, no global store" convention, just lifted one level via Context instead of a library.
- *Alternative considered:* a custom DOM event (`window.dispatchEvent`). Rejected — untyped, harder to test, no real advantage over Context for a same-tree React app.

### 3. Client-side SSE decoding lives in `lib/chat/`, not `lib/rag/`
`lib/rag/` is the server/build-time RAG pipeline; several of its modules (`retrieve.ts`) use `node:fs` and are explicitly incompatible with any runtime the widget's client bundle could reach. The widget needs the *inverse* operation of `lib/rag/sse.ts:formatSseEvent` — parse `event:`/`data:` frames back out of a `fetch` response body — which is pure browser-side logic with no server dependency.
**Decision:** new `lib/chat/streamChat.ts` exports an async generator that wraps `fetch("/api/chat", { method: "POST", body })`, reads `response.body.getReader()`, buffers across chunk boundaries (SSE frames can split across TCP reads), and yields typed events: `{ type: "token", value: string } | { type: "citations", value: Citation[] } | { type: "done" }`. It re-exports/reuses the `Citation` type already defined in `lib/rag/generate.ts` rather than redefining it.
- *Alternative considered:* `EventSource`. Rejected — `EventSource` only supports `GET`, and the endpoint requires a JSON `POST` body.

### 4. Starter questions are a server-read prop, not a client fetch or a hardcoded list
`getFaq()` already parses `content/faq.md` into `{ question, answer }[]` at request/build time (same pattern `page.tsx` uses for `getExperiences()` etc.). Hardcoding the starter questions as literal strings in the component would create a second, driftable copy of content that's supposed to be single-sourced (CLAUDE.md §9 "content-first design").
**Decision:** `app/layout.tsx` calls `getFaq()` server-side and passes the first N entries' `question` strings as a `starterQuestions: string[]` prop into `<ChatWidget />`. No client-side fetch of FAQ content, no duplicated question text.

### 5. Streamed answer rendering is in scope for this story
JOS-62's AC text only says a starter question "is submitted as the visitor's message," not that the answer must render. Without rendering *something*, AC3 isn't a real, observable user flow — it would submit into a void. This design includes minimal rendering (streamed tokens appended to the current assistant message, deduplicated citations shown once `done` fires) so the flow is genuinely testable and usable, while deliberately excluding everything 5.3–5.5 own (rate-limit messaging, refusal-specific copy, outage banners). A network/fetch failure renders one generic inline system message and stops — no retry logic, no guardrail-aware copy.

## Risks / Trade-offs

- **[Risk]** A non-modal panel with no focus trap could let keyboard focus silently leave an open panel, confusing users about whether it's still "active." → **Mitigation:** visible focus rings throughout (matches existing site treatment on `CareerTimeline`/`CareerChapter`), and the panel visually persists (no auto-close on outside click/blur) so leaving focus doesn't close it — an explicit close action is always required.
- **[Risk]** `aria-live="polite"` on the message list, if updated per-token, would flood screen readers with dozens of announcements per answer. → **Mitigation:** the live region updates once when a message completes (on the `done` event), not on every `token` event; token-by-token updates only affect the visual DOM.
- **[Risk]** Introducing `ChatWidgetContext` is the first cross-tree state mechanism in this codebase — could be over-generalized by future work. → **Mitigation:** keep the context minimal (`isOpen`/`openChat`/`closeChat` only), scoped to this one concern; no generic "app state" abstraction.
- **[Trade-off]** Including minimal answer/citation rendering here (Decision 5) makes this story larger than a literal reading of the AC text, but a widget that can't show a response isn't shippable or demoable. Flagged to the user during enrichment and accepted implicitly by proceeding to this proposal.

## Migration Plan

No data migration. Rollout is a standard PR merge:
1. Implement per `tasks.md`.
2. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run validate:content` clean.
3. Manual check in dev server: widget opens/closes on every section, starter question submits and streams a real answer end-to-end against `POST /api/chat`.
4. No feature flag — rollback is a plain revert (no schema/data to unwind).

## Open Questions

- None blocking. The scope reading in Decision 5 was surfaced to the user during enrichment; proceeding on that basis unless corrected during implementation review.
