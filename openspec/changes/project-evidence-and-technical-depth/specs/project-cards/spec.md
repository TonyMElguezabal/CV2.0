## MODIFIED Requirements

### Requirement: Project cards are sourced from real project content files
The system SHALL render one card per file under `content/projects/*.md`, with no fixed count or placeholder content, up to a stated maximum. Cards SHALL be ordered most-recent-first by the date of the chapter they belong to, rather than by filename.

The maximum exists because a project card carries an implicit claim — that this work was significant enough to write up — which only holds while the set stays selective. Beyond the cap, adding a project becomes a decision about which to displace.

#### Scenario: Section reflects the real project list
- **WHEN** the projects section renders
- **THEN** it shows exactly one card per project returned by `getProjects()`, up to the stated maximum

#### Scenario: Cards are ordered most recent first
- **WHEN** the projects section renders more than one card
- **THEN** they appear ordered by their originating chapter's date, most recent first

#### Scenario: The project set reaches the cap
- **WHEN** more project files exist than the stated maximum
- **THEN** the section renders the maximum rather than growing without limit, and the excess is a deliberate content decision rather than a silent truncation
