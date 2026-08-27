## Purpose

Defines the interactive career timeline: a vertical rail of nodes, one per real career chapter plus the site's origins record, letting a visitor see career progression at a glance and jump directly to any chapter.

## Requirements

### Requirement: Timeline is sourced from real experience data
The system SHALL render one timeline node per entry returned by `getExperiences()`, plus at most one additional node for the site's origins record, with no fixed count or hardcoded chapter identity, and no placeholder content. Every node SHALL be derived from real content; a node SHALL NOT be authored directly in a component.

#### Scenario: Timeline reflects the real chapter list
- **WHEN** the timeline renders
- **THEN** it shows exactly one node per experience returned by `getExperiences()`, in the same order

#### Scenario: A chapter is added or removed
- **WHEN** the number of files under `content/experience/` changes
- **THEN** the timeline's node count changes to match, without any code change

#### Scenario: The origins record contributes one node
- **WHEN** the site's origins record is present
- **THEN** the timeline shows exactly one additional node for it, positioned after the career chapters, and its label and period are derived from the origins content rather than hardcoded

### Requirement: Each node shows company and date range, with full context in its accessible name
Each timeline node SHALL visibly display a label and a period, and SHALL have an accessible name carrying its full context. For a career chapter, the visible label is the company and the period is its formatted date range, and the accessible name additionally includes the role. For the origins node, the visible label and period come from the origins record.

#### Scenario: Node visible label
- **WHEN** a career-chapter timeline node is inspected
- **THEN** it visibly shows the company name and a formatted date range (matching the same format used in the chapter's collapsed summary)

#### Scenario: Node accessible name includes the role
- **WHEN** a career-chapter timeline node's accessible name is computed
- **THEN** it includes the role, the company, and the date range, even though the visible label only shows company and dates

#### Scenario: The origins node is labelled from its content
- **WHEN** the origins timeline node is inspected
- **THEN** it visibly shows the origins record's label and its period, and has an accessible name identifying it as the earlier-career record

### Requirement: Timeline behaviour is independent of what feeds it
The timeline's scroll-position indication, anchor navigation, keyboard operability, and no-JavaScript behaviour SHALL be identical for every node regardless of which content source produced it. Adding a new kind of node SHALL NOT introduce branching behaviour within the timeline.

This exists because the timeline is the site's only scroll-position indicator; feeding it from a second content source must remain a change to its input, never to its behaviour.

#### Scenario: Every node behaves identically
- **WHEN** any timeline node is activated, focused, or scrolled into view
- **THEN** it navigates, receives focus, and updates the current-position indicator by the same mechanism as every other node, irrespective of its content source

#### Scenario: Still exactly one scroll-position indicator
- **WHEN** the page's fixed elements are inspected at a desktop viewport
- **THEN** exactly one component indicates the visitor's position within the document, and it is the timeline

#### Scenario: The rail remains navigable at its rendered height
- **WHEN** the timeline renders its full set of nodes at a desktop viewport
- **THEN** every node remains visible and reachable, rather than extending beyond the viewport where the fixed rail cannot be scrolled

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

The timeline SHALL serve as the site's **single** indicator of the visitor's position within the document. No other component — including the site's editorial frame chrome — may introduce a competing scroll-position or progress indicator; any such affordance SHALL be satisfied by this timeline instead of duplicated alongside it. The timeline's visible presentation MAY be styled to read as an editorial progress rail, provided it continues to display each node's company and date range and to expose the full role/company/date accessible name required above.

#### Scenario: A new chapter scrolls into view
- **WHEN** a visitor scrolls and a different chapter's section enters the tracked viewport zone
- **THEN** that chapter's timeline node is marked `aria-current="location"` and the previously current node is no longer marked

#### Scenario: No chapter is in view yet
- **WHEN** the visitor is still viewing content above the first chapter (e.g., the hero)
- **THEN** no timeline node is marked current

#### Scenario: Scrolled past the last chapter
- **WHEN** the visitor scrolls past the last chapter's tracked zone with no further chapter below it
- **THEN** the last chapter's timeline node remains marked current rather than clearing to no active node

#### Scenario: The timeline is the only position indicator
- **WHEN** the page's fixed chrome is inspected alongside the timeline
- **THEN** no second component indicates position within the document, and the timeline's current-chapter marking is the only such affordance present

#### Scenario: Rail styling preserves node content
- **WHEN** the timeline is presented as an editorial progress rail
- **THEN** each node still visibly shows its company and date range, and its accessible name still includes the role, company, and date range

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
