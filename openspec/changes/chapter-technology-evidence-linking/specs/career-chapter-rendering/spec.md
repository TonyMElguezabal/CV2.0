## ADDED Requirements

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
