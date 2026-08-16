## Purpose

Defines the site's ambient decorative motion layer — a continuously-animating
canvas particle field behind the page content — including its stacking
position above the hero scrim, its reduced-motion and visibility-driven stop
conditions, and its gating on small viewports and without JavaScript.

## Requirements

### Requirement: An ambient decorative motion layer runs behind the page content
The site SHALL render a continuously-animating decorative layer — a field of small, additively-blended particles — behind the page's content, so the page reads as alive rather than static when the visitor is not interacting with it. The layer SHALL be rendered on a single canvas element rather than as individual DOM nodes, SHALL introduce no new dependency and no image or network asset, and SHALL be purely decorative: hidden from assistive technology, never focusable, never intercepting pointer events, and carrying no content.

#### Scenario: The layer animates while the page is at rest
- **WHEN** the landing page is open, visible, and the visitor is not interacting with it, with no `prefers-reduced-motion` preference
- **THEN** the particle field is animating continuously, without requiring scroll or pointer input to do so

#### Scenario: The layer is decorative only
- **WHEN** the ambient layer is inspected
- **THEN** it is hidden from assistive technology, is not reachable by keyboard, does not intercept pointer events from the content beneath it, and contains no text or other content

#### Scenario: The layer adds no dependency or asset
- **WHEN** the layer's implementation and the built output are inspected
- **THEN** the field is drawn procedurally with built-in browser capabilities, with no new package dependency, no image asset, and no network request

### Requirement: The ambient layer renders above the hero scrim
The ambient layer SHALL be composited above the hero's dimming scrim and below all page content. It SHALL NOT be placed beneath the scrim, because the scrim reduces an overlay's contribution against the page background by roughly 80% — enough to render the effect as muted grey rather than as light.

#### Scenario: Stacking order places the layer above the scrim
- **WHEN** the page's fixed background layers are inspected in paint order
- **THEN** the ambient layer paints after the hero scrim and before any page content, so its particles are not dimmed by the scrim

#### Scenario: Particles remain legible as light
- **WHEN** a particle is rendered at its intended brightness and compared against the page background
- **THEN** it reads as a distinct point of light rather than as a muted grey mark

### Requirement: The ambient layer does not move under reduced motion
When the visitor has `prefers-reduced-motion: reduce` set, the ambient layer SHALL NOT animate position. It SHALL render a still field and MAY fade in, consistent with the site-wide requirement that only opacity/fade transitions remain. No particle SHALL drift, travel, or otherwise change position while that preference is set.

#### Scenario: Reduced motion preferred
- **WHEN** the page is viewed with `prefers-reduced-motion: reduce` set
- **THEN** the particle field renders without any positional movement, and any appearance transition is opacity-only

#### Scenario: Reduced motion is not merely slowed
- **WHEN** the page is viewed with `prefers-reduced-motion: reduce` set
- **THEN** the field is static rather than drifting at a reduced speed

### Requirement: The ambient layer stops when it is not visible
Because the layer runs indefinitely rather than completing, it SHALL stop its animation loop whenever it cannot be seen — when the document is hidden, and when the layer has been scrolled out of view — and SHALL resume when it becomes visible again. It SHALL release its animation loop when unmounted, leaving no running callback or registered listener behind.

#### Scenario: The tab is hidden
- **WHEN** the document becomes hidden (the visitor switches tabs or minimises the window)
- **THEN** the layer's animation loop stops, and resumes when the document becomes visible again

#### Scenario: The layer is scrolled out of view
- **WHEN** the visitor scrolls far enough that the ambient layer is no longer within the viewport
- **THEN** the layer's animation loop stops, and resumes when it re-enters the viewport

#### Scenario: The layer is unmounted
- **WHEN** the component rendering the ambient layer unmounts
- **THEN** its animation loop is cancelled and every listener it registered is removed, leaving nothing running

### Requirement: The ambient layer is omitted on small viewports and without JavaScript
The ambient layer SHALL NOT render on small (mobile) viewports, matching the gating already applied to the hero's background motif, so that constrained devices are not asked to run a continuous animation. Without JavaScript the layer SHALL simply be absent, and its absence SHALL have no effect on the readability or completeness of the page.

#### Scenario: Small viewport
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the ambient layer does not render and no animation loop runs

#### Scenario: JavaScript disabled
- **WHEN** the page is loaded with JavaScript disabled
- **THEN** the ambient layer renders nothing, and all page content remains fully readable and complete without it

### Requirement: Particle colour derives from the site's shared accent
The particle field's colour SHALL derive from the site's single shared accent token rather than from an independently specified value, so the ambient layer stays consistent with the rest of the site's palette and cannot drift from it.

#### Scenario: Colour comes from the shared token
- **WHEN** the particle colour is inspected in the implementation
- **THEN** it is derived from the site's shared accent token rather than from a separate hard-coded colour value
