## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-91-chat-window-with-more-information` (Linear-provided branch name for JOS-91) from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. Content (content-first copy)

- [x] 1.1 Add `greeting` and `tooltipLabel` fields (e.g. under a `chat` block) to the Zod schema in `lib/content/schemas.ts`
- [x] 1.2 Author the greeting ("Hi! I'm an AI assistant Jose built to answer questions about him. Here are a few examples — or just type your own question!") and the tooltip label ("chat with me") in `/content`, and expose them via `lib/content/read.ts`
- [x] 1.3 Add/extend a failing content test asserting the fields parse and validate; run `npm run validate:content` and confirm it passes

## 2. Trigger tooltip (TDD)

- [x] 2.1 Write failing `components/ChatWidget.test.tsx` cases: tooltip (robot emoji + "chat with me") appears on hover and on keyboard focus while closed, is hidden while the panel is open, and the trigger keeps its accessible name with the robot `aria-hidden`
- [x] 2.2 Implement the tooltip in `components/ChatWidget.tsx` (CSS `:hover` / `:focus-visible`, guarded by `!isOpen`), thread the `tooltipLabel` content prop from `app/layout.tsx`
- [x] 2.3 Add the tooltip styles to `components/ChatWidgetStyles.ts`

## 3. On-open greeting (TDD)

- [x] 3.1 Write failing `components/ChatPanel.test.tsx` cases: greeting renders above the starter questions when opened with no messages; disappears after the first message; renders in final state with no motion under `prefers-reduced-motion: reduce`; close button still receives focus on open
- [x] 3.2 Implement the greeting block in `components/ChatPanel.tsx` (rendered when `messages.length === 0`, above the starter-questions block) using the existing `useReducedMotion` branch for the fade + slide-in; thread the `greeting` content prop from `app/layout.tsx`
- [x] 3.3 Add the greeting styles to `components/ChatWidgetStyles.ts`

## 4. Full verification

- [x] 4.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 4.2 Run `npx tsc --noEmit` clean
- [x] 4.3 Run `npm run validate:content` clean
- [x] 4.4 Run `npm run lint` (note the pre-existing repo-wide ESLint config failure; skip with the same rationale as prior stories)
- [x] 4.5 Run `npm run build` and confirm the chat panel stays a separate code-split chunk and the landing route's First Load JS is not regressed
- [x] 4.6 Manually confirm non-modal behavior is preserved (no backdrop, scroll lock, or focus trap) and contrast of the tooltip/greeting is adequate

## 5. OpenSpec sync

- [ ] 5.1 After merge, sync `specs/chat-widget-entry-point/spec.md` into `openspec/specs/chat-widget-entry-point/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
