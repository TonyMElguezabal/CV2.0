## ADDED Requirements

### Requirement: User interface component boundaries meet WCAG 2.1 non-text contrast
The system SHALL ensure that the visual boundary of every user interface component a visitor must perceive to operate — including input field borders, control outlines, and the boundary of the chat trigger — meets at least 3:1 contrast against the surface it renders on.

This requirement exists because the site's existing contrast requirement is scoped to **text** (4.5:1 normal, 3:1 large). WCAG 2.1 success criterion 1.4.11 governs non-text contrast, and nothing covered it: the chat input's border measured 1.70:1 against its panel — a failure that passed every gate because no requirement was looking at boundaries.

#### Scenario: An input field's boundary is checked
- **WHEN** a text input's border colour is measured against the surface it renders on
- **THEN** it achieves at least 3:1

#### Scenario: A control's boundary is checked
- **WHEN** the visual boundary of an interactive control is measured against the surface behind it
- **THEN** it achieves at least 3:1

#### Scenario: A boundary tint is chosen from the palette
- **WHEN** a colour is selected for a component boundary that a visitor must perceive to operate the component
- **THEN** it resolves to a palette token meeting at least 3:1 at that use, rather than to an arbitrary step of an open colour scale
