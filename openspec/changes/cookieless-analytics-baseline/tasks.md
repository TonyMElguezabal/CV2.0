## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-70-71-cookieless-analytics-baseline` (Linear-provided branch name for JOS-70) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: this is client-side instrumentation +
a footer. No database or new endpoint here (POST /api/events is 7.3's).
Depends on 7.3 (change `analytics-event-store`) being merged first for
the endpoint to actually receive events — but this story's unit tests
mock the transport, so they pass independently. Applicable gates: TDD
unit/SSR tests (jsdom for components, mocked sendBeacon/IntersectionObserver,
NO live network), `npx vitest run`, `npx tsc --noEmit`, `npm run lint`
(broken repo-wide, same skip), and in-browser manual verification via
claude-in-chrome (beacons fire in the Network tab; footer renders), all
agent-executed.
-->

## 1. Shared per-tab session id (refactor, keep DRY)

- [x] 1.1 Create a shared session module `lib/session.ts` exporting `getSessionId()` — move the in-memory per-tab `crypto.randomUUID()` logic out of `lib/chat/session.ts` (verbatim; it is already correct)
- [x] 1.2 Re-point `lib/chat/session.ts` to re-export from `lib/session.ts` (or delete it and update the importer) and update `lib/chat/streamChat.ts`'s import; keep `lib/chat/streamChat.test.ts` green (the session-header test must still pass unchanged)
- [x] 1.3 Run `npx vitest run lib/chat/streamChat.test.ts` and confirm no regression to the chat session behavior

## 2. `track()` fire-and-forget emitter (TDD)

- [x] 2.1 Write failing tests in `lib/analytics/track.test.ts`: with `navigator.sendBeacon` mocked, `track({ eventType: "page_view", pagePath: "/" })` calls `sendBeacon` once with the `/api/events` URL and a body containing `sessionId` (from `getSessionId()`), `eventType`, and `pagePath` — and no `occurredAt`/dimension fields; a `section_reach` event includes `sectionId` + `scrollDepthPercent`; when `sendBeacon` is unavailable it falls back to `fetch` with `keepalive: true`; a thrown/failed send does NOT propagate (the call resolves/returns without error); `track` writes no `document.cookie` and no `localStorage`
- [x] 2.2 Implement `lib/analytics/track.ts`: a `track(event)` helper building the minimal payload (session id + eventType + pagePath + conditional sectionId/scrollDepthPercent), sending via `navigator.sendBeacon` with a `fetch(..., { keepalive: true })` fallback, all wrapped so failures are swallowed (best-effort). Import `getSessionId` from `lib/session.ts`
- [x] 2.3 Run `npx vitest run lib/analytics/track.test.ts` and confirm all cases pass

## 3. `AnalyticsTracker` — page_view + section_reach (TDD)

- [x] 3.1 Write failing tests in `components/AnalyticsTracker.test.tsx` (`// @vitest-environment jsdom`, mock `track` and a fake `IntersectionObserver`): on mount, `track` is called once with a `page_view`; when the fake observer reports a section entry (with a known `data-analytics-section` / id), `track` is called with `section_reach` + that section id; a second intersection of the same section does NOT fire a duplicate; the component renders nothing visible
- [x] 3.2 Implement `components/AnalyticsTracker.tsx` (`"use client"`, renders `null`): on mount fire `page_view`; set up an `IntersectionObserver` over the page's major sections (identified by their existing anchor ids — experience chapter ids, `#contact`, etc.), firing `section_reach` once per id (guard with a `Set`) with a `scrollDepthPercent` milestone. Do NOT modify `CareerTimeline` (its observer has different, continuous-highlight semantics — see design.md Decision 3)
- [x] 3.3 Run `npx vitest run components/AnalyticsTracker.test.tsx` and confirm all cases pass

## 4. Site footer with the privacy disclosure (TDD)

- [x] 4.1 Write a failing SSR test in `components/SiteFooter.ssr.test.tsx` (pattern from `ProjectsSection.ssr.test.tsx`, `renderToStaticMarkup`): the rendered footer contains the cookieless-analytics disclosure text and the 180-day retention statement, and contains no cookie-consent-banner element
- [x] 4.2 Implement `components/SiteFooter.tsx` (server component) + `components/SiteFooterStyles.ts` (Tailwind constants, mirroring the section style convention): a minimal `<footer>` with a one-line disclosure, e.g. "This site collects anonymous, cookieless usage analytics — no personal data, no cookies. Events are retained for 180 days."
- [x] 4.3 Run `npx vitest run components/SiteFooter.ssr.test.tsx` and confirm it passes

## 5. Mount tracker + footer into the app shell

- [x] 5.1 In `app/layout.tsx`, mount `<AnalyticsTracker />` (once, so `page_view` fires on every route) and render `<SiteFooter />` below `{children}` (site-wide). Confirm the server/client boundary is correct (`AnalyticsTracker` is `"use client"`; `SiteFooter` stays a server component; `layout.tsx` stays a server component)
- [x] 5.2 Confirm `npx tsc --noEmit` is clean after wiring

## 6. Full verification (agent executes all of this itself)

- [x] 6.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 6.2 Run `npx tsc --noEmit` clean
- [x] 6.3 Run `npm run lint` — expect the same pre-existing repo-wide failure (missing `eslint.config.mjs`); skip with the same rationale unless it has since been fixed
- [x] 6.4 Start the dev server and via claude-in-chrome: confirm on load a `page_view` beacon fires to `/api/events` (visible in the Network tab even if it 404s pre-7.3), scrolling fires `section_reach` beacons carrying section ids, and the footer renders with the privacy disclosure; confirm no cookie-consent banner and (DevTools → Application) no cookies/localStorage set by the analytics path
- [x] 6.5 Stop the dev server; confirm no stray processes left running

## 7. OpenSpec sync

- [ ] 7.1 After merge, sync `specs/cookieless-analytics-baseline/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
