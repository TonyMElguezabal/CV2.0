## Purpose

Defines the production behavior contract for the site's signature animated
sequence — a whole-page MacBook that opens and reorients to front-facing as
the visitor scrolls the document, revealing a terminal — the
`prefers-reduced-motion` static alternative, no-JS readability regardless of
motion mode, and the PRD §9 60fps performance requirement.

## Requirements

### Requirement: Signature animated sequence plays under default motion settings
The hero SHALL play one signature animated sequence — a whole-page MacBook that opens and reorients as the visitor scrolls — when the visitor has no `prefers-reduced-motion` preference set. On load the laptop renders closed and angled toward the lower-left with a slight downward tilt, as a background layer behind the page content; as the visitor scrolls, the lid opens and the body reorients toward front-facing in proportion to **full-document** scroll progress, animating transform only. The hero's name and positioning text also animate in.

#### Scenario: Initial state on load
- **WHEN** the page loads at the top with no `prefers-reduced-motion` preference (or a preference of `no-preference`)
- **THEN** the laptop renders closed (lid flat) and angled toward the lower-left with a slight downward tilt, sitting as a background layer behind the page content, and the name, positioning, and CTAs are visible and readable

#### Scenario: Opening and reorienting with scroll
- **WHEN** the visitor scrolls through the document with no `prefers-reduced-motion` preference
- **THEN** the laptop's lid opens and its body reorients toward front-facing in proportion to full-document scroll progress, animating only transform (no layout-triggering properties)

#### Scenario: Name and positioning entrance
- **WHEN** the hero first renders with no `prefers-reduced-motion` preference
- **THEN** the name and positioning text animate in with both an opacity fade and a y-offset slide

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
