## MODIFIED Requirements

### Requirement: The frame adapts on small viewports without trapping content
On small viewports the frame SHALL adapt rather than persist unchanged, so that fixed chrome does not consume a disproportionate share of a short viewport or overlap page content. Section navigation SHALL remain reachable at every viewport width.

#### Scenario: Small viewport chrome is proportionate
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the frame's fixed chrome does not overlap page content or consume a disproportionate share of the viewport height

#### Scenario: Navigation stays reachable on small viewports
- **WHEN** the page is viewed on a small (mobile) viewport
- **THEN** the section navigation remains reachable and keyboard-operable, rather than being removed from the document or the tab order

## REMOVED Requirements

### Requirement: The grid overlay is decorative only

**Reason**: The owner has removed the decorative grid from the site (2026-08-15). Its two vertical hairlines and the horizontal rule under the header read as chrome rather than as structure, and the page is stronger without them. A requirement describing how a grid must behave cannot be satisfied by a site that has no grid, so it is removed rather than left asserting an element that does not exist. This removal narrows the frame to the header, its anchor obligations, and its single-scroll-indicator constraint — it does not weaken any of those.

**Migration**: No replacement requirement. The frame renders no decorative grid, and the header becomes fully edgeless: the horizontal rule was the header's only edge, drawn from the grid rather than as a border on the header itself precisely so it would not be duplicated, and nothing is added back in its place. `siteHeaderClass`'s existing translucent background and backdrop blur are what keep the header legible over content scrolling beneath it, and they are unchanged.

The two normative constraints this requirement carried both survive independently and are unaffected by its removal:

- **The borders-only hairline tint.** The rule that a tint failing normal-text contrast is designated for non-text use only, and never applied to text, is a general requirement of the `site-visual-language` capability covering every stylesheet — not a property of the grid. It remains enforced in code by `components/palette.test.tsx`. The `--hair` token itself is retained: the grid was its most visible consumer, but the career timeline, career chapters, project cards, hero CTAs, and the header's contact pill all still use it.
- **Non-interactivity and assistive-technology exclusion.** These described a decorative layer that no longer exists. Removing the layer removes the surface entirely, which is strictly stronger than requiring it to be inert.

Separately, `Requirement: The frame introduces no second scroll-position indicator` is deliberately **not** removed or weakened by this change. Its regression test currently renders the grid as one of the frame components it proves incapable of signalling scroll position; that test is updated to drop the grid while continuing to assert the requirement against the header and career timeline.
