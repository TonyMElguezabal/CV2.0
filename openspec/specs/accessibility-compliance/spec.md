## Purpose

Defines the site-wide accessibility guarantees — visible focus on every interactive element, AA contrast against each element's real background, a `prefers-reduced-motion` fade-only alternative across all animated surfaces, and a semantic, correctly-ordered heading/landmark structure with a skip link.

## Requirements

### Requirement: Every interactive element has a visible focus indicator
The system SHALL render a clearly visible focus indicator on every interactive element (links, buttons, inputs) when it receives keyboard focus, and SHALL NOT suppress the focus indicator on any control.

#### Scenario: Keyboard focus lands on a control
- **WHEN** a keyboard user moves focus to any interactive element (hero CTAs, chat-widget controls, timeline links, chapter toggles, contact links, form input)
- **THEN** a visible focus indicator is shown on that element

#### Scenario: No control removes its focus indicator
- **WHEN** the interactive elements' styles are inspected
- **THEN** none suppress the focus indicator (no `outline: none` without an equivalent visible replacement)

### Requirement: A skip-to-content link lets keyboard users bypass navigation
The system SHALL provide a skip-to-content link as the first focusable element, which moves focus to the main content region.

#### Scenario: Keyboard user tabs into the page
- **WHEN** a keyboard user presses Tab on a freshly loaded page
- **THEN** the first focusable element is a "skip to content" link that becomes visible on focus and, when activated, moves focus to `<main>`

### Requirement: The dark theme meets WCAG 2.1 AA contrast intent
The system SHALL ensure text meets WCAG 2.1 AA contrast against the background it actually renders on — at least 4.5:1 for normal-size text and 3:1 for large text.

#### Scenario: Text contrast is checked against its real background
- **WHEN** any text is checked for contrast against the surface it renders on (page background, panel, message bubble, or error background)
- **THEN** normal-size text meets at least 4.5:1 and large text at least 3:1

### Requirement: A reduced-motion fade-only alternative applies site-wide
The system SHALL, when the visitor has `prefers-reduced-motion: reduce` set, replace movement-based animation with a fade-only alternative across all animated surfaces, including the chat widget's open/close transition.

#### Scenario: Reduced motion preferred, chat widget opened
- **WHEN** the chat widget is opened or closed with `prefers-reduced-motion: reduce` set
- **THEN** the panel transitions with opacity only, with no positional slide

#### Scenario: Reduced motion preferred, any animated surface
- **WHEN** any animated surface is viewed with `prefers-reduced-motion: reduce` set
- **THEN** no movement-based animation plays; only opacity/fade transitions remain

### Requirement: The document has a semantic, correctly-ordered heading structure
The system SHALL present a heading outline that does not skip levels and that conveys the narrative in correct reading order to assistive technology.

#### Scenario: Heading outline is inspected
- **WHEN** the page's heading outline is inspected
- **THEN** it descends without skipping levels (a single `h1`, section-level `h2`s including one introducing the career chapters, chapter `h3`s, and chapter-part `h4`s), so the career chapters do not jump directly from the `h1`

#### Scenario: Screen reader reads the page
- **WHEN** a screen reader reads the page in DOM order
- **THEN** landmarks (main, navigation, contentinfo) and headings convey the story in the correct order, with decorative elements hidden from the accessibility tree

### Requirement: Structural accessibility is regression-tested automatically
The system SHALL include automated accessibility assertions over the key surfaces for the structural rules a headless test environment can evaluate (heading order, landmark structure, accessible names, label associations, ARIA validity).

#### Scenario: Automated a11y checks run in the test suite
- **WHEN** the test suite runs
- **THEN** automated `axe` assertions on the key surfaces (hero, an expanded career chapter, the open chat widget, the contact section, and the composed page) report no violations for the evaluated structural rules
