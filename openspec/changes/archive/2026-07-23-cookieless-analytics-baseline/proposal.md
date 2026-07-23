## Why

The site records nothing about how visitors engage with it — no page views, no story depth — so the §10.2 engagement targets (median session > 2 min, ≥40% reaching the second chapter) can't be measured. This delivers the client-side instrumentation baseline: it emits `page_view` and `section_reach` events into the first-party store, plus the shared `track()` helper and session id that story 7.2 reuses. Because it's first-party and cookieless by construction, it needs no consent banner (PRD §5 F8).

## What Changes

- Add a client `track(event)` helper that POSTs a minimal event payload to `POST /api/events` **fire-and-forget** via `navigator.sendBeacon` (fetch+keepalive fallback), attaching a per-tab session id — never blocking the page, always swallowing errors (a failed beacon must never affect rendering).
- Add a client tracker (mounted once) that emits `page_view` on load and `section_reach` (with `sectionId` + a `scrollDepthPercent` milestone) as each major section enters the viewport, via `IntersectionObserver`.
- Share **one per-tab session id** between chat and analytics — generalize the existing `lib/chat/session.ts` UUID (from JOS-64) into a shared location so there's a single cookieless, fingerprint-free session concept, not two.
- Add a minimal **site footer with a cookieless-analytics privacy note** (PRD §9 requires the footer to disclose first-party event storage; no footer exists today), stating the 180-day retention.
- No cookies, no localStorage, no fingerprinting → **no consent banner** (AC2/AC3 hold by design).
- **Out of scope**: the `POST /api/events` endpoint + persistence (7.3, change `analytics-event-store`); the interaction events chat_open/question_asked/resume_download/contact_click (7.2, JOS-71); the server-derived dimensions and retention cleanup (7.3 / future). The client sends only session id + eventType + pagePath (+ conditional sectionId/scrollDepthPercent) — never timestamps or dimensions.

## Capabilities

### New Capabilities
- `cookieless-analytics-baseline`: the client `track()` emitter, the page-view/section-reach instrumentation, and the footer privacy disclosure.

### Modified Capabilities
_None._ Generalizing `lib/chat/session.ts` into a shared session id is an internal refactor (the chat rate-limit behavior is unchanged); it touches no capability's requirements.

## Impact

- **Depends on** `analytics-event-store` (7.3, JOS-72 — proposed, not yet merged) for `POST /api/events`. This change applies after 7.3 is built.
- **New files**: `lib/analytics/track.ts` (+ test), a shared session-id module (generalized from `lib/chat/session.ts`) (+ test), `components/AnalyticsTracker.tsx` (+ test), `components/SiteFooter.tsx` + `SiteFooterStyles.ts` (+ ssr test).
- **Modified files**: `app/layout.tsx` (mount the tracker + footer, present on every route), `lib/chat/session.ts` and its importers (re-point to the shared session module), possibly `components/CareerTimeline.tsx` if its existing scroll logic is shared for `section_reach`.
- **No new dependencies, no new env vars, no server code** (this is client instrumentation; the endpoint is 7.3's).
