## ADDED Requirements

### Requirement: Site-meta content shape
The system SHALL store a single `content/meta.md` file describing the site itself — its content-first architecture, build-time retrieval index, and grounded-generation pipeline — as a first-class content source, so questions about this site and the AI stack behind it are answerable from indexed evidence rather than refused. Its frontmatter SHALL carry a title and topic tags, and its body SHALL narrate the site's purpose, how its content is authored, and how the chatbot retrieves and generates answers.

#### Scenario: Meta file contains frontmatter and narrative body
- **WHEN** `content/meta.md` is parsed
- **THEN** its frontmatter exposes `title` and `topics` fields matching the `Meta` TypeScript type, and its body contains sections narrating the site's purpose, content authoring model, and chatbot retrieval-and-generation pipeline

#### Scenario: Meta content states no model identifier literally
- **WHEN** `content/meta.md` is inspected
- **THEN** it contains no hardcoded LLM or embedding model identifier string, because those values are resolved from code at index-build time

### Requirement: Skill narrative summary
Each entry in `skills.yaml` SHALL carry a non-empty `summary` of prose — written in third person and naming concrete tools, contexts, or outcomes — alongside its evidence references, so a skill is described rather than merely labelled and cross-referenced.

#### Scenario: Skill entry contains a prose summary
- **WHEN** an entry in `skills.yaml` is read
- **THEN** it exposes a non-empty `summary` string field matching the `Skill` TypeScript type, in addition to its `name` and `evidence` fields

#### Scenario: Every existing skill carries a summary
- **WHEN** `skills.yaml` is parsed
- **THEN** every entry present in the file has a `summary`, with no entry relying on evidence references alone
