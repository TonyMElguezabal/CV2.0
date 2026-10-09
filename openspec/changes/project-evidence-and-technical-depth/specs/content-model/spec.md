## MODIFIED Requirements

### Requirement: Skills evidence references
Each entry in `skills.yaml` SHALL reference the experience chapter ID(s) and/or project ID(s) that evidence that skill, using the filename-slug ID convention (PRD v1.1 §4.4, §6). Each entry MAY additionally name the technologies that capability rests on, so a claim can be checked against the technology lists of the chapters it cites rather than only against their existence.

#### Scenario: Skill references resolve to existing content
- **WHEN** an entry in `skills.yaml` is read
- **THEN** its evidence references list one or more IDs that match an existing `experience/<company>.yaml` or `projects/<project>.md` filename slug

#### Scenario: A skill names the technologies it rests on
- **WHEN** an entry in `skills.yaml` carries a technologies list
- **THEN** it exposes that list as an optional field on the `Skill` TypeScript type, alongside its `name`, `evidence`, and `summary` fields

#### Scenario: A skill names no technologies
- **WHEN** an entry in `skills.yaml` carries no technologies list
- **THEN** it remains valid, and is read exactly as entries were read before the field existed
