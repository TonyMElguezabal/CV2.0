## MODIFIED Requirements

### Requirement: Experience content shape
Each `experience/<company>.yaml` file SHALL represent one career chapter, identified by its filename slug, and SHALL contain role, dates, business context, responsibilities, projects, leadership stories, technologies, and lessons learned (PRD v1.1 §6, §F3). Each embedded project MAY carry an optional `projectId` referencing a `projects/<project>.md` filename slug, linking that chapter project to its full standalone card.

#### Scenario: Experience file contains required fields
- **WHEN** an `experience/<company>.yaml` file is parsed
- **THEN** it exposes `role`, `dates`, `context`, `responsibilities`, `projects`, `leadership`, `technologies`, and `lessons` fields matching the `Experience` TypeScript type, and its chapter ID is its filename without extension

#### Scenario: An embedded project references its standalone card
- **WHEN** an embedded project in an `experience/<company>.yaml` file has a `projectId`
- **THEN** that id matches an existing `projects/<project>.md` filename slug

#### Scenario: An embedded project has no standalone card
- **WHEN** an embedded project has no `projectId`
- **THEN** it remains valid and renders without a link to a full project card
