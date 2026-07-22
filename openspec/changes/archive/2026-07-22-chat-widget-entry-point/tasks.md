## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-62-51-chat-widget-entry-point-with-starter-questions` (Linear-provided branch name for JOS-62) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with prior changes on this repo, there
is no backend/database, so curl/database-state steps from
docs/openspec-tasks-mandatory-steps.md don't apply. `POST /api/chat` already
exists (5.2, archived) and is unchanged by this story — no new endpoint to
curl-test. This is a frontend component change; applicable mandatory gates
are TDD unit tests, `npx vitest run`, `npx tsc --noEmit`, `npm run lint`,
and in-browser manual verification (including the streamed end-to-end flow
against the real endpoint, keyboard dismissal, and non-modal behavior) via
claude-in-chrome tools, all agent-executed.
-->

## 1. `lib/chat/streamChat.ts` — client SSE decoder (TDD)

- [x] 1.1 Write failing tests in `lib/chat/streamChat.test.ts` using a mocked `fetch` returning a fake `ReadableStream`: (a) yields `{ type: "token", value }` for each `event: token` frame in order, (b) yields `{ type: "citations", value }` with the parsed JSON array for the `event: citations` frame, (c) yields `{ type: "done" }` last, (d) correctly reassembles a frame whose bytes are split across two separate stream reads, (e) throws/yields an error result on a non-2xx response without leaving the reader open
- [x] 1.2 Implement `streamChat(question: string): AsyncGenerator<ChatStreamEvent>` in `lib/chat/streamChat.ts`: `fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) })`, read via `response.body.getReader()`, buffer and split on `\n\n`, parse `event:`/`data:` lines, `JSON.parse` the data payload per event type. Import and reuse the `Citation` type from `lib/rag/generate.ts` — do not redefine it.
- [x] 1.3 Run `npx vitest run lib/chat/streamChat.test.ts` and confirm all cases pass

## 2. `components/ChatWidgetContext.tsx` — shared open/close state (TDD)

- [x] 2.1 Write a failing test asserting a consumer rendered under `ChatWidgetProvider` can read `isOpen` (initially `false`) and call `openChat()`/`closeChat()` to flip it, and that a consumer rendered without a provider throws a clear error (fail fast on misuse)
- [x] 2.2 Implement `ChatWidgetContext` (`createContext`), `ChatWidgetProvider`, and `useChatWidget()` hook exposing `{ isOpen, openChat, closeChat }`
- [x] 2.3 Run the test from 2.1 and confirm it passes

## 3. `components/ChatWidget.tsx` + `ChatWidgetStyles.ts` — widget UI (TDD)

- [x] 3.1 Write failing tests in `components/ChatWidget.test.tsx` (`// @vitest-environment jsdom`) covering the spec scenarios: trigger renders as a `<button>`; opening (via `useChatWidget().openChat()` / trigger click) renders one starter-question button per entry in a `starterQuestions` prop; clicking a starter question adds it as a visitor message and calls `streamChat` (mocked) with that exact text; typed free-text submission does the same and respects a 500-char `maxLength`; streamed `token` events append to the current assistant message; a `citations` event renders the citation list once; a rejected/error `streamChat` call renders one generic inline error message and does not throw; closing via the close button and via `Escape` hides the panel while an unrelated sibling control (rendered alongside `ChatWidget` in the test) stays focusable/clickable; while open, no backdrop element is present and that same sibling control stays clickable
- [x] 3.2 Implement `ChatWidgetStyles.ts` (Tailwind class constants, following `HeroShellStyles.ts` conventions): trigger button, panel (`role="region"`, `aria-label="Ask about Jose"`, fixed-position, no backdrop), starter-question buttons, message bubbles, input row, citation list, error message
- [x] 3.3 Implement `ChatWidget.tsx`: consumes `useChatWidget()` for open state; `starterQuestions: string[]` prop; local `useState` for `messages`/`streamingStatus`; on submit (starter click or form submit) push a visitor message, call `streamChat`, iterate the async generator updating the in-progress assistant message per `token`, set citations on the `citations` event, catch stream errors into one inline error message; `Escape` keydown handler calls `closeChat()`; open/close transition via `framer-motion` (`AnimatePresence`/`motion.div`), no new dependency
- [x] 3.4 Run `npx vitest run components/ChatWidget.test.tsx` and confirm all cases pass

