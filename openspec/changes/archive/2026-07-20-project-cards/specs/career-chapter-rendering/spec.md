## ADDED Requirements

### Requirement: Chapter project entries link to their full project card when available
When a chapter's embedded project has a `projectId`, the system SHALL render a link from that project entry to its full standalone project card.

#### Scenario: Embedded project has a projectId
- **WHEN** a chapter's embedded project has a `projectId`
- **THEN** a "View full project" link is rendered, pointing at `#{projectId}` on the projects section

#### Scenario: Embedded project has no projectId
- **WHEN** a chapter's embedded project has no `projectId`
- **THEN** it renders exactly as before — outcome and metrics only, with no card link
