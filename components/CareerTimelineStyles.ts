// Same DOM at every viewport width — only position/flex-direction changes
// between breakpoints, so nodes are never removed from the tab order (no
// `hidden`/`display:none` toggling). See design.md decision 2 in
// openspec/changes/career-timeline-navigation.
//
// Editorial rail restyle (editorial-frame design.md Decision 1) — the
// mechanism below (anchors, aria-current, IntersectionObserver, scroll
// listener, keyboard operability, no-JS navigation) is entirely untouched
// per Task Group 6.3; only how it looks changes. The previous per-node
// left border is replaced by a continuous hairline spine
// (timelineSpineClass) with a per-node marker dot (timelineMarkerClass)
// standing in for "current chapter" — closer to design.md's literal
// "hairline spine with a fill/marker" language than a set of disconnected
// border segments. `relative` added to the nav so the spine (a sibling of
// the `<ol>`, not one of its children — an `<ol>` should only contain
// `<li>`s) can position against it.
export const timelineNavClass =
  "relative mx-auto flex max-w-3xl gap-6 overflow-x-auto px-6 pb-6 md:fixed md:left-4 md:top-1/2 md:mx-0 md:max-w-none md:-translate-y-1/2 md:flex-col md:gap-4 md:overflow-visible md:px-0 md:pb-0";

// `md:` only — the mobile layout is a horizontally scrolling row where a
// single vertical spine has no meaningful position; each node keeps its
// own marker dot there instead (timelineMarkerClass, not gated to md:).
export const timelineSpineClass =
  "hidden md:absolute md:left-1 md:top-1 md:bottom-1 md:block md:w-px md:bg-hair";

export const timelineListClass = "flex gap-6 md:flex-col md:gap-4";

export const timelineNodeClass =
  "group relative flex shrink-0 flex-col gap-1 py-1 pl-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-200 md:w-40 md:pl-6";

// Resting = --hair (the spine's own color, so an inactive node reads as
// part of the line); hover = --ink-meta; current chapter = --ink, filled
// slightly larger. Only `transition-colors`, and gated by `motion-safe:` —
// the size change on the current marker is a plain, un-animated property
// change regardless of motion preference, so no indicator change ever
// animates under `prefers-reduced-motion` (Task Group 6.4).
export const timelineMarkerClass =
  "absolute left-0 top-2 h-2 w-2 rounded-full bg-hair motion-safe:transition-colors group-hover:bg-ink-meta group-aria-[current=location]:h-2.5 group-aria-[current=location]:w-2.5 group-aria-[current=location]:bg-ink";

export const timelineCompanyClass =
  "text-[14px] font-medium text-ink-body group-hover:text-ink group-aria-[current=location]:text-ink";

export const timelineDateClass = "text-[13px] text-ink-meta";
