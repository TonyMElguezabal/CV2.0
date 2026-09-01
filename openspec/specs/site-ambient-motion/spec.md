## Purpose

Defines the site's ambient decorative motion layer — a continuously-animating
canvas particle field behind the page content — including its stacking
position above the hero scrim, its constellation links and pointer
responsiveness, its reduced-motion and visibility-driven stop conditions,
and its omission without JavaScript.

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

### Requirement: Nearby particles are joined by distance-faded links
The ambient layer SHALL join pairs of particles that are close to one another with a stroked line, so the field reads as a connected constellation rather than as unrelated points. Proximity SHALL be measured in **pixel space**, not in the layer's normalized coordinate space, so that the link radius describes a circle on screen rather than an ellipse on a non-square viewport. A link's opacity SHALL decrease monotonically as the pair separates, reaching zero at the link radius, so links dissolve rather than disappearing abruptly. Links SHALL be drawn before the particles themselves, so particles remain crisp on top of the web. Links SHALL be drawn on the same single canvas as the particles, SHALL derive their color from the site's shared accent token, and SHALL introduce no new dependency and no image or network asset.

#### Scenario: Close particles are linked
- **WHEN** two particles are separated by less than the link radius, measured in pixels
- **THEN** a line is stroked between them on the same canvas that renders the particles

#### Scenario: Distant particles are not linked
- **WHEN** two particles are separated by more than the link radius
- **THEN** no line is drawn between them

#### Scenario: Link opacity falls to zero at the radius
- **WHEN** a linked pair's separation increases toward the link radius
- **THEN** the link's opacity decreases monotonically and reaches zero at the radius, so no link is ever visible at the moment it stops being drawn

#### Scenario: Link geometry is measured in pixel space
- **WHEN** the layer is rendered on a viewport that is significantly wider than it is tall
- **THEN** the maximum on-screen distance at which two particles are linked is the same horizontally as it is vertically

#### Scenario: Particles paint on top of links
- **WHEN** a particle lies on top of a link between two other particles
- **THEN** the particle is drawn over the link, not obscured by it

#### Scenario: Links use the shared accent token
- **WHEN** the link stroke color is inspected in the implementation
- **THEN** it is derived from the site's shared accent token rather than from a separate hard-coded color value

### Requirement: The link layer cannot reach the weight of page text
The link layer SHALL be bounded below the site's text-contrast floor **by construction**, not by tuning, because it is decorative and sits behind real content. Links SHALL be composited such that overlapping links cannot accumulate beyond the color of a single link — additive compositing SHALL NOT be used for the link pass, because summing overlapping links at crossings can exceed the contrast of the faintest tint the site permits for text. The peak opacity of any single link SHALL NOT exceed the contrast of the site's border-and-rule tint, which is the palette's designated weight for structure that is not content.

#### Scenario: Overlapping links do not accumulate
- **WHEN** many links cross at the same point on the canvas
- **THEN** the resulting color is no stronger than the color of a single link at full opacity, rather than summing toward a brighter value

#### Scenario: Peak link weight stays below the border tint
- **WHEN** a link at its peak opacity is measured against the page background
- **THEN** its contrast ratio is at or below that of the palette's border-and-rule tint, and therefore below the contrast of every tint the site permits for text

#### Scenario: The bound holds regardless of field density
- **WHEN** the field is rendered at its highest permitted particle density
- **THEN** the maximum contrast reached anywhere in the link layer is unchanged from the low-density case, because the bound is a property of the compositing mode rather than of the number of links drawn

### Requirement: The ambient layer renders above the hero scrim
The ambient layer SHALL be composited above the hero's dimming scrim and below all page content. It SHALL NOT be placed beneath the scrim, because the scrim reduces an overlay's contribution against the page background by roughly 80% — enough to render the effect as muted grey rather than as light.

#### Scenario: Stacking order places the layer above the scrim
- **WHEN** the page's fixed background layers are inspected in paint order
- **THEN** the ambient layer paints after the hero scrim and before any page content, so its particles are not dimmed by the scrim

#### Scenario: Particles remain legible as light
- **WHEN** a particle is rendered at its intended brightness and compared against the page background
- **THEN** it reads as a distinct point of light rather than as a muted grey mark

### Requirement: The ambient layer leans toward the pointer
The ambient layer SHALL apply a gentle attraction to particles near the pointer, so the field reads as responsive to the visitor's presence. This attraction SHALL NOT be required for the layer to animate — the field SHALL continue to drift with no pointer present, as it does today. The attraction SHALL be time-based rather than per-frame, so its strength does not vary with the display's refresh rate. A particle's displacement from its free-drift path SHALL be bounded, so the field cannot collapse permanently onto the pointer. The layer SHALL NOT intercept pointer events from the content beneath it in order to track the pointer. Attraction SHALL apply to a hovering pointer only, not to touch contact, because a touch is a discrete tap rather than a continuous hover.

#### Scenario: The field responds to a hovering pointer
- **WHEN** the pointer moves across the page and comes within the influence radius of a particle
- **THEN** that particle eases toward the pointer

