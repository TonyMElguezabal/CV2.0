## Purpose

Defines the interactive career timeline: a vertical rail of nodes, one per real career chapter, letting a visitor see career progression at a glance and jump directly to any chapter.

## Requirements

### Requirement: Timeline is sourced from real experience data
The system SHALL render one timeline node per entry returned by `getExperiences()`, with no fixed count or hardcoded chapter identity, and no placeholder content.

#### Scenario: Timeline reflects the real chapter list
- **WHEN** the timeline renders
- **THEN** it shows exactly one node per experience returned by `getExperiences()`, in the same order

#### Scenario: A chapter is added or removed
- **WHEN** the number of files under `content/experience/` changes
- **THEN** the timeline's node count changes to match, without any code change

### Requirement: Each node shows company and date range, with full context in its accessible name
Each timeline node SHALL visibly display the experience's company and formatted date range, and SHALL have an accessible name that also includes the role.

#### Scenario: Node visible label
- **WHEN** a timeline node is inspected
- **THEN** it visibly shows the company name and a formatted date range (matching the same format used in the chapter's collapsed summary)

#### Scenario: Node accessible name includes the role
- **WHEN** a timeline node's accessible name is computed
- **THEN** it includes the role, the company, and the date range, even though the visible label only shows company and dates

### Requirement: Activating a node navigates to that chapter
Each timeline node SHALL be a real anchor link that navigates the browser to its corresponding chapter, using only native HTML behavior.

#### Scenario: Node links to the matching chapter
- **WHEN** a timeline node's `href` is inspected
- **THEN** it is a fragment link (`#{experience.id}`) matching that chapter's `<details>` element id

#### Scenario: Activation works without JavaScript
- **WHEN** a visitor activates a timeline node with JavaScript disabled
- **THEN** the browser navigates to the corresponding chapter using native anchor-link behavior alone

### Requirement: Timeline nodes are keyboard-operable at every viewport width
Timeline nodes SHALL remain focusable and activatable via keyboard regardless of viewport width; the timeline SHALL NOT be removed from the accessibility tree or tab order at any breakpoint.

#### Scenario: Keyboard navigation on a wide viewport
- **WHEN** a visitor tabs through the page on a desktop-width viewport
- **THEN** each timeline node receives visible focus in sequence and Enter activates its link

#### Scenario: Keyboard navigation on a narrow viewport
- **WHEN** a visitor tabs through the page on a mobile-width viewport
- **THEN** each timeline node is still present, focusable, and activatable — never hidden via `display:none` or an equivalent that removes it from the tab order
