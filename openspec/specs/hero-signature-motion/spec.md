## Purpose

Defines the production behavior contract for the site's signature animated
sequence — a whole-page MacBook that opens and reorients to front-facing as
the visitor scrolls the document, revealing a terminal — the
`prefers-reduced-motion` static alternative, no-JS readability regardless of
motion mode, and the PRD §9 60fps performance requirement.

## Requirements

### Requirement: Signature animated sequence plays under default motion settings
The hero SHALL play one signature animated sequence — a whole-page MacBook that opens and reorients as the visitor scrolls — when the visitor has no `prefers-reduced-motion` preference set. On load the laptop renders **fully closed** (its lid flush against the base, presenting a closed clamshell with no visible gap between lid and base) and angled toward the lower-left with a slight downward tilt, as a background layer behind the page content; as the visitor scrolls, the lid opens and the body reorients toward front-facing in proportion to **full-document** scroll progress, animating transform only. The hero's name and positioning text also animate in.

#### Scenario: Initial state on load
- **WHEN** the page loads at the top with no `prefers-reduced-motion` preference (or a preference of `no-preference`)
- **THEN** the laptop renders fully closed — its lid flush against the base with no visible gap, reading unambiguously as a shut clamshell (not partially open) — angled toward the lower-left with a slight downward tilt, sitting as a background layer behind the page content, and the name, positioning, and CTAs are visible and readable

#### Scenario: Opening and reorienting with scroll
- **WHEN** the visitor scrolls through the document with no `prefers-reduced-motion` preference
- **THEN** the laptop's lid opens and its body reorients toward front-facing in proportion to full-document scroll progress, animating only transform (no layout-triggering properties)

#### Scenario: Name and positioning entrance
- **WHEN** the hero first renders with no `prefers-reduced-motion` preference
- **THEN** the name and positioning text animate in with both an opacity fade and a y-offset slide

### Requirement: The laptop is visually recognizable as a laptop
The laptop SHALL be rendered with detail sufficient to read as a laptop rather than an abstract box, in all of its poses. When open, the base SHALL show a recognizable keyboard and a trackpad, and the screen SHALL show a bezel around the terminal and a hinge where the lid meets the base. When closed, the visible lid SHALL carry a subtle accent so the closed clamshell still reads as a laptop rather than a blank rectangle. The lid SHALL present two distinct faces — a screen face and an outward-facing outer face — so that only the face actually oriented toward the viewer is visible at any pose. This detail SHALL be achieved with CSS/DOM primitives that ride the laptop's transforms (no image/SVG assets and no new dependency), and any property animated on them SHALL be limited to `transform` and `opacity`, so the capability's 60fps, transform/opacity-only, no-JS, reduced-motion, scrim, and mobile requirements are unaffected.

#### Scenario: The open laptop shows a keyboard and trackpad
- **WHEN** the laptop is viewed at a scroll position where the base is visible (opening or open)
- **THEN** the base shows a recognizable keyboard (a grid or rows of keys) and, below it, a centered trackpad

#### Scenario: The open laptop shows screen and hinge detail
- **WHEN** the laptop is viewed opening or open
- **THEN** the screen shows a bezel framing the terminal and a hinge line is visible where the lid meets the base, so the form reads as a laptop rather than two plain rectangles

#### Scenario: The closed laptop still reads as a laptop
- **WHEN** the laptop is fully closed (on load)
- **THEN** the visible lid carries a subtle accent (for example a small centered mark), so the closed clamshell is recognizable as a laptop and not a blank slab

#### Scenario: Only the viewer-facing lid face is visible
- **WHEN** the laptop is at a closed or near-closed pose, where the lid's outer face is the one turned toward the viewer
- **THEN** the outer face is what renders, and the screen face's contents (terminal, bezel) do not show through mirrored

#### Scenario: The added detail introduces no assets and no disallowed properties
- **WHEN** the keyboard, trackpad, bezel, hinge, lid accent, and lid faces are rendered
- **THEN** they add no image/SVG asset and no new dependency, and any property animated on them is limited to `transform` and `opacity` — no layout-triggering property and no non-compositor-friendly property such as `filter`, `box-shadow`, or `background-position`

