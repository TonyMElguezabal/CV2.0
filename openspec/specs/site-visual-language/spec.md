## Purpose

Defines the site-wide typography, palette, and motion-pace tokens that give
CareerDNA a deliberate visual character rather than an unstyled information
page: a self-hosted display/body typeface pair, a strong type scale, a
bounded AA-safe colour palette, a shared unhurried motion pace, and the
constraints on gradient display type that keep it accessible.

## Requirements

### Requirement: The site renders in one deliberately-chosen typeface pair, self-hosted
The site SHALL render its text in a deliberately-chosen typeface pair — a display face for headings and a body face for running text — rather than the platform default (`system-ui` or equivalent). Both faces SHALL be self-hosted and served from the site's own origin, with no request to a third-party font host at page load, so no new origin is added to the critical path. The font files SHALL be limited to the character subset the site actually needs.

#### Scenario: The rendered typeface is not the platform default
- **WHEN** the landing page is rendered and any heading or paragraph is inspected
- **THEN** its computed font family resolves to the site's chosen display or body face, not to `system-ui` or a generic platform fallback

#### Scenario: No third-party font request is made
- **WHEN** the landing page loads and its network requests are inspected
- **THEN** no request is made to a third-party font host, and the font files are served from the site's own origin

#### Scenario: The font swap does not visibly reflow the page
- **WHEN** the page loads and the chosen faces replace their fallback faces
- **THEN** headings and body text do not visibly jump, resize, or re-wrap as the swap occurs, so the page's first impression is not disrupted mid-load

### Requirement: The type scale establishes a strong display-to-body hierarchy
The site SHALL use one type scale in which the display size is **at least 5×** the body size, and in which section headings, sub-headings, and body text occupy distinct steps of that scale. Distinct heading levels SHALL NOT collapse to a single shared size. The scale SHALL be continuous across viewport widths rather than relying on breakpoint jumps that reintroduce a flatter ratio on small screens.

#### Scenario: Display type dominates body type
- **WHEN** the hero's display text and the site's body text are compared at a desktop viewport
- **THEN** the display size is at least 5× the body size

#### Scenario: Heading levels are distinguishable
- **WHEN** a section heading, a chapter or project title, and body text are compared within the same section
- **THEN** each occupies a distinct step of the type scale, and no two different heading levels share the same rendered size

#### Scenario: The ratio survives on small viewports
- **WHEN** the page is viewed at a narrow (mobile) viewport
- **THEN** the display-to-body ratio remains materially stronger than the flat ratio it replaced, rather than collapsing to it

### Requirement: Entrance motion uses one shared, unhurried pace
The site SHALL define its entrance motion pace — duration, easing, and offset distance — as a single shared token, and animated entrances SHALL derive their timing from it rather than specifying their own. The pace SHALL be unhurried rather than brisk. Under `prefers-reduced-motion: reduce` the offset SHALL be dropped entirely; a longer duration SHALL NOT result in a longer animation for visitors who requested reduced motion.

#### Scenario: Entrances share one pace
- **WHEN** any entrance animation on the site is inspected
- **THEN** its duration and easing derive from the shared pace token rather than being independently specified at the call site

#### Scenario: Reduced motion is not merely slowed
- **WHEN** the page is viewed with `prefers-reduced-motion: reduce` set
- **THEN** entrance animations drop their offset entirely rather than playing the same movement over a longer duration

### Requirement: The palette is a bounded set of tints, each meeting AA at its permitted use
The site SHALL define a bounded set of foreground tints rather than drawing freely from an open colour scale. Every tint permitted to carry text SHALL meet WCAG 2.1 AA against the background it actually renders on — at least 4.5:1 for normal-size text. Any tint that does not meet that threshold SHALL be designated for non-text use only (borders, rules, dividers) and SHALL NOT be applied to text.

#### Scenario: Every text tint clears the normal-text threshold
- **WHEN** each tint permitted for text is measured against the page background it renders on
- **THEN** each achieves at least 4.5:1

#### Scenario: The hairline tint never carries text
- **WHEN** the tint reserved for borders and rules is located in the stylesheets
- **THEN** it is applied only to border, rule, or divider properties, and never to a text colour

#### Scenario: The palette is bounded
- **WHEN** the site's foreground colours are inventoried
- **THEN** they resolve to the defined token set rather than to arbitrary steps of an open colour scale

### Requirement: Gradient display type is restricted to large text and remains real text
Where display type is rendered with a gradient fill, that treatment SHALL be applied only to text meeting the WCAG large-text threshold, because the gradient's darkest stop clears the 3:1 large-text ratio but not the 4.5:1 normal-text ratio. The treatment SHALL be a paint effect over real, selectable text — never an image or a replacement — so the text remains available to assistive technology, search indexing, and the site's content pipeline.

#### Scenario: The gradient is applied only to large text
- **WHEN** every element carrying the gradient display treatment is inspected
- **THEN** each renders at or above the WCAG large-text threshold, so the gradient's darkest stop is evaluated against the 3:1 requirement rather than the 4.5:1 requirement

#### Scenario: The gradient's darkest stop clears the large-text threshold
- **WHEN** the darkest stop of the display gradient is measured against the page background
- **THEN** it achieves at least 3:1

#### Scenario: Gradient text remains real text
- **WHEN** an element carrying the gradient treatment is inspected
- **THEN** its text content is present in the DOM as selectable text, is exposed to assistive technology, and is not replaced by an image or generated content
