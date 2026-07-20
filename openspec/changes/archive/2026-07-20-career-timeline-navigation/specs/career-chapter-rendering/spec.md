## ADDED Requirements

### Requirement: Each chapter is a valid navigation target
Each chapter's `<details>` element SHALL have an `id` attribute matching that chapter's experience id, so external links (such as timeline nodes) can navigate directly to it.

#### Scenario: Chapter has a matching id
- **WHEN** a chapter's `<details>` element is inspected
- **THEN** its `id` attribute matches that experience's id (the same id used for its Projects section, `{id}-projects`)

#### Scenario: Fragment navigation reaches the chapter
- **WHEN** a visitor follows a link to `#{experience.id}`
- **THEN** the browser scrolls to that chapter's `<details>` element, using only native browser fragment-navigation behavior
