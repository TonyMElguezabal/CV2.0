## ADDED Requirements

### Requirement: Secrets are server-side only and never exposed to the client
The system SHALL read API keys and connection secrets (LLM API key, database URL, rate-limit credentials) only in server-side code, and SHALL NOT expose any secret in client-bundled code or public configuration.

#### Scenario: Client code is inspected for secrets
- **WHEN** the client-bundled code (any `"use client"` module) is inspected
- **THEN** no secret environment variable (LLM API key, database URL, rate-limit credentials) is referenced or present

#### Scenario: A secret is accidentally referenced client-side
- **WHEN** a client component references a secret environment variable
- **THEN** the automated security test fails, preventing the leak from shipping

### Requirement: Responses carry a Content-Security-Policy and hardening headers
The system SHALL send, on every page response, a Content-Security-Policy header and a set of security-hardening headers.

#### Scenario: Response headers are inspected
- **WHEN** any page response's headers are inspected
- **THEN** a `Content-Security-Policy` header is present that restricts `default-src`, `object-src`, `base-uri`, `form-action`, and `frame-ancestors`, and permits only same-origin `connect-src`

#### Scenario: Hardening headers are present
- **WHEN** any page response's headers are inspected
- **THEN** `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and `Strict-Transport-Security` are present

### Requirement: The public AI endpoint validates and bounds request input
The system SHALL validate and bound input to the public chat endpoint on the server, rejecting malformed or over-limit requests.

#### Scenario: An invalid chat request is received
- **WHEN** the chat endpoint receives an empty, over-length, or malformed request
- **THEN** it is rejected with a 4xx status and no model call is made

### Requirement: Chat conversations are never persisted server-side
The system SHALL NOT persist chat message content (visitor questions or model answers) to any server-side store; only anonymized, count-level analytics may be recorded.

#### Scenario: A chat request is served
- **WHEN** a visitor sends a chat message and receives an answer
- **THEN** no store retains the question or answer text, and any recorded analytics event carries only an event type and no message content

### Requirement: The security and privacy posture is documented and regression-guarded
The system SHALL document the security & privacy controls and back the machine-checkable ones with automated tests, so the posture is auditable and cannot silently regress.

#### Scenario: The posture is audited
- **WHEN** the security & privacy posture is audited
- **THEN** a written attestation lists the controls (server-side secrets, endpoint validation, CSP/headers, footer disclosure, anonymized analytics with no chat persistence), and the header shape and no-client-secrets guarantees are covered by automated tests