### Requirement: The laptop is lit by a scroll-driven lighting rig
The laptop SHALL be lit by a rig of light layers whose intensities are derived from the same full-document scroll progress that already drives the laptop's geometry, so that the object's illumination changes as it opens and reorients rather than staying fixed. The rig SHALL include, at minimum: a rim light along the silhouette that is strongest at grazing orientations; light spilling from the screen onto the base as the lid opens; a contact shadow beneath the base and an ambient-occlusion crease at the hinge; and a specular sweep across the lid. Each light layer SHALL animate only `opacity` and `transform`, SHALL introduce no new dependency and no image/SVG asset, and SHALL NOT introduce a new scroll listener or motion driver.

> A fifth light — a key/shadow wash across the laptop's faces — was implemented and evaluated during Step 11 real-browser verification (openspec/changes/hero-laptop-cinematic-lighting), then removed: a before/after DOM toggle at scroll progress 0.6 and 1.0 (its peak intensity in both cases) produced visually identical screenshots once composited under the scrim. It was not distinguishable from the four lights above and was dropped rather than shipped as a dead layer, per design.md Decision 8.

#### Scenario: Illumination responds to the laptop's orientation
- **WHEN** the visitor scrolls through the document with no `prefers-reduced-motion` preference
- **THEN** the laptop's rim light, screen spill, contact shadow, and specular sweep change intensity as the lid opens and the body reorients, so the object reads as lit rather than as flatly filled shapes

#### Scenario: The rim light separates the laptop from the background
- **WHEN** the laptop is at an orientation where its body is turned away from front-facing
- **THEN** a rim light along its silhouette is at its strongest, so the laptop is separated from the near-black page background by illumination rather than only by a drawn border

#### Scenario: The screen lights the deck as the lid opens
- **WHEN** the lid opens with scroll progress
- **THEN** light from the screen spills onto the base's deck and blooms around the bezel, increasing as the lid opens, and is absent when the laptop is closed

#### Scenario: The laptop is grounded rather than floating
- **WHEN** the laptop is rendered at any pose
- **THEN** a contact shadow beneath the base and an ambient-occlusion crease at the hinge give it weight, rather than the laptop appearing to float against the background

#### Scenario: The lighting rig uses only permitted properties and drivers
- **WHEN** the lighting rig is rendered and animated
- **THEN** every light layer animates only `opacity` and `transform`, is driven from the existing full-document scroll progress with no additional scroll listener or motion driver, and adds no new dependency and no image/SVG asset

#### Scenario: Lighting is static under prefers-reduced-motion
- **WHEN** the hero is viewed with `prefers-reduced-motion: reduce` set
- **THEN** the laptop's lighting renders at fixed values matching its static open, front-facing pose, with no scroll-linked change in any light's intensity

#### Scenario: Lighting renders sensibly without JavaScript
- **WHEN** a visitor loads the hero with JavaScript disabled
- **THEN** the lighting renders at its static open-pose values — no light is stuck at an unlit or fully-dark state that would leave the laptop looking broken — and the hero's name and positioning text remain fully visible and legible

### Requirement: The screen accent color is shared by the light the screen emits
The terminal's text color and the light the screen casts onto the laptop (the deck spill and the bezel bloom) SHALL be derived from a single screen accent color, so the emitted light matches the emitting surface. The accent SHALL meet the site's text contrast requirement for the terminal's text against the screen background.

#### Scenario: Emitted light matches the screen
- **WHEN** the screen spill and bezel bloom are rendered
- **THEN** their color is derived from the same accent as the terminal's text, rather than being independently specified

#### Scenario: Terminal text remains readable
- **WHEN** the terminal's text is displayed on the screen at the accent color
- **THEN** it meets the site's contrast requirement for text of its size against the screen background

### Requirement: The laptop is framed off-axis and cropped
The laptop SHALL be composed as a cropped, off-axis element — rendered large enough to extend beyond the viewport edge rather than sitting fully contained and centered — and the hero's name and positioning copy SHALL be anchored off the viewport's center axis, so the laptop and the copy do not share a single centered axis. The framing SHALL keep the laptop's screen fully within the viewport at poses where the terminal is required to be readable.

