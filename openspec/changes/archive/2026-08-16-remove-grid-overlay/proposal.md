Linear-Issue: JOS-113

## Why

The site renders a decorative grid of three hairlines — two vertical rules at the
content column's edges, and one horizontal rule under the header. The owner has
decided they no longer earn their place: they read as chrome rather than
structure, and the page is stronger without them.

Removing them is not a CSS tweak. `site-editorial-frame` is an **accepted**
capability whose requirement states *"The site SHALL render a decorative grid of
hairlines as part of the frame"*, and whose Purpose advertises the grid as giving
the page "a composed, deliberate structure instead of a single free-scrolling
column." Deleting the component without amending that capability would leave
`openspec/specs/` asserting behavior the system no longer has — the exact drift
`narrow-performance-budget` (JOS-107) was written to stop happening elsewhere.

## What Changes

- **Remove the grid overlay entirely** — the component, its styles, its own test
  file, and its mount in the marketing layout. Both the vertical hairlines and
  the horizontal rule under the header go; there is no partial version of this.
- **The header becomes fully edgeless** (owner decision, 2026-08-15). The
  horizontal rule is the header's only edge, drawn from the grid rather than as a
  border on the header itself, specifically so it wasn't duplicated. Nothing is
  added back in its place: `siteHeaderClass`'s existing
  `bg-background/90 backdrop-blur-sm` is what keeps the header legible over
  content scrolling beneath it, and that is unchanged.
- **Amend `site-editorial-frame`** to stop requiring a grid: one requirement
  removed, one requirement's grid clause dropped, and the capability's Purpose
  rewritten so it no longer describes a frame element that does not exist.
- **Preserve the constraint the grid was incidentally helping to prove.** The
  "no second scroll-position indicator" requirement survives untouched. Its
  regression test currently renders the grid as one of the components it proves
  innocent; that test must be *edited*, not deleted alongside the component.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-editorial-frame`: the frame no longer includes a decorative grid.
  `Requirement: The grid overlay is decorative only` is removed outright;
  `Requirement: The frame adapts on small viewports without trapping content`
  loses its grid-legibility clause and keeps the rest; the capability's Purpose
  is rewritten. The header, anchor-target, anchor-clearance, skip-link, and
  single-scroll-indicator requirements are all unaffected.

## Impact

- **Code (all frontend, marketing routes only — `/admin` never mounted the
  grid):** `components/GridOverlay.tsx`, `components/GridOverlayStyles.ts`, and
  `components/GridOverlay.test.tsx` are deleted; `app/(marketing)/layout.tsx`
  drops the import, the mount, and its explanatory comment.
- **Tests that must be edited rather than deleted:**
  `components/oneScrollIndicator.test.tsx` (guards a surviving requirement) and
  `components/AmbientSparkleLayer.test.tsx` (a name-only reference in a test
  title, no functional coupling).
- **Deliberately unchanged:** `app/globals.css`'s `--hair` token stays — the grid
  was its most visible consumer but five other style modules still use it, and
  `components/palette.test.tsx` depends on it. `AmbientSparkleLayer` keeps its
  position after `HeroLaptop`; only the prose describing it relative to the grid
  changes.
- **No API, endpoint, route, database, content-model, or dependency impact.**
  Bundle size moves slightly down (two modules removed, one fewer fixed layer to
  paint). No new dependency.
- **Documentation:** `AGENTS.md` §9 references the grid twice and must be
  updated; the same passage cites a now-archived OpenSpec path that can be
  corrected while there.