## 4. Server-rendered presence (TDD)

- [x] 4.1 Write a failing test in `components/ChatWidget.ssr.test.tsx` (pattern from `CareerChapters.ssr.test.tsx`, `renderToStaticMarkup`, no jsdom): rendering `<ChatWidgetProvider><ChatWidget starterQuestions={[...]} /></ChatWidgetProvider>` server-side produces HTML containing the trigger `<button>` with its accessible label, closed (no panel content), and does not throw
- [x] 4.2 Run `npx vitest run components/ChatWidget.ssr.test.tsx` and confirm it passes

## 5. Wire the widget into the app shell

- [x] 5.1 In `app/layout.tsx`, call `getFaq()` server-side, take the first N (5, matching the PRD §1 core questions) entries' `question` strings, wrap `{children}` and `<ChatWidget starterQuestions={...} />` in `<ChatWidgetProvider>`
- [x] 5.2 Confirm `npx tsc --noEmit` is clean after this wiring (server/client component boundary correctness — `ChatWidget/ChatWidgetContext` must be `"use client"`, `layout.tsx` stays a server component)

## 6. Enable the existing `HeroCtas` "Ask AI" CTA

- [x] 6.1 Update `components/HeroCtas.test.tsx`: replace the "disabled Ask AI" assertion with a test that the button is enabled and, when clicked, calls `openChat()` from a mocked/wrapped `ChatWidgetContext`
- [x] 6.2 Update `components/HeroCtas.tsx`: remove `disabled`, call `useChatWidget().openChat()` on click, remove the "coming soon" copy (also removed the now-dead `ctaDisabledClass` from `HeroShellStyles.ts`)
- [x] 6.3 Run `npx vitest run components/HeroCtas.test.tsx` and confirm it passes (also fixed `HeroFramer.test.tsx`, which renders `HeroCtas` internally and needed a `ChatWidgetProvider` wrapper once `HeroCtas` started calling `useChatWidget()`)

## 7. Full verification (MANDATORY — agent executes all of this itself)

- [x] 7.1 Run `npx vitest run` (full suite) and confirm no regressions — 125/125 passed, 28 files
- [x] 7.2 Run `npx tsc --noEmit` clean — no errors
- [x] 7.3 Run `npm run lint` clean — **skipped, pre-existing repo gap**: `eslint.config.mjs`/`.js` is entirely absent from the repo (not gitignored, never committed, not introduced by this change) so `npm run lint` fails for the whole project, not just this change's files. User confirmed treating this as a separate out-of-scope issue rather than adding lint tooling as a side effect of JOS-62.
- [x] 7.4 Start the dev server (`npm run dev`, with `OPENAI_API_KEY` available) and, via claude-in-chrome: open the widget from the persistent trigger, confirm starter questions render, select one, confirm it streams a real answer with citations from the live `/api/chat` endpoint; separately confirm the hero "Ask AI" CTA opens the same widget instance — verified: "Who is Jose?" streamed a real grounded answer with `#faq #oracle #skills` citations; clicking the hero "Ask AI" CTA re-opened the exact same conversation (same context instance)
- [x] 7.5 Via claude-in-chrome: with the widget open, confirm a background page control (e.g. a career-timeline link) is still clickable and no backdrop is present; close via the close button and via `Escape`, confirm the same background control remains focusable/clickable both times — verified: clicked the "Oracle Corporation" timeline link while the widget was open, page navigated/scrolled to `#oracle` (proves no backdrop blocks it); closed via the close button, then reopened and closed via `Escape` — both times the page and trigger stayed fully usable
- [x] 7.6 Stop the dev server; confirm no stray processes left running — confirmed, port 3000 free

## 8. OpenSpec sync

- [x] 8.1 After merge, sync `specs/chat-widget-entry-point/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`) — spec was synced (later re-synced with chat-guardrails-and-cost-controls's MODIFIED delta applied on top); archiving now
