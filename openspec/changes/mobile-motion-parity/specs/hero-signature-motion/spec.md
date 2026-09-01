## MODIFIED Requirements

### Requirement: The laptop is framed off-axis and cropped
The laptop SHALL be composed as a cropped, off-axis element — rendered large enough to extend beyond the viewport edge rather than sitting fully contained and centered — and the hero's name and positioning copy SHALL be anchored off the viewport's center axis, so the laptop and the copy do not share a single centered axis. The framing SHALL keep the laptop's screen fully within the viewport at poses where the terminal is required to be readable. This composition SHALL apply at every viewport width; the cropping and the off-axis anchoring are what prevent the laptop from reading as a small contained object, and that failure mode is not specific to large viewports.

#### Scenario: The laptop is cropped by the viewport
- **WHEN** the hero is viewed at any viewport width
- **THEN** the laptop is rendered large enough that part of it extends past the viewport edge, rather than being fully contained and centered

#### Scenario: The screen stays in frame where the terminal must be readable
- **WHEN** full-document scroll progress reaches the point at which the terminal is required to be visible and readable
- **THEN** the laptop's screen is fully within the viewport, so the terminal's content-sourced text is not cropped

#### Scenario: Copy and laptop do not share one axis
- **WHEN** the hero's name and positioning copy are rendered over the laptop layer
- **THEN** the copy is anchored off the viewport's center axis, and it remains legible over the laptop with the scrim's contrast requirement satisfied

#### Scenario: Small viewports receive the same treatment
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the off-axis framing, the cropping, and the lighting rig all render, proportioned to that viewport rather than omitted

## REMOVED Requirements

### Requirement: The laptop effect is simplified on small viewports
**Reason**: The requirement existed to protect readability and performance on constrained devices, and was justified in part against a mobile LCP budget that the project has since explicitly stopped budgeting — `performance-budget-compliance` now records that client-delivery metrics "do not measure this site's actual audience" (owner decision, 2026-08-13). The owner's assessment is that current mobile hardware carries both the laptop and the ambient field, and that a site whose premise is a signature first impression should not drop that impression for phone visitors.

The readability half of the concern is not abandoned: it is now carried by the requirement that the scrim keep overlapping text meeting the site's contrast requirements, and by the off-axis framing requirement above, both of which apply at every width. The performance half is carried by `performance-budget-compliance`'s 60fps requirement and its canvas-stops-when-not-visible clause, which already bind at all viewport widths with no device-tier carve-out.

**Migration**: The laptop layer's `hidden … sm:flex` gate is removed so the layer renders at all widths. No consumer-facing API or content change; the hero simply renders its signature motion on mobile as it already does on desktop.
