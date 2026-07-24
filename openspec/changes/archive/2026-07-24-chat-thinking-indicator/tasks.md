## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-93-thinking-animation-in-the-chatbot` (Linear-provided branch name for JOS-93) from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. In-flight state + Send disabling (TDD)

- [x] 1.1 Write failing `components/ChatPanel.test.tsx` cases: a thinking indicator is visible after submit while awaiting the first token; it is removed once the first token arrives; the Send control is disabled while a request is in flight and re-enabled after it completes/fails (extend the fake `streamChat` to a generator that awaits a manually-controlled promise before yielding the first token)
- [x] 1.2 Add an `isAwaitingResponse` boolean state to `components/ChatPanel.tsx`: set true at the start of `submit()`, cleared when the first `token` creates the assistant message, and cleared in a `finally` covering all error branches
- [x] 1.3 Gate `handleFormSubmit` / `submit` re-entry and disable the Send button on `isAwaitingResponse` (only one request in flight)
- [x] 1.4 Run `npx vitest run components/ChatPanel.test.tsx` and confirm the new + existing cases pass

## 2. Render the thinking indicator (AC1, AC2, AC5)

- [x] 2.1 Render an assistant-styled thinking bubble (3-dot indicator) in the message list when `isAwaitingResponse` is true, positioned after the last message
- [x] 2.2 Make the dots `aria-hidden` and add a single visually-hidden / `role="status"` "Thinking…" announcement (inside/compatible with the existing `aria-live="polite"` region)
- [x] 2.3 Add the animated-dots styles to `components/ChatWidgetStyles.ts` (transform/opacity-only keyframes; no new dependency, no asset)

## 3. Error handling + reduced motion (AC3, AC4)

- [x] 3.1 Add tests asserting the indicator is removed and the correct inline error is shown for each failure path (429 / 503 / generic / mid-stream error), never lingering
- [x] 3.2 Add a test asserting the indicator renders in a static form (no looping animation) under `prefers-reduced-motion: reduce` (use the existing fake-matchMedia harness in the test file)
- [x] 3.3 Implement the reduced-motion static variant, gated on `useReducedMotion()` (mirror the greeting/panel branching already in `ChatPanel.tsx`); add the static-variant class in `ChatWidgetStyles.ts`

## 4. Confirm existing behavior preserved

- [x] 4.1 Confirm all existing `ChatPanel.test.tsx` streaming/citation/error/non-modal/dismiss tests stay green — the SSE contract, `streamChat`, and `/api/chat` are untouched
- [x] 4.2 Confirm the close button still receives focus on open and Escape still closes the panel (non-modal preserved)

## 5. Full verification

- [x] 5.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 5.2 Run `npx tsc --noEmit` clean
- [x] 5.3 Run `npm run validate:content` clean
- [x] 5.4 Run `npm run lint` (note the pre-existing repo-wide ESLint config failure; skip with the same rationale as prior stories)
- [x] 5.5 Run `npm run build` and confirm the chat panel stays a separate code-split chunk and First Load JS is not regressed (no new deps)
- [x] 5.6 Real browser check: submit a question and see the 3-dot indicator until the answer starts streaming; confirm Send is disabled mid-request; confirm the reduced-motion static form; confirm an errored request clears the indicator and shows the error

## 6. OpenSpec sync

- [ ] 6.1 After merge, sync `specs/chat-widget-entry-point/spec.md` into `openspec/specs/chat-widget-entry-point/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
