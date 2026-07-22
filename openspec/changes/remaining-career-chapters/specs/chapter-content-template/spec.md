## ADDED Requirements

### Requirement: Full seven-chapter career corpus satisfies the content model
The system SHALL include all seven of the site owner's real career chapters, each complete per the content model, satisfying the PRD §11 Phase 3 "all chapters" deliverable.

#### Scenario: All seven chapters exist and validate
- **WHEN** `content/experience/` is inspected
- **THEN** it contains `oracle.yaml`, `envato.yaml`, `tiempo.yaml`, `tcs-banamex.yaml`, `tcs-bcp.yaml`, `tcs-ge.yaml`, and `ibm.yaml`, and `validateContent()` reports no errors for any of them

#### Scenario: Every new chapter is referenced by at least one skill
- **WHEN** `content/skills.yaml` is inspected
- **THEN** each of `tiempo`, `tcs-banamex`, `tcs-bcp`, `tcs-ge`, and `ibm` appears in at least one skill's evidence list

## MODIFIED Requirements

### Requirement: No fictional content remains in the real content tree
The system SHALL NOT contain any placeholder or fictional content under `/content` once real chapter authoring has begun, including in `faq.md`.

#### Scenario: Fictional fixtures are removed
- **WHEN** `/content` is inspected
- **THEN** no file named `acme-corp` or `dashboard-revamp` exists, and `skills.yaml` contains no evidence reference to either

#### Scenario: FAQ content is real, not a placeholder
- **WHEN** `content/faq.md` is inspected
- **THEN** it contains no fictional company names or fabricated stories, and every answer is grounded in facts present elsewhere in the real content corpus
