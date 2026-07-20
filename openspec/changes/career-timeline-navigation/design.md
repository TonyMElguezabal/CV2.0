## Context

The page today is `Hero → CareerChapters`, a single continuous vertical scroll, centered in a `max-w-3xl` column (`chaptersSectionClass`). There is no overview of the full career story and no way to jump directly to a chapter — a recruiter must scroll past every earlier chapter to reach a later one. `career-chapter-rendering` already established the conventions this component must follow: real content only (no placeholders), keyboard-operable with visible focus, and fully functional without JavaScript. The site owner chose a vertical rail over a horizontal strip specifically because it mirrors the page's existing vertical flow.

## Goals / Non-Goals

**Goals:**
- One timeline node per real chapter (sourced from the same `getExperiences()` `CareerChapters` already uses — single source of truth, no separate sort/order logic).
- Clicking/activating a node navigates to that chapter, using a real anchor link (`#{experience.id}`) — no JavaScript required.
- Nodes are keyboard focusable and activatable, with a visible focus indicator, matching the precedent set by chapter summaries.
- The rail stays usable (present, in-flow, keyboard-reachable) at every viewport width — never `display:none`, since that would remove it from keyboard tab order.

**Non-Goals:**
- Tracking scroll position to highlight the current chapter as "active" — that's JOS-57, built on top of this once the navigation target structure (chapter `id`s) exists.
- Any content changes — reuses existing experience data as-is.

## Decisions

- **Add `id={experience.id}` directly to each `<details>` element in `CareerChapter.tsx`** (currently only the inner `#{id}-projects` section has an id). This is the minimal change needed to make each chapter a valid navigation target, and is additive to `career-chapter-rendering` — no existing scenario changes.
- **Responsive layout via CSS positioning, not visibility toggling.** At `md:` and wider, the rail is `md:fixed md:left-4 md:top-1/2 md:-translate-y-1/2`, an overlay outside the centered content column. Below `md`, it renders as a static, horizontally-scrollable in-flow strip (`flex overflow-x-auto`) placed just before the chapters section. Both are the *same* DOM nodes — only position/flex-direction changes — so nothing is ever removed from the accessibility tree or tab order, satisfying "focusable and activatable" at every breakpoint without needing JS media-query logic.
- **Node placement in the DOM: between the hero and `CareerChapters`.** Tab order becomes hero CTAs → timeline nodes → chapter summaries, i.e., a visitor reaches a full "map" of the story before going deep into any one chapter — consistent with PRD §4.2's progressive-disclosure principle.
- **Visible label is company + date range; accessible name carries full context.** The rail is scanned for "career progression at a glance" (PRD F2), so the primary visible text is the company name and formatted date range (reusing the same `formatChapterDateRange` logic as `CareerChapter.tsx` — extract it to a shared helper rather than duplicating it). Each node's `aria-label` includes the full "`{role} at {company}, {dateRange}`" so screen-reader users get complete context even from the abbreviated visual label, mirroring the accessible-name pattern `career-chapter-rendering` already established for technology links.
- **No new dependency, no client component upgrade needed.** The rail is pure anchor links driven by server-rendered data — no `"use client"` directive required (unlike `HeroFramer`, which needs it for Framer Motion). Keeping it a server component avoids shipping unnecessary JS, in line with PRD §9's JS-budget concern.

## Risks / Trade-offs

- [Risk] A fixed rail on `md:` viewports could overlap page content on unusual viewport/zoom combinations → Mitigation: position it in the left gutter outside the `max-w-3xl` content column, which reliably has clear space on any viewport ≥ `md` (768px) given the column's own centered max-width; visually verify at `md`, `lg`, and `xl` breakpoints during manual testing.
- [Risk] Extracting `formatChapterDateRange` into a shared helper touches `CareerChapter.tsx`, a file with existing behavior guaranteed by `career-chapter-rendering` → Mitigation: pure refactor (move, don't change, the function), existing `CareerChapter` rendering tests (if any) plus the full suite must stay green after the move.

## Open Questions

None outstanding — orientation was the open question in the ticket, and the site owner resolved it (vertical rail).
