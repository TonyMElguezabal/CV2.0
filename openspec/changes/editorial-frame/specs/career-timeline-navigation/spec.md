## MODIFIED Requirements

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
