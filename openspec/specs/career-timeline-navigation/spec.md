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

### Requirement: Timeline indicates the chapter currently in view
As the visitor scrolls, the system SHALL mark the timeline node corresponding to the chapter currently in view as current, using `aria-current="location"` plus a visible style change, and SHALL retain the most recently current chapter's marking until a different chapter comes into view.

#### Scenario: A new chapter scrolls into view
- **WHEN** a visitor scrolls and a different chapter's section enters the tracked viewport zone
- **THEN** that chapter's timeline node is marked `aria-current="location"` and the previously current node is no longer marked

#### Scenario: No chapter is in view yet
- **WHEN** the visitor is still viewing content above the first chapter (e.g., the hero)
- **THEN** no timeline node is marked current

#### Scenario: Scrolled past the last chapter
- **WHEN** the visitor scrolls past the last chapter's tracked zone with no further chapter below it
- **THEN** the last chapter's timeline node remains marked current rather than clearing to no active node

### Requirement: Navigating via a timeline node updates the indicator to match
When a visitor navigates to a chapter via its timeline node, the indicator SHALL update to mark that same chapter as current once it is in view.

#### Scenario: Indicator matches the chapter reached via navigation
- **WHEN** a visitor activates a timeline node and the browser navigates to the corresponding chapter
- **THEN** that chapter's timeline node is marked current once the chapter is in the tracked viewport zone

### Requirement: Indicator updates carry no non-essential animation under reduced motion
Any visible transition accompanying a current-chapter indicator update SHALL be suppressed when the visitor has `prefers-reduced-motion: reduce` set.

#### Scenario: Reduced motion preferred
- **WHEN** the current-chapter indicator changes while `prefers-reduced-motion: reduce` is set
- **THEN** the visual change applies immediately, with no animated transition
