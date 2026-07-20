## ADDED Requirements

### Requirement: Skills section is sourced from real skills.yaml data
The system SHALL render one entry per skill defined in `content/skills.yaml`, with no fixed count, hardcoded skill names, or placeholder content.

#### Scenario: Section reflects the real skill list
- **WHEN** the skills section renders
- **THEN** it shows exactly one entry per skill returned by `getSkills()`, using each skill's real `name`

### Requirement: Each skill's evidence links to the chapters that demonstrate it
Each skill SHALL render one link per id in its `evidence` array, each pointing at that chapter's Projects section anchor.

#### Scenario: A skill with one evidence chapter
- **WHEN** a skill with a single-entry `evidence` array is rendered
- **THEN** one link is present with `href="#{evidenceId}-projects"`

#### Scenario: A skill with multiple evidence chapters
- **WHEN** a skill with a multi-entry `evidence` array is rendered
- **THEN** one link per evidence id is present, each pointing at its own chapter's Projects section anchor

### Requirement: Evidence links are accessible out of context
Each evidence link SHALL have an accessible name that includes both the skill being evidenced and the chapter it links to, so its purpose is clear even without surrounding visual context.

#### Scenario: Accessible name includes skill and chapter context
- **WHEN** an evidence link's accessible name is computed
- **THEN** it includes the skill name and identifies the linked chapter (company and/or role), not just a bare "view" or company name

### Requirement: Skills section requires no JavaScript
The skills section and its evidence links SHALL be fully present and functional in server-rendered HTML, using only native anchor-link behavior.

#### Scenario: Section renders without client-side JavaScript
- **WHEN** the page's server-rendered HTML is inspected before any JavaScript executes
- **THEN** every skill and its evidence link(s) are present with real, working `href` values
