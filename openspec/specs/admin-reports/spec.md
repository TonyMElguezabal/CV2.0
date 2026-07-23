## Purpose

Owner-only reporting over the anonymized analytics store — aggregate and
trend reports for traffic, engagement depth, chat usage, and conversions,
surfaced on the protected `/admin` dashboard. Exposes only anonymized
aggregates: no PII, no raw per-session rows.

## Requirements

### Requirement: The dashboard reports traffic
The system SHALL report site traffic to the owner as aggregate counts and a time trend derived from stored analytics events.

#### Scenario: Traffic aggregates are shown
- **WHEN** the owner opens the dashboard and the event store contains page-view events
- **THEN** the dashboard shows the total page-view count and the count of unique visit sessions

#### Scenario: Traffic trend over time
- **WHEN** the owner views the traffic report
- **THEN** page views are shown as a trend bucketed by day (or week), so change over time is visible

#### Scenario: Traffic breakdown by dimension
- **WHEN** the owner views the traffic report
- **THEN** traffic is broken down by the stored non-identifying dimensions (device class, country or region, referrer domain)

### Requirement: The dashboard reports engagement depth
The system SHALL report how deeply visitors engage, as aggregate measures that map to the launch engagement targets.

#### Scenario: Session duration and chapter reach
- **WHEN** the owner views the engagement report and the store contains multiple sessions with section-reach events
- **THEN** the dashboard shows the median session duration and the share of sessions that reached the second career chapter

#### Scenario: Depth distribution
- **WHEN** the owner views the engagement report
- **THEN** the dashboard shows how far into the content sessions get (deepest-section and/or scroll-depth distribution)

### Requirement: The dashboard reports chat usage
The system SHALL report chatbot engagement as counts and a share of sessions, without exposing any question text.

#### Scenario: Chat open and question counts
- **WHEN** the owner views the chat report
- **THEN** the dashboard shows how many sessions opened the chat (and their share of all sessions) and the count of questions asked

#### Scenario: No question text is exposed
- **WHEN** the chat report is rendered
- **THEN** it shows only counts derived from `question_asked` events and never any question text, because no such text is stored

### Requirement: The dashboard reports conversions
The system SHALL report action/conversion events — résumé downloads and contact clicks — as aggregate counts.

#### Scenario: Conversion counts
- **WHEN** the owner views the conversions report and the store contains résumé-download and contact-click events
- **THEN** the dashboard shows the résumé-download count and the contact-click count broken down by contact target (scheduling, email, LinkedIn)

### Requirement: Reports expose only anonymized aggregates
The system SHALL surface only aggregated, anonymized metrics — never raw per-session rows or any personally identifying information.

#### Scenario: A report result is inspected
- **WHEN** any report value returned to the dashboard is inspected
- **THEN** it is an aggregate (count, share, median, distribution, or trend bucket) and contains no raw IP, User-Agent, email, name, free-text input, or individual session record

### Requirement: Reports are owner-only
The system SHALL make the reports reachable only through the owner-gated admin surface, never on the public site.

#### Scenario: Reports live behind the admin gate
- **WHEN** the reports are rendered
- **THEN** they are served only on the owner-authenticated `/admin` surface, which remains excluded from search indexing, and no report data is exposed on any public route

### Requirement: The dashboard handles an empty event store
The system SHALL render a clear empty state when no analytics data exists yet, rather than erroring or showing misleading zeros without context.

#### Scenario: No events recorded yet
- **WHEN** the owner opens the dashboard and the event store contains no events
- **THEN** the dashboard shows an explicit "no data yet" state instead of failing or rendering an empty/broken report

### Requirement: Reports are computed without a live database in tests
The system SHALL support unit-testing every report's aggregation logic against fixture events with no real database or network call, mirroring the analytics store's injectable-fake pattern.

#### Scenario: Unit test with fixture events
- **WHEN** the reporting layer is exercised with an in-memory fake populated by fixture events
- **THEN** each report's aggregate values and trend buckets are verifiable deterministically with no real database or network call
