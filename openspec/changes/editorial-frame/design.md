## Context

The marketing layout has no `<header>` element. The top of every screen is empty,
there is no persistent navigation, and the only `<nav>` on the site is
`CareerTimeline`'s fixed left rail (`md:fixed md:left-4 md:top-1/2`).

`CareerTimeline` is more capable than its name suggests. It renders one anchor
per chapter from `getExperiences()`, tracks the chapter in view with an
`IntersectionObserver` (plus a scroll listener for the short-trailing-content
edge case), marks it `aria-current="location"`, and is specified across seven
requirements including keyboard operability at every viewport and navigation
without JavaScript. **It is already a scroll progress rail.**

That fact is what shaped this change.

## Goals / Non-Goals

**Goals**
- Give the page a frame: persistent header, section navigation, grid.
- Make the frame's chrome correct where fixed positioning historically breaks
  things — anchor clearance, skip-link visibility, landmark naming.
- Have exactly one scroll-position indicator on the page, and record in spec why.

**Non-Goals**
- Asymmetric per-section layout. Sections stay `max-w-3xl` centred here.
- Any change to how the timeline *behaves* — anchors, observer, `aria-current`,
  keyboard, no-JS all stay exactly as shipped.
- Scroll-linked reveals or entrance choreography (JOS-111, JOS-112).

## Decisions

### Decision 1: The timeline becomes the rail rather than gaining a neighbour

Three options were put to the owner with visual comparisons:

| Option | Fixed elements | Spec impact | Outcome |
|---|---|---|---|
| Timeline restyled as the rail | 2 | MODIFIED (visual + role) | **chosen** |
| Header + grid only, no rail | 2 | none to the timeline | smallest, least complete frame |
| Timeline retires, new thin rail | 2 | **REMOVED** a capability | loses chapter jump links |

The third was closest to `docs/PRD2.md`'s literal design and was rejected: it
would delete an accepted capability with seven requirements — per-chapter
navigation, keyboard operability at every width, no-JS anchors — to gain a
thinner-looking rail. Trading working accessibility for visual purity is a bad
exchange on a CV whose job is to be read.

The chosen option is a **presentation change with a role clarification**. The
timeline's mechanism is untouched; what changes is how it looks and the fact that
the spec now records it as the site's sole position indicator.

### Decision 2: Record the "one indicator" rule in spec, not just here

The merge decision's failure mode is obvious: six months from now, someone
implementing JOS-112's arrival sequence or a future frame refinement adds a thin
progress bar because the frame "should have one," and the page ends up with two.

So the rule is written into both capabilities — as a requirement in
`site-editorial-frame` ("The frame introduces no second scroll-position
indicator") and inside the timeline's own amended requirement. Design documents
get read once; requirements get checked.

### Decision 3: Fixed chrome creates two collisions, and both are accessibility regressions

These are the parts of this change most likely to ship broken, because both look
fine in a screenshot.

**Anchor targets scroll under the header.** Any fixed top chrome means an
in-page anchor lands its destination beneath the chrome. The clearance
(`scroll-margin-top`) has to be applied to **every** anchor destination on the
page, not only the header's own links — the timeline's chapter anchors and the
skip link's `#main` are equally affected, and the timeline's are the ones most
likely to be forgotten because they predate the header.

**The skip link and the header occupy the same pixels.** `SkipToContentLink`
renders at `focus:top-4 focus:left-4 focus:z-50`. A fixed header sits exactly
there. If the header stacks above it, the skip link is invisible when focused —
which silently breaks the accepted `accessibility-compliance` requirement that it
"becomes visible on focus", while remaining present in the DOM and passing any
test that only checks for its existence.

Both are covered by their own requirements with their own scenarios rather than
being left to implementation care.

### Decision 4: Two `<nav>` landmarks need distinct names

Adding header navigation gives the page two `<nav>` landmarks. `CareerTimeline`
already sets `aria-label="Career timeline"`; the header's navigation needs its
own name, or assistive technology announces two undifferentiated "navigation"
regions.

`accessibility-compliance` already regression-tests semantic structure, so this
is verified by the existing harness rather than by inspection — but the
requirement is stated explicitly because "add a nav" is the kind of change where
the label is an afterthought.

### Decision 5: Section ids are a prerequisite, not a detail

Only `ContactSection` has an `id`. Skills, Projects, and the career chapters have
none, so header navigation has nothing to point at. This has to land first or the
header ships with dead links.

Worth noting the chapters already expose per-chapter ids on their `<details>`
elements (the timeline's anchors depend on them) — so the gap is at the *section*
level, not the chapter level.

### Decision 6: The grid uses the borders-only tint, and that constraint is load-bearing

JOS-108 specifies `--hair` (`#6f6558`, 3.47:1) as a **borders-only** tint because
it fails normal-text contrast. The grid overlay is exactly the intended consumer.

The requirement therefore states the grid carries no text — not as a stylistic
preference, but because a text node inside the grid would inherit a tint that is
non-compliant at normal size, and that failure would be invisible to anyone
reviewing the grid as "just decoration."

### Decision 7: The contact action appears twice, deliberately

The header's contact pill duplicates one of the existing `HeroCtas`. This is
intentional and worth stating so it does not read as an oversight: the hero CTAs
scroll away within the first viewport, while the header persists — so the
duplication is what makes the action continuously available, which is the point
of putting it in the frame.

## Risks / Trade-offs

- **Three fixed elements on one screen** (header, timeline rail, chat widget)
  plus the hero laptop layer. Even at two navigation elements this is dense, and
  the timeline already collided with hero copy once (JOS-105 measured a 112px
  overlap, fixed with `md:pl-56`). *Mitigation:* verify the real worst case in a
  browser at multiple widths — the collision that mattered last time was only
  visible with actual layout, not in jsdom.
- **`scroll-margin-top` is easy to under-apply.** Getting it on the header's own
  targets and forgetting the timeline's is the likely failure, and it presents as
  "clicking a chapter feels broken" rather than as an error.
  *Mitigation:* the requirement names all three anchor families explicitly, and
  each has its own scenario.
- **A persistent header costs vertical space on short viewports.** On a landscape
  phone this can meaningfully reduce the reading area. *Mitigation:* the
  small-viewport requirement obliges the frame to adapt rather than persist
  unchanged; the specific adaptation is an implementation decision, verified in a
  browser.
- **Restyling the timeline risks its labels.** A rail that reads as a pure
  progress bar would drop the company/date text — which is exactly what makes the
  timeline useful for scanning a career. *Mitigation:* the amended requirement
  explicitly preserves both the visible labels and the full accessible name, with
  its own scenario.
