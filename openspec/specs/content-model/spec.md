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

### Requirement: Skill narrative summary
Each entry in `skills.yaml` SHALL carry a non-empty `summary` of prose — written in third person and naming concrete tools, contexts, or outcomes — alongside its evidence references, so a skill is described rather than merely labelled and cross-referenced.

#### Scenario: Skill entry contains a prose summary
- **WHEN** an entry in `skills.yaml` is read
- **THEN** it exposes a non-empty `summary` string field matching the `Skill` TypeScript type, in addition to its `name` and `evidence` fields

#### Scenario: Every existing skill carries a summary
- **WHEN** `skills.yaml` is parsed
- **THEN** every entry present in the file has a `summary`, with no entry relying on evidence references alone

### Requirement: FAQ content shape
The `faq.md` file SHALL contain curated question-and-answer pairs available to strengthen chatbot answers (PRD v1.1 §6, §7).

#### Scenario: FAQ file contains at least one question-answer pair
- **WHEN** `faq.md` is parsed
- **THEN** it contains at least one distinguishable question paired with its answer

### Requirement: Site-meta content shape
The system SHALL store a single `content/meta.md` file describing the site itself — its content-first architecture, build-time retrieval index, and grounded-generation pipeline — as a first-class content source, so questions about this site and the AI stack behind it are answerable from indexed evidence rather than refused. Its frontmatter SHALL carry a title and topic tags, and its body SHALL narrate the site's purpose, how its content is authored, and how the chatbot retrieves and generates answers.

#### Scenario: Meta file contains frontmatter and narrative body
- **WHEN** `content/meta.md` is parsed
- **THEN** its frontmatter exposes `title` and `topics` fields matching the `Meta` TypeScript type, and its body contains sections narrating the site's purpose, content authoring model, and chatbot retrieval-and-generation pipeline

#### Scenario: Meta content states no model identifier literally
- **WHEN** `content/meta.md` is inspected
- **THEN** it contains no hardcoded LLM or embedding model identifier string, because those values are resolved from code at index-build time
