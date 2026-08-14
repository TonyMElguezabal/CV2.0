// Decorative full-page layer, `-z-10` like `heroLaptopLayerClass` — negative
// z-index guarantees it paints behind every normal-flow (auto z-index) page
// element, never in front of real content (design.md Decision 6).
// `pointer-events-none` keeps it non-interactive (GridOverlay.test.tsx).
export const gridOverlayClass = "fixed inset-0 -z-10 pointer-events-none";

// Sits at the header's real rendered height (SiteHeaderStyles.ts: h-14 +
// h-10 = 96px = top-24) — the horizontal rule "under the header" from
// proposal.md, drawn here rather than as a border on the header itself so
// it isn't duplicated (task 5.2). The short-viewport override tracks the
// header's own compact-mode height (h-10 + h-8 = 72px, Task Group 8) so the
// rule stays flush with the header's real edge instead of leaving a gap.
export const gridOverlayHeaderRuleClass =
  "absolute inset-x-0 top-24 border-t border-hair [@media(max-height:480px)]:top-[72px]";

// Vertical hairlines at the same max-width every section content column
// uses, so the grid reads as the page's own margins made visible.
export const gridOverlayColumnClass =
  "mx-auto h-full max-w-3xl border-x border-hair";
