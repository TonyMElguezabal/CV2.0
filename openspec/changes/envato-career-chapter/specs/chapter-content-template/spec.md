## ADDED Requirements

### Requirement: Second real chapter satisfies the content model
The system SHALL include a second complete, real career chapter satisfying every field required by the `Experience` schema, with content reflecting the site owner's actual professional history rather than placeholder data.

#### Scenario: The chapter includes all seven §F3 elements
- **WHEN** `content/experience/envato.yaml` is inspected
- **THEN** it contains company, role, dates, a one-line mission, business context, at least three responsibilities, two to four projects each with an outcome and at least one metric, one leadership story, at least one technology, and a lessons-learned reflection

### Requirement: Phase 2 quality gate — two polished chapters
The system SHALL satisfy the PRD §12 Phase 2 entry gate once at least two real career chapters are authored, each complete per the content model and each with every claimed skill traced to a project, outcome, metric, or leadership story (§4.4).

#### Scenario: Both chapters pass validation together
- **WHEN** `validateContent()` runs against the real `/content` directory with both `oracle.yaml` and `envato.yaml` present
- **THEN** the result is valid with no errors

#### Scenario: Every claimed skill across both chapters links to evidence
- **WHEN** `content/skills.yaml` is inspected
- **THEN** every skill entry's evidence list references at least one existing chapter (`oracle`, `envato`, or both), and no chapter's `technologies` implies a skill claim that lacks a corresponding `skills.yaml` entry
