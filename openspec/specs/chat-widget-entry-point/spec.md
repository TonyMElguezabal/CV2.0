# chat-widget-entry-point

## Purpose

Defines the persistent, non-modal chat widget entry point on the site: the
"Ask about Jose" trigger available from every section, FAQ-sourced starter
questions shown on open, message submission (starter or free-text) to the
existing `POST /api/chat` endpoint, streamed answer/citation rendering, and
dismiss behavior. Consumes the streaming/citation contract defined by the
`streamed-chat-answers` capability without altering it.

## Requirements

### Requirement: Persistent entry point on every section
The system SHALL render an "Ask about Jose" chat entry point that is present regardless of which section of the site is being viewed, and that does not obscure or interrupt page content.

#### Scenario: Entry point present across the page
- **WHEN** any section of the site is viewed
- **THEN** the "Ask about Jose" trigger is present, rendered as a real `<button>`, and does not overlap or block the section's primary content

#### Scenario: Entry point reachable from the hero CTA
- **WHEN** the visitor activates the existing "Ask AI" call-to-action in the hero section
- **THEN** the same chat widget opens as when the persistent trigger is activated

### Requirement: Starter questions shown on open
The system SHALL show a set of suggested starter questions when the widget is opened, sourced from the site's FAQ content.

#### Scenario: Widget opened with no prior messages
- **WHEN** the widget is opened and no messages have been sent yet
- **THEN** a starter-question button is rendered for each of the configured FAQ questions

### Requirement: Selecting a starter question submits it as a message
The system SHALL treat selection of a starter question the same as the visitor typing and submitting that question themselves.

#### Scenario: A starter question is selected
- **WHEN** a visitor selects a starter question
- **THEN** the question's exact text is added to the conversation as a visitor message, and a request is sent to `POST /api/chat` with that text as the `question` field

#### Scenario: Free-text message is submitted
- **WHEN** a visitor types a question into the widget's input and submits it
- **THEN** the question is added to the conversation as a visitor message and a request is sent to `POST /api/chat` with that text as the `question` field, subject to the same client-side length limit as starter questions

### Requirement: Streamed answer and citations are rendered
The system SHALL render the assistant's answer as it streams from `POST /api/chat` and display its citations once the answer completes, without altering the existing SSE contract.

#### Scenario: Answer tokens arrive
- **WHEN** `token` events are received for the active request
- **THEN** each token is appended to the current assistant message as it arrives

#### Scenario: Citations arrive
- **WHEN** the `citations` event is received
- **THEN** the deduplicated citation list is displayed alongside the completed assistant message

#### Scenario: Request fails for a reason other than rate limiting or unavailability
- **WHEN** the request to `POST /api/chat` fails (network error or non-2xx response other than 429 or 503, or an error unrelated to service availability)
- **THEN** a single generic inline error message is shown in the conversation and no unhandled error is thrown

#### Scenario: Request fails because of rate limiting
- **WHEN** the request to `POST /api/chat` fails with a 429 status
- **THEN** a specific inline message stating the visitor has reached the usage limit is shown, including the site's contact links, and no unhandled error is thrown

#### Scenario: The AI service is unavailable
- **WHEN** the request to `POST /api/chat` fails with a 503 status, or an `error` event is received after streaming has already begun
- **THEN** a specific inline message stating the AI is temporarily unavailable is shown, including the site's contact links, and no unhandled error is thrown

### Requirement: A thinking indicator is shown while awaiting the first response token
The system SHALL show a pending "thinking" indicator in the conversation from the moment a question is submitted (starter or free-text) until the first answer token arrives, so the visitor has immediate feedback that the bot is processing. The indicator SHALL be presented as an assistant-styled element.

#### Scenario: A question is submitted
- **WHEN** a visitor submits a question and the request is in flight with no answer token received yet
- **THEN** a thinking indicator is shown in the conversation, styled as an assistant message

#### Scenario: The first answer token arrives
- **WHEN** the first `token` event is received for the active request
- **THEN** the thinking indicator is removed and the streaming assistant message renders in its place

#### Scenario: The request fails before any token
- **WHEN** the active request fails for any reason (429, 503, a generic non-2xx/network error, or a mid-stream `error` event) before an answer token has been shown
- **THEN** the thinking indicator is removed and the corresponding inline error message is shown, with the indicator never left lingering

### Requirement: The thinking indicator respects reduced motion and assistive technology
The thinking indicator SHALL show its final state with no motion when the visitor has `prefers-reduced-motion: reduce` set, SHALL announce a single "thinking" status to assistive technology rather than repeatedly announcing an animation, and SHALL preserve the widget's non-modal behavior.

