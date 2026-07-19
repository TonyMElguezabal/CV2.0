## ADDED Requirements

### Requirement: Chapters are read from every experience content file
The system SHALL read every file under `content/experience/*.yaml`, parse each through `ExperienceSchema`, and expose the result as a list, with each chapter's `id` computed as its filename without extension.

#### Scenario: All experience files are included
- **WHEN** `getExperiences()` is called
- **THEN** it returns one entry per file under `content/experience/`, each with an `id` matching its filename slug

### Requirement: Chapters render collapsed by default
Each chapter SHALL render in a collapsed state by default, showing role, company, mission, and a formatted date range.

#### Scenario: Initial page load
- **WHEN** the chapter list renders
- **THEN** each chapter shows its role, company, mission, and date range, with the seven §F3 elements not visible

### Requirement: Expanded chapters render all seven §F3 elements in order
When a chapter is expanded, it SHALL render, in order: role header, business context, actions (responsibilities), 2–4 projects with metrics, leadership highlight, technologies, and lessons learned.

#### Scenario: A chapter is expanded
- **WHEN** a visitor expands a chapter
- **THEN** all seven elements render in the specified order, sourced from that chapter's real content fields

### Requirement: Expand/collapse is keyboard-operable with visible focus
The expand/collapse interaction SHALL be operable using only a keyboard, with a visible focus indicator on the interactive control.

#### Scenario: Keyboard-only expansion
- **WHEN** a visitor tabs to a chapter's collapsed summary and presses Enter or Space
- **THEN** the chapter expands, and the summary control shows a visible focus indicator throughout

### Requirement: Chapter rendering scales to any number of chapters
The chapter list SHALL render every chapter returned by `getExperiences()`, without assuming a fixed count or a specific chapter identity.

#### Scenario: A second chapter is added
- **WHEN** a second file exists under `content/experience/`
- **THEN** the chapter list renders both chapters, each independently collapsible/expandable
