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

### Requirement: Tooltip is decorative and non-interfering
The tooltip SHALL be decorative and SHALL NOT change the trigger's accessible name, obscure or block page content, or trap keyboard focus. The robot emoji SHALL be hidden from assistive technology.

#### Scenario: Assistive technology encounters the trigger
- **WHEN** the chat trigger is reached by assistive technology
- **THEN** the trigger keeps its accessible name ("Ask about Jose") and the decorative robot is not announced

#### Scenario: Tooltip does not block interaction
- **WHEN** the tooltip is shown
- **THEN** page content behind and around it remains visible and interactive, and no keyboard focus trap is introduced

### Requirement: Panel shows an animated greeting on open
The system SHALL show a prominent greeting when the panel is opened with no prior messages, positioned above the FAQ starter questions and animated with a fade and slide-in entrance. The greeting text SHALL be sourced from the site's content, not hardcoded in components.

#### Scenario: Panel opened with no prior messages
- **WHEN** the panel is opened and no messages have been sent yet
- **THEN** the content-sourced greeting is displayed above the starter questions with a fade + slide-in animation

### Requirement: Greeting is intro-only
The greeting SHALL be shown only before the conversation begins; once the visitor sends the first message (starter or free-text), the greeting SHALL no longer be shown.

#### Scenario: First message sent
- **WHEN** the visitor sends the first message (by selecting a starter question or submitting free text)
- **THEN** the greeting is no longer shown

### Requirement: Tooltip and greeting respect reduced motion
The tooltip and greeting SHALL show their final state with no motion when the visitor has `prefers-reduced-motion: reduce` set, and their addition SHALL preserve the widget's non-modal behavior and the close button receiving focus on open.

#### Scenario: Reduced motion preferred
- **WHEN** the tooltip or greeting appears with `prefers-reduced-motion: reduce` set
- **THEN** it is shown in its final state with no fade or slide animation

#### Scenario: Non-modal behavior preserved
- **WHEN** the greeting is shown on open
- **THEN** the widget remains non-modal (no backdrop, scroll lock, or focus trap) and the close button receives focus
