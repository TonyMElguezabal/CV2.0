## ADDED Requirements

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
