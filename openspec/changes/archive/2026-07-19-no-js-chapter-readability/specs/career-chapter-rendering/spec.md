## ADDED Requirements

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
