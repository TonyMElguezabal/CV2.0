## Purpose

Defines the structure and shape of `/content` — the version-controlled, structured content that is the single source of truth for both the rendered site and the chatbot's retrieval corpus (PRD v1.1 §6).

## Requirements

### Requirement: Content file structure
The system SHALL store all profile content — profile, experience, projects, skills, and FAQ — as version-controlled structured files under `/content`, kept separate from UI components, so the site and the chatbot consume one authoritative source (PRD v1.1 §6).

#### Scenario: All content types exist as structured files
- **WHEN** the `/content` directory is inspected
- **THEN** `profile.yaml`, at least one `experience/<company>.yaml` file, at least one `projects/<project>.md` file, `skills.yaml`, and `faq.md` are present, and no equivalent career content is hardcoded in any UI component

### Requirement: Profile content shape
The `profile.yaml` file SHALL contain the site owner's name, positioning statement, summary, links, and contact information as a typed structure.

#### Scenario: Profile file contains required fields
- **WHEN** `profile.yaml` is parsed
- **THEN** it exposes `name`, `positioning`, `summary`, `links`, and `contact` fields matching the `Profile` TypeScript type

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

### Requirement: Project content shape
Each `projects/<project>.md` file SHALL represent one project, identified by its filename slug, with frontmatter carrying title, company, skills, and metrics, and a body narrating the problem, approach, and outcome (PRD v1.1 §6).

#### Scenario: Project file contains frontmatter and narrative body
- **WHEN** a `projects/<project>.md` file is parsed
- **THEN** its frontmatter exposes `title`, `company`, `skills`, and `metrics` fields matching the `Project` TypeScript type, its body contains problem/approach/outcome narrative content, and its project ID is its filename without extension

### Requirement: Skills evidence references
Each entry in `skills.yaml` SHALL reference the experience chapter ID(s) and/or project ID(s) that evidence that skill, using the filename-slug ID convention (PRD v1.1 §4.4, §6).

#### Scenario: Skill references resolve to existing content
- **WHEN** an entry in `skills.yaml` is read
- **THEN** its evidence references list one or more IDs that match an existing `experience/<company>.yaml` or `projects/<project>.md` filename slug

### Requirement: FAQ content shape
The `faq.md` file SHALL contain curated question-and-answer pairs available to strengthen chatbot answers (PRD v1.1 §6, §7).

#### Scenario: FAQ file contains at least one question-answer pair
- **WHEN** `faq.md` is parsed
- **THEN** it contains at least one distinguishable question paired with its answer