#### Scenario: Reduced motion preferred
- **WHEN** the thinking indicator is shown with `prefers-reduced-motion: reduce` set
- **THEN** it appears in a static form (for example static text or static dots) with no bouncing, pulsing, or other looping animation

#### Scenario: Assistive technology encounters the indicator
- **WHEN** the thinking indicator is shown
- **THEN** a single "thinking" status is announced (via a status/live region) and the animated dots themselves are hidden from assistive technology, and the widget remains non-modal with its dismiss controls still working

### Requirement: Only one chat request is in flight at a time
The system SHALL prevent a new question from being submitted while a chat request is already in flight, by disabling the submit control until the active request completes or fails.

#### Scenario: The visitor tries to submit again while a request is in flight
- **WHEN** a chat request is in flight and the visitor attempts to submit another question
- **THEN** the submit control (button and Enter) is disabled and no second concurrent request is started

#### Scenario: The request completes or fails
- **WHEN** the active request finishes streaming its answer, or fails
- **THEN** the submit control is re-enabled so the visitor can send another question

### Requirement: Widget is non-modal
The system SHALL NOT block interaction with the rest of the page while the widget is open — no backdrop overlay, no scroll lock, and no keyboard focus trap.

#### Scenario: Widget is open
- **WHEN** the widget panel is open
- **THEN** elements outside the panel remain visible, clickable, and reachable by keyboard navigation, and no backdrop element is present

#### Scenario: The AI service is unavailable
- **WHEN** a request fails because the AI service is unavailable (429 or 503, or a mid-stream `error` event)
- **THEN** every other page control outside the widget remains fully usable, unaffected by the chat failure

### Requirement: Dismissing the widget leaves the page fully usable
The system SHALL return the page to a fully usable state when the widget is dismissed, with no residual UI blocking interaction.

#### Scenario: Widget is dismissed via the close control
- **WHEN** the visitor activates the widget's close control
- **THEN** the panel is hidden and every other on-page control remains focusable and clickable

#### Scenario: Widget is dismissed via the Escape key
- **WHEN** the widget is open and the visitor presses `Escape`
- **THEN** the panel is hidden and every other on-page control remains focusable and clickable

### Requirement: Recovery from a failed request requires no page reload
The system SHALL allow a visitor to resume normal chat behavior after a failed request by submitting another message, without a page reload.

#### Scenario: A subsequent message is submitted after a failure
- **WHEN** a visitor submits a new message after a prior request failed (for any reason, including rate limiting or unavailability)
- **THEN** the new message is sent and handled normally, without requiring the page to be reloaded

### Requirement: Trigger shows a hover/focus tooltip
The system SHALL show a small tooltip when the visitor hovers or keyboard-focuses the chat trigger while the panel is closed. The tooltip SHALL present a decorative robot emoji and the label "chat with me", SHALL dismiss on blur or mouse-leave, and SHALL NOT be shown while the panel is open. The tooltip text and label SHALL be sourced from the site's content, not hardcoded in components.

#### Scenario: Hovering the trigger
- **WHEN** the panel is closed and the visitor hovers the chat trigger
- **THEN** a tooltip appears showing a robot emoji and the label "chat with me"

#### Scenario: Keyboard-focusing the trigger
- **WHEN** the panel is closed and the visitor moves keyboard focus to the chat trigger
- **THEN** the same tooltip appears

#### Scenario: Tooltip dismissed
- **WHEN** the visitor moves the mouse away from the trigger or the trigger loses focus
- **THEN** the tooltip is no longer shown

#### Scenario: Tooltip hidden while open
- **WHEN** the chat panel is open
- **THEN** the trigger's tooltip is not shown

### Requirement: The trigger presents as an icon while keeping its accessible name
The chat trigger SHALL render as an icon with no visible text label, and SHALL retain the accessible name "Ask about Jose". The icon itself SHALL be hidden from assistive technology, and the trigger SHALL remain a real `<button>`.

This exists because an icon-only control with no accessible name is a WCAG 4.1.2 failure, and removing the visible label removes the trigger's accessible name unless one is supplied explicitly.

#### Scenario: Assistive technology reaches the icon trigger
- **WHEN** the chat trigger is reached by assistive technology
- **THEN** it is exposed as a button named "Ask about Jose", and the icon artwork is not announced

#### Scenario: The trigger is operated by keyboard
- **WHEN** the visitor focuses the trigger and activates it by keyboard
- **THEN** the chat panel opens, exactly as it does on click

### Requirement: The trigger meets non-text contrast against the page
The trigger's icon SHALL meet at least 3:1 contrast against the trigger's own background, and the trigger SHALL remain visible at every scroll position and viewport width.

#### Scenario: The trigger's icon contrast is measured
- **WHEN** the trigger's icon colour is measured against the filled background it renders on
- **THEN** it achieves at least 3:1

