Linear-Issue: JOS-109

## Why

The page has no frame. There is no `<header>` element anywhere in the marketing
layout — the first ~60px of every screen is empty, there is no persistent
navigation, and there is no spatial reference tying the sections together. The
only `<nav>` on the site is `CareerTimeline`'s fixed left rail.

This is what makes the page read as *flowed* rather than *composed*: content
scrolls past in a single centred column with nothing holding it. `docs/PRD2.md`'s
whole-page guidance identifies the missing chrome — a fixed header, a grid of
hairlines, and a scroll progress rail — and JOS-108 supplies the type scale and
palette those elements need in order to look deliberate rather than bolted on.

**The interesting problem is not the CSS.** `CareerTimeline` is already a scroll
progress rail: it renders one node per chapter, tracks the chapter in view with
an `IntersectionObserver`, marks it `aria-current="location"`, and shows a
visible active style. Adding PRD2's separate "stories-style progress rail"
alongside it would put **two fixed vertical elements on screen both indicating
scroll position** — visual noise, duplicated behaviour, and a third fixed element
competing for the viewport edges with a rail that has already caused one
collision (JOS-105 measured a 112px overlap between the timeline and the hero
copy).

Owner decision: **the timeline becomes the rail.** It is restyled to read as an
editorial progress indicator while keeping its labels and every accessibility
guarantee it already has. No second rail is introduced.

## What Changes

- **Add a persistent site header** — brand wordmark, section navigation, and a
  contact action. It renders after the skip link so the skip link remains the
  first focusable element.

- **Give the sections anchor targets.** Only `ContactSection` currently has an
  `id`; Skills, Projects, and the career chapters have none, so there is nothing
  for header navigation to link to. This is a prerequisite, not a nicety.

- **Add a decorative grid overlay** — vertical hairlines plus a horizontal rule
  under the header, drawn from JOS-108's `--hair` token (which is specified as
  borders-only precisely because it fails normal-text contrast). Non-interactive
  and hidden from assistive technology.

- **Restyle `CareerTimeline` as the editorial rail** — a hairline spine with a
  fill/marker indicating the current chapter, retaining the company and date
  labels and the full accessible name. Behaviour is untouched: same anchors, same
  observer, same `aria-current`, same keyboard operability, same no-JS
  navigation.

- **Fix the two collisions a fixed header creates**, both of which are easy to
  ship broken:
  1. **Anchored targets scroll under the header.** Every anchor destination —
     header nav links, timeline nodes, and the skip link's `#main` — needs
     `scroll-margin-top` clearance, or activating any of them lands the target
     beneath the fixed chrome.
  2. **The skip link renders at `focus:top-4 focus:left-4 focus:z-50`** —
     exactly where the header sits. If the header stacks above it, the skip link
     becomes invisible on focus, breaking an accepted `accessibility-compliance`
     requirement that says it "becomes visible on focus".

- **Out of scope, deliberately:** the asymmetric per-section column layout
  (sections stay `max-w-3xl` centred). That is a structural relayout of every
  section with its own responsive risk, and it is where the timeline collision
  actually bites. Splitting it keeps this change additive and reversible.

## Capabilities

### New Capabilities
- `site-editorial-frame`: the persistent page chrome — header with brand,
  section navigation and contact action; section anchor targets; the decorative
  grid overlay; and the obligations that fixed chrome creates (anchor clearance,
  skip-link visibility, mobile behaviour). It also carries the rule that the
  frame introduces **no second scroll-position indicator**, so the merge decision
  is enforced by spec rather than remembered.

### Modified Capabilities
- `career-timeline-navigation`: the "Timeline indicates the chapter currently in
  view" requirement is amended to state the timeline's dual role — it is both the
  chapter navigator and the site's single scroll-position indicator. Its
  mechanism (`aria-current="location"` plus a visible style change) is unchanged;
  what changes is that the spec now records *why* no other component may take
  that job.

## Impact

- **Modified files:** a new header component and its styles, a new grid-overlay
  component, `app/(marketing)/layout.tsx` (mount the header after
  `SkipToContentLink`), `components/CareerTimelineStyles.ts` (rail restyle),
  `components/SkillsSection.tsx` / `ProjectsSection.tsx` / `CareerChapters.tsx`
  (add `id`s), `app/globals.css` (`scroll-margin-top`), plus tests.
- **Depends on JOS-108** (`site-typography-and-palette`). The header's brand
  letterspacing, nav label size, hairline colour, and contact pill all key off
  that change's type scale and palette tokens. Building this first means building
  it twice.
- **Accessibility is the main surface area, not performance.** Two `<nav>`
  landmarks now exist and need distinct accessible names; the heading/landmark
  order must stay valid (`accessibility-compliance` regression-tests this); the
  grid overlay must be `aria-hidden` and non-interactive; and the two collisions
  above are both accessibility regressions if missed.
- **The contact action appears in two places** — the header pill and the existing
  hero CTAs. That is intentional: the hero CTAs scroll away, the header persists.
  Noted so it reads as a decision rather than an oversight.
- **No new dependency.** The header and grid are static DOM and CSS; the rail
  reuses the observer `CareerTimeline` already runs. Nothing is added to the
  Cloudflare Worker bundle (JOS-106).
