## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: The laptop is visually recognizable as a laptop
The laptop SHALL be rendered with detail sufficient to read as a laptop rather than an abstract box, in all of its poses. When open, the base SHALL show a recognizable keyboard and a trackpad, and the screen SHALL show a bezel around the terminal and a hinge where the lid meets the base. When closed, the visible lid SHALL carry a subtle accent so the closed clamshell still reads as a laptop rather than a blank rectangle. This detail SHALL be achieved with CSS/DOM primitives that ride the existing transforms (no new animated properties, no image/SVG assets, and no new dependency), so the capability's 60fps, transform/opacity-only, no-JS, reduced-motion, scrim, and mobile requirements are unaffected.

#### Scenario: The open laptop shows a keyboard and trackpad
- **WHEN** the laptop is viewed at a scroll position where the base is visible (opening or open)
- **THEN** the base shows a recognizable keyboard (a grid or rows of keys) and, below it, a centered trackpad

#### Scenario: The open laptop shows screen and hinge detail
- **WHEN** the laptop is viewed opening or open
- **THEN** the screen shows a bezel framing the terminal and a hinge line is visible where the lid meets the base, so the form reads as a laptop rather than two plain rectangles

#### Scenario: The closed laptop still reads as a laptop
- **WHEN** the laptop is fully closed (on load)
- **THEN** the visible lid carries a subtle accent (for example a small centered mark), so the closed clamshell is recognizable as a laptop and not a blank slab

#### Scenario: The added detail does not introduce motion or assets
- **WHEN** the added keyboard, trackpad, bezel, hinge, and lid accent are rendered
- **THEN** they are static elements that move only via the laptop's existing base/lid transforms, adding no independently-animated property, no image/SVG asset, and no new dependency
