## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [ ] 0.1 Create feature branch `joseelguezabal/jos-71-72-engagement-and-conversion-event-tracking` (Linear-provided branch name for JOS-71) from `main`
- [ ] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: client-side instrumentation only, no
database or endpoint here. Depends on 7.1 (`cookieless-analytics-baseline`
— the track() helper + AnalyticsTracker) and 7.3 (`analytics-event-store`
— the endpoint) and JOS-69 (`contact-options` — the ContactSection links)
all being merged first. Unit tests mock track(), so they pass
independently. Applicable gates: TDD unit tests (jsdom, mocked track),
`npx vitest run`, `npx tsc --noEmit`, `npm run lint` (broken repo-wide,
same skip), and in-browser manual verification via claude-in-chrome
(each interaction fires its beacon; question_asked carries no text), all
agent-executed.
-->

## 1. `chat_open` — from the openChat choke point (TDD)

- [x] 1.1 Update `components/ChatWidgetContext.test.tsx`: assert that calling `openChat()` invokes `track` (mocked) once with a `chat_open` event
- [x] 1.2 Update `components/ChatWidgetContext.tsx`: in `openChat`, call `track({ eventType: "chat_open", pagePath: location.pathname })` (import `track` from `lib/analytics/track.ts`). Both the persistent trigger and the hero "Ask AI" CTA go through this one method, so both are covered
- [x] 1.3 Run `npx vitest run components/ChatWidgetContext.test.tsx` and confirm all cases pass

## 2. `question_asked` — count only, never text (TDD; the critical privacy AC)

- [x] 2.1 Update `components/ChatWidget.test.tsx`: assert that submitting a question invokes `track` (mocked) with a `question_asked` event AND that the tracking call receives **no argument containing the question text** (inspect the mock call args — the submitted question string must not appear anywhere in them)
- [x] 2.2 Update `components/ChatWidget.tsx`: in the submit path (where it calls `streamChat(trimmed)`), also call `track({ eventType: "question_asked", pagePath: location.pathname })` — pass NO question text. The event is count + (server-set) timestamp only
- [x] 2.3 Run `npx vitest run components/ChatWidget.test.tsx` and confirm all cases pass

## 3. Delegated link-click tracking + résumé/contact annotations (TDD)

- [x] 3.1 Write/extend a test for the delegated click listener (in `components/AnalyticsTracker.test.tsx` from 7.1, or a dedicated test): a click on an element carrying `data-analytics-event="resume_download"` fires `track` with a `resume_download` event; a click on `data-analytics-event="contact_click" data-analytics-target="email"` fires `track` with `contact_click` + `contactTarget: "email"`; a click on a child node *inside* an annotated link still resolves to the link (via `closest('[data-analytics-event]')`); a click on an unannotated element fires nothing
- [x] 3.2 Implement the delegated listener in `components/AnalyticsTracker.tsx` (7.1's mounted client component): a single document `click` listener that walks up from `event.target` via `closest('[data-analytics-event]')`, reads `data-analytics-event` (+ optional `data-analytics-target`), and calls `track()` accordingly. (Coordinate with 7.1 — this augments its `AnalyticsTracker`.)
- [x] 3.3 Update `components/HeroCtas.tsx`: add `data-analytics-event="resume_download"` to the "Download résumé" `<a>` link
- [x] 3.4 Update `components/ContactSection.tsx` (from JOS-69): add `data-analytics-event="contact_click"` + `data-analytics-target="scheduling|email|linkedin"` to each of the three contact links (keeps it a server component — attributes only, no client wrapper)
- [x] 3.5 Run `npx vitest run components/AnalyticsTracker.test.tsx components/HeroCtas.test.tsx components/ContactSection.ssr.test.tsx` and confirm all cases pass (the ContactSection SSR test should confirm the `data-*` attributes are present in the static markup)

## 4. Full verification (agent executes all of this itself)

- [x] 4.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 4.2 Run `npx tsc --noEmit` clean
- [x] 4.3 Run `npm run lint` — expect the same pre-existing repo-wide failure (missing `eslint.config.mjs`); skip with the same rationale unless it has since been fixed
- [x] 4.4 Started the dev server and via claude-in-chrome, intercepted `navigator.sendBeacon` to inspect payloads directly: opening the chat fired `chat_open`; submitting a question fired `question_asked` with a payload containing only `eventType`/`pagePath`/`sessionId` — **no question text anywhere**; activating the résumé link fired `resume_download`; each of the three contact links fired `contact_click` with the correct `contactTarget` (`scheduling`/`email`/`linkedin`), each exactly once. (An initial test run appeared to show each event firing twice; investigated and confirmed it was an artifact of the test script wrapping `sendBeacon` twice, not a real duplicate-listener bug — a clean reload with a single interception layer confirmed each interaction fires its beacon exactly once.) All requests visible in the Network tab, `POST /api/events` returning 500 since no real `DATABASE_URL` is configured locally (JOS-72's documented fail-clean behavior, not a bug here)
- [x] 4.5 Stopped the dev server; confirmed no stray processes left running

## 5. OpenSpec sync

- [ ] 5.1 After merge, sync `specs/engagement-event-tracking/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
