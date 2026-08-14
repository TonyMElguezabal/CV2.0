// Shared entrance-motion pace — site-typography-and-palette design.md
// Decision 4. Owner-selected 1.4s on a strong ease-out curve, from an A/B
// comparison against the site's original 0.6s easeOut in the typeface
// specimen. Every entrance derives its timing from this one token rather
// than picking its own duration/easing/offset.
export const pace = {
  duration: 1.4,
  ease: [0.16, 1, 0.3, 1] as const, // cubic-bezier(.16, 1, .3, 1)
  offsetY: 24, // px — the larger of the hero's two prior offsets (24/16),
  // unified into one shared distance rather than two.
};
