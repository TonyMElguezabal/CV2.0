## ADDED Requirements

### Requirement: Generation failures are surfaced, not silently truncated
The system SHALL notify the client when answer generation fails, whether before streaming begins or after it has already started, rather than ending the response with no indication of failure.

#### Scenario: Generation fails before streaming begins
- **WHEN** retrieval or generation fails before any token has been streamed
- **THEN** the endpoint responds with a 503 status and a JSON body containing an error message and the site's contact links, and does not open a stream

#### Scenario: Generation fails after streaming has begun
- **WHEN** the provider's token stream fails after one or more `token` events have already been sent
- **THEN** an `error` event is sent before the stream closes, and no `citations` or `done` event follows
