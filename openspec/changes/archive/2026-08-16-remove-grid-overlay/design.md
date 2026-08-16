## Context

`components/GridOverlay.tsx` renders exactly three hairlines, all from `--hair`:

```
  gridOverlayColumnClass      mx-auto h-full max-w-3xl border-x border-hair
                              └─ the two vertical lines, at the same max-width
                                 every section content column uses

  gridOverlayHeaderRuleClass  absolute inset-x-0 top-24 border-t border-hair
                              [@media(max-height:480px)]:top-[72px]
                              └─ the one horizontal line, flush with the
                                 header's real rendered height (h-14 + h-10,
                                 and h-10 + h-8 in compact mode)
```

It is mounted once, in `app/(marketing)/layout.tsx`, at `-z-10` behind all
normal-flow content. `/admin` never mounts it.

The constraint that shapes this change is not the code — deleting a decorative
layer is trivial — it is that `site-editorial-frame` is an **accepted** capability
that requires the grid to exist, and that two things which look like grid cleanup
are actually load-bearing elsewhere.

## Goals / Non-Goals

**Goals:**
- Remove all three lines, and the component that draws them, completely.
- Leave `site-editorial-frame` describing the frame that actually exists.
- Preserve every constraint the grid was incidentally helping to demonstrate,
  rather than losing it as collateral.

**Non-Goals:**
- Replacing the grid with different decoration. The frame simply has less.
- Re-styling the header, beyond it no longer having a rule beneath it.
- Touching `HeroLaptop`, `AmbientSparkleLayer`, or the scroll-reveal system.
- Removing the `--hair` token.

## Decisions

### Decision 1: Delete the component outright rather than hiding or gating it

Three options were considered:

| Option | Outcome |
|---|---|
| CSS-only hide (`hidden` / `display:none`) | The lines disappear but every module still ships and still renders a fixed layer. Dead weight plus a live element that looks removed but isn't. |
| Prop or flag to disable it | Introduces configuration for a decision the owner has already made once, and leaves a code path nobody exercises. |
| **Delete component, styles, test, and mount** | The frame genuinely has one fewer layer. Nothing to re-enable by accident. |

Full deletion is chosen. If decoration is ever wanted again, it should be
proposed on its own terms rather than resurrected from a disabled flag.

### Decision 2: The header stays edgeless — nothing replaces the rule

The horizontal rule is the header's only edge, and `SiteHeaderStyles.ts` says so
explicitly: *"The grid overlay (Task Group 5), not this class, draws the
horizontal rule under the header, so no border lives here."* It was drawn from
the grid specifically so it would not be duplicated.

The tempting "safe" move — add `border-b border-hair` to `siteHeaderClass` to
keep a separation — is exactly wrong: it reinstates the line this change exists
to remove, just from a different file. The owner's decision (2026-08-15) is a
fully edgeless header.

This is safe because the header already carries its own separation:
`bg-background/90 backdrop-blur-sm`. Content scrolling beneath it is blurred and
dimmed, not merely overlapped, so the header stays legible without a rule. That
claim is visual, so it is verified in a real browser rather than asserted here.

### Decision 3: `oneScrollIndicator.test.tsx` is edited, not deleted

This is the one place where following the obvious pattern silently breaks
something. That file renders `<GridOverlay />` in two of its three tests, so it
reads like grid-related cleanup — but the requirement it guards,
`The frame introduces no second scroll-position indicator`, **survives this
change untouched**, and this test is its only enforcement. Its own header comment
states the failure mode it exists to catch: *"someone adding a second progress
indicator later 'because the frame should have one.'"*

Precise treatment:

| Test | Action |
|---|---|
| "only a CareerTimeline node can ever carry aria-current in the composed frame" | **Keep.** Drop `<GridOverlay />` from the composed render; the `SiteHeader` + `CareerTimeline` assertion is the substance. |
| "the header's own nav never carries aria-current" | **Keep unchanged.** Never referenced the grid. |
| "the grid overlay renders no interactive or stateful indicator elements at all" | **Delete.** Asserts a property of a component that no longer exists. |

### Decision 4: `--hair` is retained, and this is a guarded non-change

