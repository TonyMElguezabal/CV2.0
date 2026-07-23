## ADDED Requirements

### Requirement: Page views and section reach are recorded
The system SHALL record a page-view event on page load and a section-reach event the first time each major section enters the viewport, sending them to the first-party events endpoint.

#### Scenario: Page load
- **WHEN** the page loads
- **THEN** a `page_view` event is sent to `POST /api/events` for the current page path

#### Scenario: A section enters the viewport
- **WHEN** a major section enters the viewport for the first time during the page's lifetime
- **THEN** a `section_reach` event carrying that section's id and a scroll-depth milestone is sent, and it is not re-sent for the same section on subsequent re-entries

### Requirement: Instrumentation is fire-and-forget and never affects the page
The system SHALL send analytics events without blocking rendering or navigation, and SHALL swallow any send failure so it cannot surface to the visitor.

#### Scenario: The events endpoint is unavailable
- **WHEN** an analytics event is sent and the request fails or the transport is unavailable
- **THEN** no error propagates to the page and rendering/navigation is unaffected

#### Scenario: Payload carries only client-known fields
- **WHEN** an analytics event is sent
- **THEN** its payload contains the session id, event type, page path, and (for `section_reach`) the section id and scroll-depth milestone, and it does not include a timestamp or any derived dimension

### Requirement: A single cookieless, fingerprint-free session id is used
The system SHALL identify a visit using one in-memory, per-tab random session id shared between chat and analytics, derived from no cookie, no persistent storage, and no fingerprinting signal.

#### Scenario: Session id provenance
- **WHEN** the session id is generated
- **THEN** it is a random identifier not derived from IP address, User-Agent, or any fingerprinting technique, and it is not persisted in a cookie or local storage

#### Scenario: Shared across chat and analytics
- **WHEN** both a chat request and an analytics event are sent within the same tab session
- **THEN** they carry the same session id

### Requirement: No cookies, storage, or fingerprinting are used
The system SHALL set no cookies, write to no persistent client storage, and perform no fingerprinting for analytics.

#### Scenario: Instrumentation is inspected
- **WHEN** the analytics instrumentation runs
- **THEN** it writes no `document.cookie`, uses no `localStorage`/`sessionStorage`, and collects no fingerprinting signal

### Requirement: No consent banner is shown, and a footer discloses the analytics
The system SHALL show no cookie/consent banner, and SHALL disclose the cookieless first-party analytics (including retention) in a site footer.

#### Scenario: The site loads
- **WHEN** the site loads
- **THEN** no cookie-consent banner is displayed

#### Scenario: The footer is inspected
- **WHEN** the site footer is rendered
- **THEN** it contains a disclosure stating that anonymous, cookieless usage analytics are collected and the retention period
