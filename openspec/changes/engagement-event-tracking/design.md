## Context

Story 7.1 (`cookieless-analytics-baseline`) provides `track(event)` (fire-and-forget `sendBeacon`) + the shared session id + an `AnalyticsTracker` client component. 7.3 (`analytics-event-store`) provides `POST /api/events` and the anonymized store whose schema has no content field. This story is the thin layer that calls `track()` from the four interactions that already exist: chat open (`ChatWidgetContext.openChat`, shipped), question submit (`ChatWidget`, shipped), résumé download (`HeroCtas`, shipped), and contact clicks (`ContactSection`, in-flight from JOS-69). Two of these live in client components; two are `<a>` links, one of which (`ContactSection`) is a server component.

## Goals / Non-Goals

**Goals:**
- Emit the four events reliably from the real interaction points, covering all trigger paths (e.g. both chat-open entry points).
- Guarantee `question_asked` never carries text — enforced at the call site *and* by the schema.
- Instrument the link clicks without turning server components into client components or scattering `onClick` handlers.

**Non-Goals:**
- `track()`, the session id, `page_view`/`section_reach` — 7.1.
- The endpoint/store — 7.3.
- Any change to what the interactions *do* (open, download, navigate) — only additive tracking.

## Decisions

### 1. `chat_open` fires from `ChatWidgetContext.openChat` — the single choke point
Both the persistent trigger and the hero "Ask AI" CTA call `openChat()`. Firing `track('chat_open')` inside `openChat` (rather than at each call site) covers both with one line and can't drift as new entry points are added.
- *Alternative considered:* fire at each trigger's onClick. Rejected — two call sites today, easy to miss a third; the context method is the natural single point.

### 2. `question_asked` fires from the submit handler with no text — the critical privacy rule
In `ChatWidget`'s submit path (where it calls `streamChat(trimmed)`), also call `track('question_asked')` **with no question argument**. The event carries only type + (server-set) timestamp. This is defense in depth with 7.3: even if a caller mistakenly tried to pass text, the schema has no field to store it. Tests assert `track` is invoked for `question_asked` with no text-bearing argument.

### 3. Link clicks use `data-analytics-*` attributes + one delegated listener — not per-link onClick
The résumé link (`HeroCtas`, a client component) and the three contact links (`ContactSection`, a **server** component from JOS-69) are plain `<a>` elements. To track their clicks without making `ContactSection` a client component or wrapping every link, annotate them declaratively — e.g. `data-analytics-event="contact_click" data-analytics-target="email"` — and add a single delegated `click` listener (in 7.1's `AnalyticsTracker`, which is already the one mounted client component) that reads those attributes off the clicked element and calls `track()`. `sendBeacon` fires before the navigation/download completes, so the event isn't lost.
- *Alternative considered:* make `ContactSection`'s links a client component with `onClick`. Rejected — pushes an otherwise-static server component to the client purely for a side effect, and repeats the wiring per link.
- *Alternative considered:* per-link `onClick` on `HeroCtas` only (it's already client) + a client wrapper for `ContactSection`. Rejected — two different mechanisms for the same concept; the delegated listener handles both uniformly.
- *Consequence:* this story adds the delegated listener to `AnalyticsTracker` (from 7.1). Since 7.1 is proposed but not merged, coordinate: the listener can land in either story, but modeling it here keeps 7.1 focused on page/section views. Noted as a cross-change touch-point.

## Risks / Trade-offs

- **[Risk]** A delegated click listener could miss events if the click lands on a child element (e.g. an icon inside the link). → **Mitigation:** walk up from `event.target` to the nearest element carrying `data-analytics-event` (`closest('[data-analytics-event]')`), so nested content still resolves to the link.
- **[Risk]** `contact_click` depends on JOS-69's `ContactSection` existing. → **Mitigation:** it's in-flight (`contact-options`); this story applies after it. If `ContactSection`'s markup changes, only the `data-*` attributes need to be present — a light coupling.
- **[Trade-off]** Splitting the delegated-listener code between 7.1 (`AnalyticsTracker`) and this story is a minor cross-change seam. Accepted and documented; the alternative (duplicating a listener) is worse.

## Migration Plan

No data migration, no dependencies, no env vars. Implement per `tasks.md` → `npm test`/`tsc` clean → manual check that each interaction fires its beacon (Network tab) with the right payload, and that the `question_asked` beacon carries no text → merge (after 7.1, 7.3, and JOS-69). Rollback is a plain revert; tracking is additive and side-effect-free on the interactions themselves.

## Open Questions

- None blocking. The delegated-vs-onClick decision (Decision 3) is settled here.
