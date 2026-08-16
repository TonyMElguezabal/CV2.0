import { focusRingClass } from "./a11yStyles.ts";

// Persistent chrome (proposal.md "Add a persistent site header"). Two rows
// at every width — a brand/contact utility row, then a horizontally
// scrollable nav row — rather than hiding nav under a breakpoint, so every
// nav link stays in the document and tab order at every viewport (Task
// Group 8's AC), mirroring the same same-DOM principle
// CareerTimelineStyles.ts already uses. `bg-background/90 backdrop-blur-sm`
// keeps both rows legible as page content and the fixed HeroLaptop layer
// scroll beneath them. `z-30` sits below the skip link's focused `z-50`
// (SkipToContentLink.tsx) so a focused skip link always stacks above it —
// design.md Decision 3 / Task Group 4. Deliberately edgeless — no border
// lives here (openspec/changes/remove-grid-overlay: the header previously
// relied on a decorative grid overlay to draw a rule beneath it; the grid
// is gone and nothing replaces the rule, per the owner's decision).
export const siteHeaderClass =
  "fixed inset-x-0 top-0 z-30 flex flex-col bg-background/90 backdrop-blur-sm";

// `[@media(max-height:480px)]:` shrinks both rows on short viewports
// (e.g. a landscape phone) rather than persisting at full height —
// design.md Risk "a persistent header costs vertical space on short
// viewports... the frame adapts rather than persists unchanged". Height
// only; nothing is hidden, so every link stays in the document and tab
// order at every viewport (Task Group 8's AC).
export const siteHeaderTopRowClass =
  "flex h-14 items-center justify-between gap-4 px-4 sm:px-6 [@media(max-height:480px)]:h-10";

// Brand letterspacing — proposal.md's "brand letterspacing" line, a
// deliberately quieter treatment than the hero display name.
export const siteHeaderBrandClass = `font-display text-[15px] uppercase tracking-[0.12em] text-ink rounded-sm ${focusRingClass}`;

export const siteHeaderContactLinkClass = `rounded-full border border-hair px-3 py-1.5 text-[13px] font-medium text-ink-body hover:border-ink-meta hover:text-ink motion-safe:transition-colors ${focusRingClass}`;

export const siteHeaderNavClass =
  "h-10 overflow-x-auto px-4 sm:px-6 [@media(max-height:480px)]:h-8";

export const siteHeaderNavListClass = "flex h-full items-center gap-6";

// Nav label size — proposal.md's "nav label size" line: small, uppercase,
// letter-spaced, distinct from the timeline rail's own labels.
export const siteHeaderNavLinkClass = `shrink-0 text-[13px] uppercase tracking-[0.08em] text-ink-meta motion-safe:transition-colors hover:text-ink rounded-sm ${focusRingClass}`;
