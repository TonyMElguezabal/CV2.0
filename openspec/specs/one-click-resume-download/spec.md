## Purpose

A recruiter-facing one-click download of the single pre-approved,
statically-hosted résumé PDF (PRD §5 F6, story 6.1 / JOS-68). Each download
is tracked as an anonymized `resume_download` conversion event, and no
dynamic PDF generation exists anywhere in the system — the résumé is served
exclusively as a static asset.

## Requirements

### Requirement: A résumé CTA downloads the pre-approved PDF in one click
The system SHALL let a visitor download the single pre-approved, statically-hosted résumé PDF in one click from any résumé call-to-action, with no intermediate step.

#### Scenario: Clicking the résumé CTA
- **WHEN** a visitor activates a résumé download call-to-action
- **THEN** the browser downloads the pre-approved, statically-hosted résumé PDF directly, in a single action

#### Scenario: The saved file has a professional name
- **WHEN** the résumé PDF is downloaded
- **THEN** it is saved under a human-readable, professional filename rather than an internal asset name

### Requirement: Each résumé download is tracked as a conversion event
The system SHALL record a `resume_download` conversion event each time a visitor triggers a résumé download, using the anonymized first-party analytics pipeline, without blocking or delaying the download.

#### Scenario: A download emits a conversion event
- **WHEN** a visitor triggers a résumé download from a résumé CTA
- **THEN** a `resume_download` event is emitted through the first-party analytics transport, and the download proceeds unaffected whether or not the event send succeeds

#### Scenario: The tracking carries no personal data
- **WHEN** a `resume_download` event is emitted
- **THEN** it carries only the anonymized fields the analytics model allows (no name, email, or other personal identifier)

### Requirement: No dynamic PDF generation exists
The system SHALL serve the résumé exclusively as a single static asset and SHALL NOT generate résumé PDFs dynamically.

#### Scenario: Inspecting how the résumé is served
- **WHEN** the résumé delivery path is inspected
- **THEN** the résumé is a single statically-hosted file with no server-side or on-demand PDF generation anywhere in the system
