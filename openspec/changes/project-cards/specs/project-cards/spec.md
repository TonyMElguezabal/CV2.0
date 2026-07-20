## ADDED Requirements

### Requirement: Project cards are sourced from real project content files
The system SHALL render one card per file under `content/projects/*.md`, with no fixed count or placeholder content.

#### Scenario: Section reflects the real project list
- **WHEN** the projects section renders
- **THEN** it shows exactly one card per project returned by `getProjects()`

### Requirement: Each card presents problem, approach, outcome, and metrics in that fixed order
Each project card SHALL render its Problem, Approach, and Outcome sections (from the file's body) followed by its metrics (from frontmatter), in that order, regardless of the order those sections appear in the source file.

#### Scenario: Card renders all four elements in order
- **WHEN** a project card is rendered
- **THEN** its Problem section appears before Approach, Approach before Outcome, and Outcome before the metrics list

### Requirement: Card metadata comes from real frontmatter
Each card's title, company, and skills SHALL be sourced from the project file's frontmatter, matching its `ProjectSchema` fields.

#### Scenario: Card displays real frontmatter fields
- **WHEN** a project card is inspected
- **THEN** its title, company, and skills tags match that file's frontmatter exactly

### Requirement: Project cards require no JavaScript
The projects section and its cards SHALL be fully present in server-rendered HTML, requiring no client-side JavaScript.

#### Scenario: Section renders without client-side JavaScript
- **WHEN** the page's server-rendered HTML is inspected before any JavaScript executes
- **THEN** every project card's content is present
