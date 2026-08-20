## MODIFIED Requirements

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

## ADDED Requirements

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
