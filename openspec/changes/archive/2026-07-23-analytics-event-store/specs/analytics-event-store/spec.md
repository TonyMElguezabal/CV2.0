## ADDED Requirements

### Requirement: Events are persisted per the anonymized data model
The system SHALL persist each accepted analytics event as an `AnalyticsEvent` grouped under a `VisitSession`, per `docs/data-model.md`, storing only the fields that model defines.

#### Scenario: A valid event is submitted
- **WHEN** a valid event is submitted to `POST /api/events` with a session id
- **THEN** an `AnalyticsEvent` is recorded and associated with a `VisitSession` for that session id

#### Scenario: The first event of a session
- **WHEN** an event arrives with a session id not seen before
- **THEN** a new `VisitSession` is created with its `startedAt` and `lastEventAt` set, and the event is associated with it

#### Scenario: A subsequent event in an existing session
- **WHEN** an event arrives with a session id that already has a `VisitSession`
- **THEN** the existing session's `lastEventAt` is updated and no duplicate session is created

### Requirement: Stored records contain no PII
The system SHALL NOT store any personally identifying information — no raw IP address, no User-Agent string, no name or email, and no free-text visitor input — in any analytics record.

#### Scenario: A stored record is inspected
- **WHEN** any persisted `VisitSession` or `AnalyticsEvent` record is inspected
- **THEN** it contains no raw IP address, no User-Agent string, no email or name, and no free-text visitor input

#### Scenario: A question_asked event is stored
- **WHEN** a `question_asked` event is persisted
- **THEN** no field on the stored record carries the question's text, because the schema defines no such field

### Requirement: Non-identifying dimensions are derived server-side
The system SHALL derive `countryOrRegion`, `referrerDomain`, and `deviceClass` from request headers on the server and discard the raw source values, never accepting these dimensions from the client.

#### Scenario: Dimensions are derived and raw inputs discarded
- **WHEN** an event request is processed
- **THEN** `countryOrRegion` is derived from the IP-country header (the raw IP is not stored), `referrerDomain` is reduced to the referrer's host only (path and query discarded), and `deviceClass` is mapped from the User-Agent to one of `mobile`, `tablet`, or `desktop` (the raw User-Agent is not stored)

#### Scenario: Client attempts to supply a dimension
- **WHEN** a request body includes a `countryOrRegion`, `referrerDomain`, or `deviceClass` value
- **THEN** the client-supplied value is ignored and the server-derived value is used

### Requirement: The event endpoint validates input and rejects malformed events
The system SHALL validate every `POST /api/events` request against the event schema and reject malformed events with a 4xx status, without persisting anything.

#### Scenario: Unknown event type
- **WHEN** a request has an `eventType` that is not one of the defined enum values
- **THEN** the endpoint responds with a 4xx status and persists nothing

#### Scenario: Missing required conditional field
- **WHEN** a `section_reach` event lacks `sectionId`, or a `contact_click` event lacks a valid `contactTarget`
- **THEN** the endpoint responds with a 4xx status and persists nothing

#### Scenario: Malformed JSON body
- **WHEN** the request body is not valid JSON
- **THEN** the endpoint responds with a 4xx status and persists nothing

### Requirement: The event timestamp is set by the server
The system SHALL set each event's `occurredAt` on the server and SHALL NOT trust a client-supplied timestamp.

#### Scenario: Client sends a timestamp
- **WHEN** a request body includes an `occurredAt` value
- **THEN** the stored event's `occurredAt` is the server's UTC time, not the client-supplied value

### Requirement: The event endpoint is rate limited
The system SHALL rate limit `POST /api/events` to protect the public write endpoint from abuse, reusing the application's existing rate-limit mechanism.

#### Scenario: A source exceeds the limit
- **WHEN** requests from a source exceed the configured rate limit
- **THEN** further requests are rejected without persisting, until the window resets

#### Scenario: The rate-limit store is unavailable
- **WHEN** the rate-limit backend errors
- **THEN** the request is allowed through (fail-open), consistent with the chat endpoint's behavior

### Requirement: Persistence and anonymization are testable without a live database
The system SHALL support unit-testing the endpoint, validation, and anonymization using an injected in-memory store and pure header-derivation helpers, with no real database or network calls.

#### Scenario: Unit test with an injected fake store
- **WHEN** the endpoint is exercised with an injected in-memory `AnalyticsStore` fake and fixture request headers
- **THEN** validation, server-set `occurredAt`, derived dimensions, and session upsert are all verifiable without any real database or network call
