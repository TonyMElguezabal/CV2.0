// Static blur radius for the ghost copy — never referenced in any
// framer-motion `initial`/`animate` prop, so `filter` is never an
// animated property (design.md Decision 1 in
// openspec/changes/scroll-reveal-motion: a cross-fade of two stacked
// copies, not an animated blur radius, so the site-wide 60fps
// compositor-friendly-properties requirement needs no amendment).
export const revealHeadingGhostBlurClass = "blur-[12px]";

// Per-character stagger — deliberately small relative to pace.duration
// (1.4s), so a short word like "Skills" finishes its whole stagger well
// before the shared entrance duration ends.
export const REVEAL_HEADING_STAGGER_SECONDS = 0.03;
