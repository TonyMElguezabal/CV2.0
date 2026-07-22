## MODIFIED Requirements

### Requirement: Streamed answer and citations are rendered
The system SHALL render the assistant's answer as it streams from `POST /api/chat` and display its citations once the answer completes, without altering the existing SSE contract.

#### Scenario: Answer tokens arrive
- **WHEN** `token` events are received for the active request
- **THEN** each token is appended to the current assistant message as it arrives

#### Scenario: Citations arrive
- **WHEN** the `citations` event is received
- **THEN** the deduplicated citation list is displayed alongside the completed assistant message

#### Scenario: Request fails for a reason other than rate limiting
- **WHEN** the request to `POST /api/chat` fails (network error or non-2xx response other than 429)
- **THEN** a single generic inline error message is shown in the conversation and no unhandled error is thrown

#### Scenario: Request fails because of rate limiting
- **WHEN** the request to `POST /api/chat` fails with a 429 status
- **THEN** a specific inline message stating the visitor has reached the usage limit is shown, including the site's contact links, and no unhandled error is thrown
