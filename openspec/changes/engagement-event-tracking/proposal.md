## Why

Page views and scroll depth (7.1) tell you people arrive and read, but not whether the site drives *action* — the §10.3–10.4 success criteria (≥25% open the chat; résumé downloads + contact clicks measurably occur). This story instruments the four conversion/engagement interactions that already exist — chat open, question asked, résumé download, contact click — to emit events into the first-party store, with the hard privacy rule that a question is counted, never captured.

## What Changes

- Emit `chat_open` when the chat widget is opened (from the single `ChatWidgetContext.openChat` choke point, so both the persistent trigger and the hero "Ask AI" CTA are covered).
- Emit `question_asked` when a chat question is submitted — **count + timestamp only, never the question text** (AC2, hard PRD §F8 rule). `track()` is called with no text argument, and 7.3's schema has no field it could land in — defense in depth.
- Emit `resume_download` when the résumé link is activated, and `contact_click` (carrying `contactTarget` ∈ `scheduling|email|linkedin`) when a contact link is activated.
- For the link-click events (résumé, contact), use a **declarative `data-analytics-*` attribute + a single delegated click listener** rather than threading an `onClick` into every link — this keeps JOS-69's `ContactSection` a server component (no client wrapper needed) and centralizes link tracking. The chat events fire directly from their already-client components.
- **Out of scope**: the `track()` helper + session id (7.1, `cookieless-analytics-baseline`), the `POST /api/events` endpoint + store (7.3, `analytics-event-store`), and `page_view`/`section_reach` (7.1). This story only wires the four interaction events into the existing `track()`.

## Capabilities

### New Capabilities
- `engagement-event-tracking`: the requirement that the four engagement/conversion interactions emit their corresponding analytics events, including the count-only privacy rule for questions.

### Modified Capabilities
_None._ The instrumented interactions keep their existing behavior (the widget still opens, the résumé still downloads, the contact links still navigate) — tracking is an additive side effect, not a change to those capabilities' requirements.

## Impact

- **Depends on**: `cookieless-analytics-baseline` (7.1, JOS-70 — the `track()` helper + delegated-click infrastructure) and `analytics-event-store` (7.3, JOS-72 — the endpoint), both proposed; and `contact-options` (JOS-69 — the `ContactSection` links to instrument), in-flight. Applies after those land.
- **Modified files**: `components/ChatWidgetContext.tsx` (fire `chat_open` in `openChat`), `components/ChatWidget.tsx` (fire `question_asked`, no text), `components/HeroCtas.tsx` (résumé link gets `data-analytics-*`), `components/ContactSection.tsx` (contact links get `data-analytics-*` incl. target), and the delegated click listener (added to 7.1's `AnalyticsTracker`). Plus the corresponding test files.
- **No new dependencies, no new env vars, no server code.**