The archived `editorial-frame` design called the grid *"exactly the intended
consumer"* of `--hair`, which invites the conclusion that removing the grid
should remove the token. It should not — five other style modules still use it:

`CareerTimelineStyles` (`bg-hair` spine and resting nodes), `CareerChaptersStyles`
(`border-b`, `decoration-hair`), `ProjectsSectionStyles` (skill-tag borders),
`HeroShellStyles` (secondary CTA border), `SiteHeaderStyles` (contact pill
border).

`app/globals.css` is therefore untouched, and `components/palette.test.tsx` —
which asserts `--hair` stays below the normal-text threshold and is never used as
a text colour — must remain green and unmodified. It is the tripwire for this
decision.

### Decision 5: The capability Purpose is rewritten, applied verbatim at sync

Delta specs carry requirements, not the capability's Purpose, so — following the
precedent set by `narrow-performance-budget` (JOS-107) — the replacement text is
recorded here and applied when the spec is synced after merge.

Current:
> Defines the site's persistent editorial frame: a fixed header carrying the
> brand wordmark, section navigation, and a contact action; stable anchor targets
> on every navigable section; and a decorative grid overlay of hairlines that
> gives the page a composed, deliberate structure instead of a single
> free-scrolling column. Fixed chrome creates obligations of its own — anchor
> clearance so destinations aren't hidden beneath the header, and a skip link
> that stays visible above it — which this capability also owns. The frame
> introduces no scroll-position indicator of its own: the career timeline is the
> site's single indicator of position within the document, and this capability
> enforces that no second one is added alongside it.

Rewritten, to replace it at sync time:
> Defines the site's persistent editorial frame: a fixed header carrying the
> brand wordmark, section navigation, and a contact action, and stable anchor
> targets on every navigable section. Fixed chrome creates obligations of its
> own — anchor clearance so destinations aren't hidden beneath the header, and a
> skip link that stays visible above it — which this capability also owns. The
> frame is deliberately minimal: it carries no decorative grid, and the header is
> edgeless, separated from the content scrolling beneath it by its own
> translucent blurred background rather than by a rule. The frame introduces no
> scroll-position indicator of its own: the career timeline is the site's single
> indicator of position within the document, and this capability enforces that no
> second one is added alongside it.

### Decision 6: `AmbientSparkleLayer` does not move; only the prose about it changes

`AGENTS.md` locates the sparkle layer *"between `HeroLaptop` and `GridOverlay`"*,
which makes the removal look like it disturbs a documented stacking arrangement.
It does not. The real constraint is one-sided — the sparkle layer must paint
**after** `HeroLaptop` and its scrim (measured: placing it beneath cut its visible
contribution by ~80%). `GridOverlay` sat *after* the sparkle layer, so deleting it
removes a later sibling and leaves the earlier ordering relation intact.

The component is therefore not touched. Only the sentence describing its position
relative to a component that no longer exists is rewritten.

## Risks / Trade-offs

- **The header may read as unanchored once its rule is gone, particularly where
  dense content scrolls beneath it.** → Mitigation: the translucent blurred
  background is the actual separation mechanism (Decision 2), and browser
  verification at both a desktop and a short/landscape viewport is a required
  step, not an optional one. If it genuinely reads badly, that is a finding to
  report to the owner — not a licence to quietly add a border back.
- **The scroll-indicator guardrail is dropped by accident**, by deleting
  `oneScrollIndicator.test.tsx` alongside the component it partly tests. →
  Mitigation: Decision 3 specifies the file's treatment test by test, and the
  surviving requirement is called out explicitly in the delta spec's Migration
  note.
- **`--hair` is removed as apparently-dead token cleanup.** → Mitigation:
  Decision 4 enumerates the five remaining consumers; `palette.test.tsx` fails
  loudly if the token disappears.
- **Stale references survive in documentation and test titles**, leaving grep
  hits for a component that no longer exists. → Mitigation: a `grep -rn
  "GridOverlay"` gate returning only archived OpenSpec history is an acceptance
  criterion.

## Migration Plan

No data migration, no deploy sequencing, no feature flag. The change is a pure
deletion plus documentation and spec updates; rollback is `git revert` of a single
commit. Nothing persists state related to the grid, so there is no forward or
backward compatibility concern.