#### Scenario: The laptop is cropped by the viewport
- **WHEN** the hero is viewed on a viewport at or above the `sm` breakpoint
- **THEN** the laptop is rendered large enough that part of it extends past the viewport edge, rather than being fully contained and centered

#### Scenario: The screen stays in frame where the terminal must be readable
- **WHEN** full-document scroll progress reaches the point at which the terminal is required to be visible and readable
- **THEN** the laptop's screen is fully within the viewport, so the terminal's content-sourced text is not cropped

#### Scenario: Copy and laptop do not share one axis
- **WHEN** the hero's name and positioning copy are rendered over the laptop layer
- **THEN** the copy is anchored off the viewport's center axis, and it remains legible over the laptop with the scrim's contrast requirement satisfied

#### Scenario: Small viewports are unaffected
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the laptop effect remains simplified as already required, and neither the off-axis framing nor the lighting rig renders there

### Requirement: Fade-only alternative under prefers-reduced-motion
The hero SHALL, when the visitor has `prefers-reduced-motion: reduce` set, render the laptop in a static, fully-open, front-facing state with the terminal visible — with no scroll-linked opening or reorientation and no other motion — and animate the name and positioning text with an opacity fade only.

#### Scenario: Reduced motion preferred
- **WHEN** the hero is viewed with `prefers-reduced-motion: reduce` set
- **THEN** the laptop does not animate on scroll (it is static, fully open, front-facing, with the terminal visible) and the name and positioning text animate in with an opacity fade only, with no y-offset slide

### Requirement: Hero content remains readable without JavaScript regardless of motion preference
The hero's animated elements SHALL render fully readable, final-state content when JavaScript is disabled, independent of the visitor's `prefers-reduced-motion` setting: the name and positioning text are fully visible, and the laptop renders a sensible static state that does not obscure the text.

#### Scenario: JavaScript disabled
- **WHEN** a visitor loads the hero with JavaScript disabled
- **THEN** the name and positioning text are fully visible (opacity 1, no transform offset), and the laptop renders a static state (open, terminal visible) that leaves the text legible, whether or not `prefers-reduced-motion` is set

### Requirement: Signature sequence sustains 60fps
The default (non-reduced-motion) signature sequence — including the laptop's scroll-driven opening and reorientation — SHALL sustain 60fps during playback by animating only compositor-friendly properties (transform/opacity), with no layout-triggering animation, per PRD §9's performance budget.

#### Scenario: Frame rate measured during playback
- **WHEN** the laptop's scroll-driven animation is profiled via browser performance profiling while it plays
- **THEN** the recorded frame rate sustains 60fps and only transform/opacity are animated, or the measurement report documents why a full profiling run was not achievable in the execution environment

### Requirement: A terminal is revealed when the laptop is fully open
The system SHALL show a readable terminal window on the laptop screen when full-document scroll progress reaches the bottom of the page (laptop fully open and front-facing). The terminal's text SHALL be sourced from the site's content, not hardcoded in components.

#### Scenario: End of page reached
- **WHEN** full-document scroll progress completes (the visitor reaches the bottom of the page) with no `prefers-reduced-motion` preference
- **THEN** the laptop is fully open and front-facing and a terminal window showing its content-sourced text is visible and readable

### Requirement: The laptop stays legible behind page content
The system SHALL render the laptop as a background layer behind page content with a scrim (dimming/overlay) so that all text overlapping the laptop continues to meet the site's contrast requirements.

#### Scenario: Text overlaps the laptop
- **WHEN** page text is displayed over the laptop layer at any scroll position
- **THEN** a scrim keeps the laptop subdued and the overlapping text meets the site's contrast requirements

### Requirement: The laptop effect is simplified on small viewports
On small (mobile) viewports the system SHALL simplify the laptop effect — a reduced or static presentation rather than a full-page fixed, scroll-driven 3D motif — to preserve readability and performance.

#### Scenario: Small viewport
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the laptop effect is simplified (not a full-page fixed, scroll-driven 3D motif) and the page text remains readable
