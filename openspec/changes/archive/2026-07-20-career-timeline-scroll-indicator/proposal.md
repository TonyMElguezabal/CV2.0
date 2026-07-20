## Why

JOS-57 (PRD §5 F2 bullet 3) requires the career timeline built in JOS-56 to also act as a narrative progress indicator — as a recruiter scrolls, the timeline should reflect which chapter is currently in view, so they always know their position in the story. Today `CareerTimeline` renders static, unstyled-by-position nodes; nothing marks which chapter is "current."

## What Changes

- Track which chapter is currently in view using `IntersectionObserver` (observing each chapter's `<details id={experience.id}>` element, already established by JOS-56) and mark the corresponding timeline node as current via `aria-current="location"` plus a visible style change.
- The most recently intersecting chapter stays marked current until a different chapter intersects — avoids flicker at the very top/bottom of the page where nothing may be actively entering the tracking zone.
- The visible style change (e.g., border/text color) is gated behind Tailwind's `motion-safe:` variant, so it never animates under `prefers-reduced-motion` — an instant state change instead, per PRD §4.2 and this ticket's AC3.
- `CareerTimeline` becomes a client component (`"use client"`), since scroll-position tracking is inherently a JavaScript capability — this supersedes JOS-56 design.md's "no `use client`" decision for this component specifically; the component is still server-rendered for first paint, so JOS-56's no-JS navigation guarantees are unaffected (only the *current-position indicator* is a JS-only enhancement, not the navigation itself).

## Capabilities

### Modified Capabilities
- `career-timeline-navigation`: adds the current-position-tracking behavior (AC1/AC2) and the reduced-motion constraint on how that indicator updates (AC3). No existing requirement's behavior changes — purely additive.

## Impact

- `components/CareerTimeline.tsx`: add `"use client"`, `IntersectionObserver`-based active-chapter tracking, `aria-current` on the active node
- `components/CareerTimelineStyles.ts`: add an active-state style variant, motion-safe-gated transition
- New test file covering the tracking behavior (with a mocked `IntersectionObserver`, mirroring the `matchMedia`-mocking pattern already used for `HeroFramer.test.tsx`)
- No content or schema changes; no new dependency (native `IntersectionObserver`)
