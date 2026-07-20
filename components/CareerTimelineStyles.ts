// Same DOM at every viewport width — only position/flex-direction changes
// between breakpoints, so nodes are never removed from the tab order (no
// `hidden`/`display:none` toggling). See design.md decision 2 in
// openspec/changes/career-timeline-navigation.
export const timelineNavClass =
  "mx-auto flex max-w-3xl gap-6 overflow-x-auto px-6 pb-6 md:fixed md:left-4 md:top-1/2 md:mx-0 md:max-w-none md:-translate-y-1/2 md:flex-col md:gap-4 md:overflow-visible md:px-0 md:pb-0";

export const timelineListClass = "flex gap-6 md:flex-col md:gap-4";

export const timelineNodeClass =
  "group flex shrink-0 flex-col gap-1 border-l-2 border-zinc-800 py-1 pl-3 text-left motion-safe:transition-colors hover:border-zinc-500 aria-[current=location]:border-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-200 md:w-40";

export const timelineCompanyClass =
  "text-sm font-medium text-zinc-300 group-hover:text-white group-aria-[current=location]:text-white";

export const timelineDateClass = "text-xs text-zinc-500";
