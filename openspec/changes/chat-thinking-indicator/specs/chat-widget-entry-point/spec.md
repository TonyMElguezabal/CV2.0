## ADDED Requirements

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
