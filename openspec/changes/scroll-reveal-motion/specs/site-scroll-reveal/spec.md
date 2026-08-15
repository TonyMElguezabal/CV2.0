## ADDED Requirements

### Requirement: Headings reveal with a blur-up treatment that animates only opacity and transform
Display and section headings SHALL reveal with a blur-up entrance in which text resolves from blurred to sharp while rising into place. The treatment SHALL be constructed so that **only `opacity` and `transform` are animated** — any blur SHALL be a static, pre-rendered effect that is cross-faded rather than a blur radius animated per frame. The reveal's duration and easing SHALL derive from the site's shared motion pace token rather than being specified per surface.

#### Scenario: A heading reveals
- **WHEN** a heading with the reveal treatment enters the viewport with no `prefers-reduced-motion` preference
- **THEN** its text resolves from blurred to sharp while rising into place

#### Scenario: Only permitted properties animate
- **WHEN** any element participating in a heading reveal is inspected during the animation
- **THEN** the only properties animating on it are `opacity` and `transform` — no blur radius, and no other non-compositor-friendly or layout-triggering property, is animated

#### Scenario: Reveal timing derives from the shared pace
- **WHEN** a heading reveal's timing is inspected
- **THEN** its duration and easing derive from the site's shared motion pace token rather than being independently specified

### Requirement: Revealed content is never left permanently hidden
No content SHALL be permanently unreadable because a reveal failed to fire. If the mechanism that triggers reveals does not run — an unfired observer callback, a scripting error, an unsupported browser, or JavaScript disabled entirely — the affected content SHALL still be readable in its final state. A reveal SHALL be a progressive enhancement over readable content, never a gate in front of it.

#### Scenario: JavaScript is disabled
- **WHEN** the page is loaded with JavaScript disabled
- **THEN** every heading and every section's content renders fully visible in its final state, with no element left at zero opacity or offset out of position

#### Scenario: A reveal never triggers
- **WHEN** a section's reveal trigger never fires for any reason while the visitor is viewing the page
- **THEN** that section's content is still readable rather than remaining hidden

#### Scenario: Content revealed once stays revealed
- **WHEN** a section has been revealed and the visitor scrolls away from it and back
- **THEN** its content remains visible rather than resetting to a hidden state

### Requirement: Reveals are scoped to headings and section entrances
The reveal treatment SHALL apply only to headings and to section-level entrances. Substantive content a visitor scans — career chapter body text, dates, role descriptions, metrics, and skill evidence links — SHALL NOT be individually gated behind scroll position. This site presents a career history that is read and scanned, not a short mood piece, so spectacle belongs at the seams and substance stays present.

#### Scenario: Career detail is not individually gated
- **WHEN** a career chapter's body text, dates, and metrics are inspected
- **THEN** none of them is individually gated behind its own scroll-triggered reveal

#### Scenario: Section entrances are revealed
- **WHEN** a content section enters the viewport with no `prefers-reduced-motion` preference
- **THEN** the section's entrance is revealed as a whole, rather than each of its inner content items being revealed separately

### Requirement: Per-character splitting preserves the heading's accessible name
Where a heading is split into per-character elements to support the reveal, the heading's accessible name SHALL remain its complete, unbroken text. Assistive technology SHALL NOT announce the heading character by character, and the split SHALL NOT alter the heading's semantics or its position in the document's heading structure.

#### Scenario: The accessible name is intact
- **WHEN** a split heading's accessible name is computed
- **THEN** it is the heading's full text as a single unbroken string, not a sequence of individual characters

#### Scenario: Heading semantics are unchanged
- **WHEN** the document's heading structure is inspected
- **THEN** split headings retain their original heading level and order, and the split introduces no additional headings or landmarks

### Requirement: Duplicated reveal layers are excluded from selection and assistive technology
Where the reveal duplicates text to cross-fade between a blurred and a sharp copy, the duplicate SHALL be excluded from text selection and hidden from assistive technology, so that selecting or copying a heading yields its text exactly once.

#### Scenario: Copying a heading yields its text once
- **WHEN** a visitor selects and copies a revealed heading
- **THEN** the copied text is the heading's text exactly once, with no doubled characters

#### Scenario: The duplicate is not announced
- **WHEN** a revealed heading is read by assistive technology
- **THEN** its text is announced once, with the duplicated visual layer hidden from the accessibility tree

### Requirement: Reveals collapse to fade-only under reduced motion
When the visitor has `prefers-reduced-motion: reduce` set, reveals SHALL drop all movement — no rise, no positional change, and no blur-to-sharp transition — leaving an opacity fade only, consistent with the site-wide reduced-motion alternative. The reveal SHALL NOT merely play its movement more slowly.

#### Scenario: Reduced motion preferred
- **WHEN** a heading or section reveals with `prefers-reduced-motion: reduce` set
- **THEN** it fades in with no rise, no positional movement, and no blur-to-sharp transition

#### Scenario: Content is still fully readable under reduced motion
- **WHEN** the page is viewed with `prefers-reduced-motion: reduce` set
- **THEN** all headings and content reach their fully visible final state
