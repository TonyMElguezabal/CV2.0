## ADDED Requirements

### Requirement: Per-IP request rate limiting
The system SHALL reject `POST /api/chat` requests from an IP address that has sent 10 or more messages within the preceding 5 minutes, without performing retrieval, embedding, or generation for the rejected request.

#### Scenario: IP under the limit
- **WHEN** an IP address has sent fewer than 10 messages within the preceding 5 minutes and sends another
- **THEN** the request proceeds to retrieval and generation as normal

#### Scenario: IP over the limit
- **WHEN** an IP address has sent 10 messages within the preceding 5 minutes and sends another
- **THEN** the endpoint responds with a 429 status carrying a polite fallback message and contact links, and performs no retrieval, embedding, or generation

### Requirement: Per-session request cap (best-effort)
The system SHALL reject `POST /api/chat` requests once a client-provided session token has been associated with 20 or more messages, as a best-effort secondary control layered on top of the per-IP limit.

#### Scenario: Session at the cap
- **WHEN** a session token has been associated with 20 messages and another request is sent with that same token
- **THEN** the endpoint responds with a 429 status carrying the same polite fallback message and contact links, and performs no retrieval, embedding, or generation

### Requirement: Rate-limit rejection includes a contactable fallback
The system SHALL include the site's contact information in any rate-limit rejection response, so a visitor who is blocked can still reach out directly.

#### Scenario: A rejection response is inspected
- **WHEN** a request is rejected for exceeding the per-IP or per-session limit
- **THEN** the response body includes a message explaining the limit and the site's contact links (email and scheduling)

### Requirement: Generation output is capped
The system SHALL cap generated answer length to approximately 400 output tokens on every request.

#### Scenario: An answer is generated
- **WHEN** the LLM provider generates a response, streamed or non-streamed
- **THEN** the request to the provider specifies a maximum output of approximately 400 tokens

### Requirement: Rate limiting is testable without a live store
The system SHALL support unit-testing the rate-limit decision logic using an injected fake store, with no real network calls to the rate-limit backend.

#### Scenario: Unit test with a fake store
- **WHEN** the rate limiter is exercised with an injected in-memory fake store standing in for the real backend
- **THEN** it correctly allows requests under the configured limit and rejects requests at or over it, without making any real network call
