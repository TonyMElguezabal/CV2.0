## Why

JOS-56 (PRD §5 F2) requires an interactive timeline of roles/companies so a recruiter can see career progression at a glance and jump directly to any chapter. Today the only way to reach a chapter is scrolling past every preceding one — there is no overview and no direct-navigation affordance. The ticket itself flagged the horizontal-vs-vertical orientation as an open question; the site owner has chosen a vertical side rail, since the page is already a single continuous vertical scroll (hero → chapters) and a vertical rail mirrors that flow directly, unlike a horizontal strip which would need its own independent scroll/drag interaction.

## What Changes

- Add a new `CareerTimeline` component: a vertical rail of nodes, one per `getExperiences()` entry, each showing company/role and date range, rendered as real anchor links.
- Each node links to its corresponding chapter via a fragment anchor (`#{experience.id}`); add that `id` to each chapter's `<details>` element in `CareerChapter.tsx` (it doesn't have one today — only its inner Projects section does).
- Mount `CareerTimeline` in `app/page.tsx` alongside `CareerChapters`, positioned as a fixed rail on wider viewports; degrade to a minimal (but still present and keyboard-reachable) form on narrow viewports rather than disappearing.
- Nodes are real `<a>` elements: focusable and activatable by keyboard with no JavaScript required, consistent with `career-chapter-rendering`'s existing no-JS/keyboard-operability precedent.
- **Not in this change**: tracking scroll position to highlight the "current" chapter as the visitor scrolls — that is JOS-57 `[3.2]`, layered on top of this navigation once it exists.

## Capabilities

### New Capabilities
- `career-timeline-navigation`: the timeline's content sourcing (real experience data, no placeholders), per-node rendering (company/role/dates), anchor-based navigation to chapters, and keyboard operability without JavaScript.

### Modified Capabilities
- `career-chapter-rendering`: each chapter's `<details>` element gains a stable `id` (its experience id) so it can be a navigation target — additive, no existing requirement's behavior changes.

## Impact

- New: `components/CareerTimeline.tsx`, `components/CareerTimelineStyles.ts`, `components/CareerTimeline.test.tsx`
- `components/CareerChapter.tsx`: add `id={experience.id}` to the `<details>` element
- `app/page.tsx`: mount `CareerTimeline`
- No schema or content changes — reuses `getExperiences()` as-is
- No new dependencies