#### Scenario: The layer animates without any pointer
- **WHEN** the page is open and visible with the pointer outside the window entirely
- **THEN** the particle field continues to drift and its links continue to update, exactly as it does with a pointer present

#### Scenario: Attraction strength is independent of frame rate
- **WHEN** the same elapsed time is simulated across a different number of frames
- **THEN** the resulting particle positions are the same, rather than the attraction being stronger at higher frame rates

#### Scenario: The field cannot collapse onto the pointer
- **WHEN** the pointer is held stationary over the field for an extended period
- **THEN** particles remain displaced by no more than the bounded amount and the field retains its distribution, rather than accumulating at the pointer

#### Scenario: The pointer is released when it leaves
- **WHEN** the pointer leaves the document, or the window loses focus
- **THEN** the attraction becomes inactive and the affected particles ease back to free drift, rather than continuing to be pulled toward the pointer's last position

#### Scenario: Pointer tracking intercepts nothing
- **WHEN** the visitor clicks or scrolls anywhere over the region the ambient layer covers
- **THEN** the event reaches the content beneath the layer, and the layer's own pointer tracking does not consume it

#### Scenario: Touch contact does not move the field
- **WHEN** the page is viewed on a touch-capable device at a viewport where the layer renders, and the visitor taps or drags a finger across the page
- **THEN** the field is not attracted to the touch point

### Requirement: The ambient layer does not move under reduced motion
When the visitor has `prefers-reduced-motion: reduce` set, the ambient layer SHALL NOT animate position. It SHALL render a still field — including its links, since a still constellation is more legible than a still scattering of points — and MAY fade in, consistent with the site-wide requirement that only opacity/fade transitions remain. No particle SHALL drift, travel, or otherwise change position while that preference is set. Because pointer attraction is positional movement, it SHALL NOT be active under this preference, and the layer SHALL NOT register a pointer listener at all rather than registering one whose effect is ignored.

#### Scenario: Reduced motion preferred
- **WHEN** the page is viewed with `prefers-reduced-motion: reduce` set
- **THEN** the particle field renders without any positional movement, and any appearance transition is opacity-only

#### Scenario: Reduced motion is not merely slowed
- **WHEN** the page is viewed with `prefers-reduced-motion: reduce` set
- **THEN** the field is static rather than drifting at a reduced speed

#### Scenario: The still frame includes links
- **WHEN** the page is viewed with `prefers-reduced-motion: reduce` set
- **THEN** the single rendered frame shows both the particles and the links between them, not particles alone

#### Scenario: No pointer listener is registered
- **WHEN** the page is viewed with `prefers-reduced-motion: reduce` set and the pointer moves across the page
- **THEN** no particle moves, and the layer has registered no pointer listener to ignore

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

### Requirement: The ambient layer is omitted without JavaScript
Without JavaScript the ambient layer SHALL simply be absent, and its absence SHALL have no effect on the readability or completeness of the page. The layer SHALL otherwise render at every viewport width — its cost on constrained devices is bounded by the requirements it already carries (a viewport-area-derived particle count, and an animation loop that stops whenever the layer is not visible) rather than by omitting it below a breakpoint.

#### Scenario: JavaScript disabled
- **WHEN** the page is loaded with JavaScript disabled
- **THEN** the ambient layer renders nothing, and all page content remains fully readable and complete without it

#### Scenario: Small viewport
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the ambient layer renders and animates, with its particle count derived from the smaller area rather than the layer being omitted

### Requirement: Field density is derived from viewport area
The number of particles in the field SHALL be derived from the rendered area of the layer rather than being a fixed count, so that the density of particles — and therefore the density of links between them — is consistent across viewport sizes. Without this, a single fixed count produces a crowded mesh on small viewports and a sparse scattering on large ones. The derived count SHALL be bounded by a minimum and a maximum, so that neither an unusually small nor an unusually large viewport produces a degenerate or unaffordable field. When the layer is resized, the field SHALL NOT be regenerated for small changes in area, because reseeding relocates every particle at once and is visible as a discontinuity.

#### Scenario: Density is consistent across viewport sizes
- **WHEN** the layer is rendered at a small viewport and at a large viewport
- **THEN** the average number of links per particle is comparable between them, rather than differing by an order of magnitude

#### Scenario: The count is bounded
- **WHEN** the layer is rendered at an extremely small or extremely large area
- **THEN** the particle count is clamped to the permitted range rather than scaling without limit

#### Scenario: A small resize does not reseed the field
- **WHEN** the viewport is resized by an amount that changes the derived particle count only slightly
- **THEN** the existing particles keep their positions and the field is adjusted incrementally, rather than every particle being repositioned at once

### Requirement: Particle colour derives from the site's shared accent
The particle field's colour SHALL derive from the site's single shared accent token rather than from an independently specified value, so the ambient layer stays consistent with the rest of the site's palette and cannot drift from it.

#### Scenario: Colour comes from the shared token
- **WHEN** the particle colour is inspected in the implementation
- **THEN** it is derived from the site's shared accent token rather than from a separate hard-coded colour value
