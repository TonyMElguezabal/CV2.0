## Purpose

Defines how real career chapters are read from `content/experience/` and rendered as progressively-disclosed sections (collapsed summary by default, seven §F3 elements when expanded), keyboard-operable with visible focus.

## Requirements

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

### Requirement: Chapter content is readable without JavaScript
All chapter content — collapsed summary and the seven expanded §F3 elements — SHALL be present in the server-rendered HTML response, not gated behind client-side rendering, so it remains readable if JavaScript fails to load or execute.

#### Scenario: Server-rendered HTML contains full chapter content
- **WHEN** the page's raw HTML response is inspected before any JavaScript executes
- **THEN** every chapter's collapsed summary fields and all seven expanded §F3 elements are present in that HTML

### Requirement: Expand/collapse control functions without JavaScript
The chapter expand/collapse control SHALL be operable using only native browser behavior, requiring no JavaScript execution.

#### Scenario: Toggling a chapter with JavaScript unavailable
- **WHEN** a visitor activates a chapter's collapsed summary with JavaScript disabled or unavailable
- **THEN** the chapter expands to show its full content, using only native HTML/browser behavior

### Requirement: Collapsed chapters show a visible expand/collapse indicator
Each collapsed chapter's summary SHALL display a visible indicator that it is expandable, independent of hover state and independent of JavaScript.

#### Scenario: Indicator visible without hovering
- **WHEN** a chapter is collapsed and not being hovered or focused
- **THEN** a visible indicator (e.g., a chevron) signals that the chapter can be expanded

#### Scenario: Indicator reflects expanded state via CSS only
- **WHEN** a chapter is expanded
- **THEN** the indicator's visual state changes to reflect the expanded state, driven entirely by CSS reacting to the native `open` attribute, with no JavaScript involved

### Requirement: Chapter technologies link to evidence
Each technology listed in an expanded chapter's Technologies section SHALL be a real link to that chapter's own Projects section, not unlinked text.

#### Scenario: Technology renders as a link
- **WHEN** a chapter's Technologies section is inspected
- **THEN** each technology is rendered as an anchor element, not a plain text node

#### Scenario: Technology link lands on the chapter's Projects section
- **WHEN** a visitor activates a technology's link
- **THEN** the browser navigates to that same chapter's Projects section

### Requirement: Technology links are accessible out of context
Each technology link SHALL have an accessible name that conveys its purpose beyond the bare technology name, so its function is clear even without surrounding visual context.

#### Scenario: Accessible name includes the link's purpose
- **WHEN** a technology link's accessible name is computed
- **THEN** it includes both the technology name and an indication that it navigates to the Projects section

### Requirement: Each chapter is a valid navigation target
Each chapter's `<details>` element SHALL have an `id` attribute matching that chapter's experience id, so external links (such as timeline nodes) can navigate directly to it.

#### Scenario: Chapter has a matching id
- **WHEN** a chapter's `<details>` element is inspected
- **THEN** its `id` attribute matches that experience's id (the same id used for its Projects section, `{id}-projects`)

#### Scenario: Fragment navigation reaches the chapter
- **WHEN** a visitor follows a link to `#{experience.id}`
- **THEN** the browser scrolls to that chapter's `<details>` element, using only native browser fragment-navigation behavior
