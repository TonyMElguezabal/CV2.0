## Context

`HeroFramer.tsx` renders a `min-h-screen` spacer div (`id="hero-next"`,
text "More below") purely so the hero's "Scroll to explore ↓" CTA has an
anchor to scroll to. It sits between the hero and `CareerTimeline`/
`CareerChapters` in document order. JOS-114 reports it as a visibly broken
empty screen the visitor scrolls through before reaching real content.

This is a small, single-surface bug fix — no new dependency, no
architectural change, no data model involved — so this design doc is
intentionally short.

## Goals / Non-Goals

**Goals:**
- Remove the empty spacer section and its "More below" label entirely.
- Preserve the primary CTA's scroll-to-next-content behavior — it must
  still land the visitor somewhere sensible, not become a dead link.

**Non-Goals:**
- Redesigning the hero-to-content transition beyond removing the spacer
  (no new visual treatment, no changed section order).
- Touching `CareerTimeline`, `CareerChapters`, or any other section's
  markup beyond confirming `id="career"` already exists there.

## Decisions

### Decision 1: Retarget the CTA to the existing `#career` anchor, rather than keeping a minimal invisible spacer

Two options:

| Option | Outcome |
|---|---|
| Keep a spacer div, but shrink it to zero height / drop its visible text | Still an extra DOM node with no content purpose, existing only to hold an id — the underlying "empty section" smell survives, just less visibly |
| **Retarget `href="#hero-next"` → `href="#career"`, delete the spacer entirely** | Reuses an anchor that already exists, is already scroll-clearance-covered (the universal `[id] { scroll-margin-top }` rule), and is already the header nav's own "Career" target — no new element, no new id to maintain |

Retargeting is preferred: it removes the element the bug is actually about,
rather than just making it less noticeable, and `#career` was already a
legitimate "next content" landmark before this change.

### Decision 2: `id="career"` is reused as-is, not duplicated

An element can only carry one `id`; `#career` already serves the header's
"Career" nav link ([[siteNavigation.ts]]). The hero's "Scroll to explore"
CTA pointing to the same anchor is not a conflict — multiple links may
target one anchor — and keeps the site to one canonical "start of career
content" landmark instead of two names for the same place.

## Risks / Trade-offs

[Risk: a reader might expect "Scroll to explore" to land exactly at the
hero's original scroll position, one viewport down, rather than at
`#career`'s content] → Mitigation: this was already true of the removed
spacer, which was itself positioned as "the next thing after the hero" —
`#career` is that same next thing, just without an empty screen in front
of it. No behavioral regression, only the removal of a dead screen.

[Risk: some other code or test still references `#hero-next` or
`spacerSectionClass` and breaks silently] → Mitigation: confirmed via
`grep` (recorded in proposal.md's Impact section) that the only live
references are `HeroFramer.tsx`, `HeroCtas.tsx`, and
`HeroCtas.test.tsx` — all three are updated by this change. Archived
change history mentioning `hero-next` is left untouched, matching this
repo's existing convention of not editing prior tickets' historical
records.
