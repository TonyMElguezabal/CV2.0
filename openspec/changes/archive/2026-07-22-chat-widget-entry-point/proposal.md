## Why

The site has no way for a recruiter to start a conversation with the RAG chatbot. The backend (`POST /api/chat`) already streams grounded, cited answers (5.2, archived), but nothing on the page calls it — `components/HeroCtas.tsx` even ships a disabled `"Ask AI — coming soon"` button as a placeholder for this exact feature. JOS-62 (epic JOS-46, story 5.1) delivers the entry point so the already-built backend becomes reachable.

## What Changes

- Add a persistent, unobtrusive "Ask about Jose" chat entry point mounted in `app/layout.tsx`, present on every route.
- Add a non-modal chat panel (no backdrop, no scroll lock, no focus trap) that opens/closes from the trigger and from the existing `HeroCtas` CTA.
- On open, show starter questions sourced server-side from `content/faq.md` (via `getFaq()`) — no new content file.
- Support submitting a starter question or free-text message, which calls the existing `POST /api/chat` SSE stream and renders the answer tokens plus deduplicated citations as they arrive.
- Enable the existing disabled `"Ask AI — coming soon"` button in `HeroCtas.tsx` to open the widget via a small shared context (`ChatWidgetContext`), since the widget mounts in `layout.tsx` while `HeroCtas` is nested under `page.tsx`.
- Add a client-side SSE decoder (`lib/chat/streamChat.ts`) — the inverse of the server's `lib/rag/sse.ts:formatSseEvent` — since the endpoint requires `POST` and `EventSource` cannot send a body.
- Basic resilience only: a fetch/network failure renders one generic inline error message, no unhandled rejections. Guardrail messaging, refusal copy, rate-limit UX, and outage degradation are explicitly out of scope (stories 5.3–5.5).

## Capabilities

### New Capabilities
- `chat-widget-entry-point`: the persistent entry point, open/close behavior, starter questions, and message submission/streaming UI covering AC1–AC4 of JOS-62.

### Modified Capabilities
_None._ `streamed-chat-answers` (existing spec for `POST /api/chat`) is consumed as-is; this change adds a client, not new server requirements.

## Impact

- **New files**: `lib/chat/streamChat.ts`, `lib/chat/streamChat.test.ts`, `components/ChatWidget.tsx`, `components/ChatWidgetStyles.ts`, `components/ChatWidget.test.tsx`, `components/ChatWidget.ssr.test.tsx`, `components/ChatWidgetContext.tsx`.
- **Modified files**: `app/layout.tsx` (mount provider + widget, read `getFaq()` server-side), `components/HeroCtas.tsx` and `components/HeroCtas.test.tsx` (enable the CTA, wire to context).
- **Dependencies**: none added — reuses the already-installed `framer-motion` for the open/close transition.
- **No backend/API changes**: `POST /api/chat` and its SSE contract are unchanged.