#### Scenario: The visitor scrolls the page
- **WHEN** the visitor scrolls to any position on the page
- **THEN** the trigger remains visible and operable without scrolling back

### Requirement: The bot artwork is served as a static asset
The bot artwork SHALL be served from the site's static assets at its display resolution, and SHALL NOT be embedded in the JavaScript bundle as inline encoded data.

This exists because the source mockup inlines the artwork as roughly 181 KB of base64, which would enter the initial bundle and consume most of the site's remaining performance headroom.

#### Scenario: The artwork's delivery is inspected
- **WHEN** the bot artwork's delivery mechanism is inspected
- **THEN** it resolves to a static asset request, not to encoded image data inside a JavaScript or CSS bundle

#### Scenario: The initial bundle is measured
- **WHEN** the initial JavaScript payload is measured after the restyle
- **THEN** it remains within the site's documented regression threshold

### Requirement: The bot's animation is transform-only and reduced-motion-safe
The bot's saluting animation SHALL animate only compositor-friendly properties, and SHALL render the bot at rest with no looping animation when the visitor has `prefers-reduced-motion: reduce` set.

This exists because a continuously looping animation longer than five seconds running alongside content is WCAG 2.2.2 territory; the reduced-motion guard is the accepted mitigation.

#### Scenario: The animation's properties are inspected
- **WHEN** the bot's animation is inspected
- **THEN** it animates only transform properties, driving no layout or paint

#### Scenario: Reduced motion preferred
- **WHEN** the bot is rendered with `prefers-reduced-motion: reduce` set
- **THEN** the arm renders in its rest position and no looping animation runs

### Requirement: Tooltip is decorative and non-interfering
The tooltip SHALL be decorative and SHALL NOT change the trigger's accessible name, obscure or block page content, or trap keyboard focus. The tooltip's robot emoji SHALL be hidden from assistive technology, and the trigger's own icon artwork SHALL likewise be hidden from assistive technology.

#### Scenario: Assistive technology encounters the trigger
- **WHEN** the chat trigger is reached by assistive technology
- **THEN** the trigger keeps its accessible name ("Ask about Jose"), and neither the tooltip's decorative emoji nor the trigger's own icon artwork is announced

#### Scenario: Tooltip does not block interaction
- **WHEN** the tooltip is shown
- **THEN** page content behind and around it remains visible and interactive, and no keyboard focus trap is introduced

### Requirement: Panel shows an animated greeting on open
The system SHALL show a prominent greeting when the panel is opened with no prior messages, positioned above the FAQ starter questions and animated so its characters appear progressively, as though being typed. The greeting text SHALL be sourced from the site's content, not hardcoded in components. The full greeting text SHALL be present in the document from the moment it is rendered, with only the appearance of each character animated — the animation SHALL NOT progressively insert text into the document.

This construction exists because progressive insertion causes assistive technology to announce a partial, shifting string; animating the appearance of already-present text leaves a single, complete string to announce.

#### Scenario: Panel opened with no prior messages
- **WHEN** the panel is opened and no messages have been sent yet
- **THEN** the content-sourced greeting is displayed above the starter questions, with its characters appearing progressively

#### Scenario: Assistive technology encounters the greeting
- **WHEN** assistive technology reaches the greeting
- **THEN** it announces the complete greeting text as a single string, and does not encounter the per-character markup

#### Scenario: The greeting text is complete in the document while animating
- **WHEN** the greeting is mid-animation
- **THEN** its full text is already present in the document, with only per-character appearance still animating

### Requirement: Greeting is intro-only
The greeting SHALL be shown only before the conversation begins; once the visitor sends the first message (starter or free-text), the greeting SHALL no longer be shown.

#### Scenario: First message sent
- **WHEN** the visitor sends the first message (by selecting a starter question or submitting free text)
- **THEN** the greeting is no longer shown

### Requirement: Tooltip and greeting respect reduced motion
The tooltip, greeting, bot animation, and idle invitation SHALL show their final state with no motion when the visitor has `prefers-reduced-motion: reduce` set, and their addition SHALL preserve the widget's non-modal behavior and the close button receiving focus on open.

#### Scenario: Reduced motion preferred
- **WHEN** the tooltip or greeting appears with `prefers-reduced-motion: reduce` set
- **THEN** it is shown in its final state with no fade, slide, or per-character animation

#### Scenario: Reduced motion applies to the bot and invitation
- **WHEN** the bot or the idle invitation is rendered with `prefers-reduced-motion: reduce` set
- **THEN** the bot renders at rest and the invitation appears with no entrance animation

#### Scenario: Non-modal behavior preserved
- **WHEN** the greeting is shown on open
- **THEN** the widget remains non-modal (no backdrop, scroll lock, or focus trap) and the close button receives focus
