## Purpose

Defines the reusable authoring template for career chapters and the requirement that real content — not fictional fixtures — populates `/content` once authoring begins, plus the associated build-validation and test-isolation guarantees.

## Requirements

### Requirement: Reusable chapter authoring template
The system SHALL provide a documented authoring template covering all seven §F3 chapter elements (role, business context, responsibilities, projects with outcomes/metrics, leadership highlight, technologies, lessons learned), located outside any directory scanned by content validation, so subsequent chapters can be authored without re-deriving the structure.

#### Scenario: Template is available and structurally complete
- **WHEN** the authoring template is inspected
- **THEN** it documents all seven §F3 elements and includes a copyable field-by-field structure

#### Scenario: Template does not interfere with content validation
- **WHEN** the build-time content validator runs
- **THEN** it does not scan or attempt to validate the template as a real experience file

### Requirement: First real chapter satisfies the content model
The system SHALL include one complete, real career chapter satisfying every field required by the `Experience` schema, with content reflecting the site owner's actual professional history rather than placeholder data.

#### Scenario: The chapter includes all seven §F3 elements
- **WHEN** `content/experience/oracle.yaml` is inspected
- **THEN** it contains company, role, dates, a one-line mission, business context, at least three responsibilities, two to four projects each with an outcome and at least one metric, one leadership story, at least one technology, and a lessons-learned reflection

### Requirement: No fictional content remains in the real content tree
The system SHALL NOT contain any placeholder or fictional content under `/content` once real chapter authoring has begun.

#### Scenario: Fictional fixtures are removed
- **WHEN** `/content` is inspected
- **THEN** no file named `acme-corp` or `dashboard-revamp` exists, and `skills.yaml` contains no evidence reference to either

### Requirement: Real content passes the build-time validation gate
The system SHALL pass `validateContent()` (Story 1.2) against the real `/content` directory once the fictional fixtures are replaced with real content.

#### Scenario: Validation passes against the real, updated content tree
- **WHEN** `validateContent()` runs with no arguments (the real `/content` directory)
- **THEN** the result is valid with no errors

### Requirement: Story 1.1's test suite is decoupled from specific real content
The system SHALL verify the content model's shape using isolated, non-real fixtures, so changes to real content never require corresponding test-code changes.

#### Scenario: Content shape tests use temporary fixtures, not the real content tree
- **WHEN** `lib/content/content.test.ts` runs
- **THEN** it asserts against temporary fixture data it creates and cleans up itself, not against files under the real `/content` directory
