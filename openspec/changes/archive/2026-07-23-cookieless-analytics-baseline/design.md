## Context

Story 7.3 (`analytics-event-store`, proposed) introduces `POST /api/events` and the anonymized store. This story is the client that feeds it: page-view/section-reach instrumentation plus the shared `track()` helper and session id that 7.2 will reuse. Today there is no analytics instrumentation and no site footer. Two relevant existing pieces: `lib/chat/session.ts:getSessionId()` (an in-memory per-tab `crypto.randomUUID()`, currently used only by `streamChat.ts` for the chat's per-session header) and `components/CareerTimeline.tsx` (which already runs an `IntersectionObserver` for its active-section nav highlight).

## Goals / Non-Goals

**Goals:**
- Emit `page_view` and `section_reach` into `/api/events`, fire-and-forget, never affecting the page.
- One cookieless, fingerprint-free session concept per tab, shared by chat and analytics.
- A footer that discloses the first-party cookieless analytics (PRD §9), so AC3 (no consent banner) is honestly backed by a disclosure.

**Non-Goals:**
- The `/api/events` endpoint, persistence, server-derived dimensions, and retention enforcement — all 7.3.
- The interaction events (chat_open/question_asked/resume_download/contact_click) — 7.2.
- Any cookie, localStorage, or fingerprinting — excluded by construction.

## Decisions

### 1. `track()` is fire-and-forget and cannot affect the page
`lib/analytics/track.ts` exposes `track(event)` that sends `{ sessionId, eventType, pagePath, ...conditional }` to `/api/events` via `navigator.sendBeacon` (a fetch with `keepalive: true` fallback when `sendBeacon` is unavailable). It attaches only client-known fields — **never** a timestamp or a dimension (the server derives those). It is wrapped so any throw (no beacon support, network error, endpoint down) is swallowed: analytics is best-effort and a failed send must be invisible to the visitor. This mirrors the resilience posture already used for the chat (a failed request never breaks the page).
- *Alternative considered:* `fetch` without `keepalive`. Rejected — an in-flight `fetch` can be cancelled on navigation (exactly when `page_view`/last events matter); `sendBeacon`/keepalive is the correct transport for unload-safe telemetry.

### 2. One per-tab session id, shared by chat and analytics — generalize `getSessionId()`
A visitor's "session" should be one concept, not a chat id and a separate analytics id. Promote `lib/chat/session.ts`'s `getSessionId()` into a shared module (`lib/session.ts`), re-export/re-point `lib/chat/streamChat.ts` to it, and have `track()` use the same function. Result: one in-memory `crypto.randomUUID()` per tab, used both as the chat's `x-chat-session-id` and the analytics `VisitSession` id. Cookieless, fingerprint-free, resets on reload (a "session" = page-load-until-reload — the honest limitation documented in 7.3).
- *Alternative considered:* a second independent analytics session id. Rejected — two ids for the same visit fragment the data and duplicate the UUID logic; DRY and semantically cleaner to share one.

### 3. A dedicated one-shot `section_reach` observer, not a reuse of CareerTimeline's
`CareerTimeline`'s `IntersectionObserver` implements a *continuous active-section highlight* (a moving reading-line band, with a scroll-bottom special case) — its semantics are "which section is active right now," which changes repeatedly as you scroll. `section_reach` wants the opposite: fire **once** the first time each section id enters view. Forcing these two different behaviors through one observer would tangle both. So `AnalyticsTracker` runs its own lightweight observer that fires `track('section_reach', { sectionId, scrollDepthPercent })` once per section id (tracking already-fired ids in a `Set`), and emits `page_view` on mount. `CareerTimeline` is left unchanged.
- *Alternative considered:* extend `CareerTimeline`'s observer to also emit analytics. Rejected — couples an unrelated nav-highlight component to analytics and mixes one-shot vs. continuous semantics.

### 4. `AnalyticsTracker` mounts once in `app/layout.tsx`; `SiteFooter` too
`AnalyticsTracker` is a `"use client"` component rendering nothing (an effects-only tracker) mounted once in `layout.tsx` so `page_view` fires on every route. `SiteFooter` is a small server component with the privacy disclosure, also rendered in `layout.tsx` so it's present site-wide, sitting below the page content (and below JOS-69's `ContactSection` when that lands). The footer text discloses cookieless analytics + the 180-day retention.
- *In-flight overlap:* `contact-options` (JOS-69) adds a `ContactSection` at the bottom of `page.tsx`. The footer (site-wide, in `layout.tsx`) is a distinct element that sits below it — no conflict, but whichever merges second should sanity-check the visual stacking. Noted so it isn't a surprise.

### 5. AC2/AC3 are proven, not just asserted in prose
The instrumentation writes no `document.cookie` and touches no `localStorage`; the session id is a random UUID with no IP/UA/fingerprint input. Tests assert these negatives directly (spy on `document.cookie`/`localStorage`, inspect the id's provenance). AC3 (no consent banner) is backed by the footer disclosure test asserting the disclosure text exists and no consent/cookie-banner element is rendered.

## Risks / Trade-offs

- **[Risk]** `section_reach` could fire a flood of events on fast scrolling. → **Mitigation:** one-shot per section id (a `Set` guards re-fires); at most one event per section per page-load. Low volume by design.
- **[Risk]** This story's events go nowhere until 7.3's endpoint exists. → **Mitigation:** `track()` swallows the failed send, so it's harmless if applied before 7.3 is live; but the sensible apply order is 7.3 → this. The unit tests mock the transport, so they pass regardless of whether `/api/events` is deployed.
- **[Trade-off]** A reload starting a new session slightly inflates session counts vs. a cookie-based tool. Accepted — it's the price of no cookies/fingerprinting, and it's documented.

## Migration Plan

No data migration, no dependencies, no env vars. Implement per `tasks.md` → `npm test`/`tsc` clean → manual check in the dev server that `page_view`/`section_reach` beacons fire (visible in the Network tab even if `/api/events` 404s pre-7.3) and the footer renders with the disclosure → merge (after 7.3). Rollback is a plain revert; instrumentation is additive and side-effect-free on the rendered page.

## Open Questions

- None blocking. Session-sharing (Decision 2) and the dedicated observer (Decision 3) are settled here; the endpoint contract is owned by 7.3.
