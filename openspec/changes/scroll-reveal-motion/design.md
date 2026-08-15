## Context

Below the hero, nothing moves. The complete animation budget across the six
section stylesheets is `transition-colors` ×2, `transition-transform` ×1, and
`animate-bounce` ×2, and no content component imports the motion library at all.

`docs/PRD2.md`'s reveal vocabulary is the reference: headings resolving character
by character out of a blur, content rising as it enters frame. This is the third
and last of the "surprise" windows identified during exploration — arrival
(JOS-112), ambient (JOS-110), and scroll (this change).

The obvious implementation collides with an accepted requirement. The interesting
result is that a different construction avoids the collision entirely.

## Goals / Non-Goals

**Goals**
- Bring PRD2's blur-up character reveal to the site's headings.
- Give content sections an entrance rather than having them simply appear.
- Never make the page's substance conditional on an animation succeeding.

**Non-Goals**
- The arrival sequence (JOS-112) or the ambient layer (JOS-110).
- Gating career content behind scroll milestones.
- Amending the 60fps requirement. Decision 1 makes that unnecessary.
- PRD2's `clip-path` image wipe — see Decision 5.

## Decisions

### Decision 1: Cross-fade a static blur instead of animating the blur radius

The direct implementation animates `filter: blur(12px → 0)` per character. That
conflicts with `performance-budget-compliance`'s requirement that animations run
at 60fps "by animating only compositor-friendly properties (transform/opacity)".

That requirement has been affirmed three separate times: JOS-105 designed an
entire lighting rig around it (routing around `filter: brightness()`,
`box-shadow`, and `background-position` specifically), JOS-107 kept it while
deleting four neighbouring requirements, and JOS-110 broadened it to cover
canvas. Amending it to permit exactly the property JOS-105 worked hardest to
avoid would be a meaningful reversal.

The chosen construction sidesteps it. Each character renders twice:

```
  <span class="char">
    <b aria-hidden blurred>J</b>    filter: blur(12px)   ← STATIC, never animated
    <b sharp>J</b>                  no filter
  </span>

  ghost   opacity 1 → 0   ┐
  sharp   opacity 0 → 1   ├─ plus a shared translateY rise
                          ┘
```

The blur is a static property: rendered once, cached as a compositing layer,
never recomputed. Only opacity and transform animate. Per-frame cost is a
compositor blend rather than fifteen simultaneous convolutions.

It is not a pixel-identical match for a true radius ramp — a cross-fade shows a
blurred ghost dissolving under a sharpening copy rather than one image
progressively resolving. At the durations and stagger involved, combined with the
rise, the difference is very hard to perceive, and it is the standard technique
for this effect precisely because the perceptual cost is low and the performance
cost is large.

### Decision 2: Content must never be hidden by a failed reveal

This is the most consequential requirement in the change, and the one a naive
implementation gets wrong by construction.

The natural pattern — render content at `opacity: 0`, then have an
`IntersectionObserver` add a class that reveals it — has a failure mode where
content is *permanently invisible*: an observer that never fires, a scripting
error before observation is set up, or JavaScript disabled entirely. The page
then presents blank sections with no indication anything is wrong.

`HeroFramer` and `HeroLaptop` already hit this and solved it with a `<noscript>`
override, and JOS-105's lighting rig extended the same override to every light
layer. That precedent covers the JavaScript-disabled case but not the
observer-never-fires case, which is why this is specified as an outcome ("content
is still readable") rather than as a mechanism.

Implementation should bias toward failing visible: content is readable unless
something actively animates it in, rather than hidden until something actively
reveals it. Any flash-of-visible-content this causes is strictly preferable to a
recruiter seeing an empty Career section.

### Decision 3: Reveals at the seams, never on the substance

The owner has consistently chosen wow-factor over conservatism, and that stands.
This is the narrower constraint that survives it.

Laocoön can gate every word behind a scroll milestone because it has roughly
forty words and no informational job. CareerDNA carries a career history that a
recruiter scans in about ninety seconds, with dates, metrics, and evidence links
that need to be findable — including by in-page search, which does not find text
that is not yet revealed.

So the split is: headings and section entrances get the treatment; chapter body
text, dates, role descriptions, metrics, and skill evidence do not. This is a
scope limit on the effect, not a reduction of it — the visible drama is
unchanged, because it lives in the headings and the section transitions.

### Decision 4: Per-character splitting has two correctness traps, both invisible on screen

**Copied text doubles.** With two stacked copies per character, selecting a
heading yields `JJoossee  MMuuññoozz`. On a CV — where a recruiter copies a name
into an ATS or an email — that is a real defect, and it is completely invisible
to visual review. The ghost layer must be excluded from selection.

**The accessible name fragments.** Wrapping each character in its own element can
cause assistive technology to announce a heading letter by letter. The fix is to
keep the heading's accessible name as one unbroken string and hide the split
elements from the accessibility tree — but it has to be done deliberately, and
the split must not disturb heading level or document structure, which
`accessibility-compliance` already regression-tests.

Both are specified as requirements with their own scenarios rather than left as
implementation care, because neither would be caught by looking at the page.

### Decision 5: The image wipe is dropped, not reinvented

PRD2's third reveal is a `clip-path` wipe with a 1.15→1 parallax zoom, applied to
an editorial image inside a slide.

Project cards have no images. There is no `image` field in
`lib/content/schemas.ts` and no `<img>` in `ProjectsSection.tsx` — the cards are
title, company, skill tags, prose, and metrics.

The options were to drop the effect or to add images to the content model to
justify it. Adding a content-model field, an asset pipeline, and per-project
imagery in order to have somewhere to apply an animation is the tail wagging the
dog. The effect goes; if project imagery is ever added for its own reasons, the
wipe can come back with it.

### Decision 6: Reuse the existing observer pattern rather than introducing another

`CareerTimeline` already runs an `IntersectionObserver` with a tuned
`rootMargin` reading-line band, plus a scroll-listener fallback for the
short-trailing-content edge case where an observer callback never fires at all.

That edge case is directly relevant here: it is the same class of bug as
Decision 2's never-fires failure, already encountered and solved once in this
codebase. The reveal system should follow that precedent rather than assume
observer callbacks are guaranteed.

## Risks / Trade-offs

- **A failed reveal hides content.** The most severe outcome this change can
  produce, and the reason Decision 2 exists. *Mitigation:* specified as an
  outcome requirement with three scenarios; implementation biases toward failing
  visible.
- **Doubled copy text ships silently.** Nothing about the rendered page looks
  wrong. *Mitigation:* its own requirement and scenario; verified by actually
  copying a heading in a browser, not by inspecting the DOM.
- **The cross-fade may not satisfy the owner visually.** It is a close but not
  identical match for the PRD2 effect. *Mitigation:* it is cheap to build and
  cheap to A/B against a live blur; if it genuinely disappoints, the amendment
  conversation can be reopened with evidence rather than in the abstract.
- **Two DOM copies per character multiplies node count** on long headings — the
  worst case here is "Senior Software Development Manager at Tata Consultancy
  Services (Banco de Crédito del Perú account)". *Mitigation:* apply the
  per-character treatment only to short display and section headings; longer
  chapter and project titles can reveal as whole blocks, which looks better at
  that length anyway.
- **Reveals compound with the ambient layer and the arrival sequence.** Three
  motion systems on one page can read as busy. *Mitigation:* all three derive
  from the same pace token (JOS-108), and this one is scoped to seams only.
