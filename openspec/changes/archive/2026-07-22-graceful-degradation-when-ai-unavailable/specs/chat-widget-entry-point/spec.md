## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Recovery from a failed request requires no page reload
The system SHALL allow a visitor to resume normal chat behavior after a failed request by submitting another message, without a page reload.

#### Scenario: A subsequent message is submitted after a failure
- **WHEN** a visitor submits a new message after a prior request failed (for any reason, including rate limiting or unavailability)
- **THEN** the new message is sent and handled normally, without requiring the page to be reloaded
