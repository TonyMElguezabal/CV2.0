// Shared marker class for the arrival sequence's no-JS safety net — one
// `<noscript>` override in app/(marketing)/layout.tsx covers every
// participant, mirroring the scroll-reveal system's `RevealStyles.ts`
// (openspec/changes/scroll-reveal-motion design.md Decision 2) rather than
// duplicating a per-instance override the way HeroFramer.tsx's own
// pre-existing entrance override does.
export const arrivalAnimatedClass = "arrival-animated";

// The single shared no-JS override — mounted once in
// app/(marketing)/layout.tsx inside a <noscript><style> block, covering
// every arrival-sequence participant. Exported as a constant so it has one
// source of truth and is directly testable.
export const arrivalNoscriptOverrideCss = `.${arrivalAnimatedClass} { opacity: 1 !important; transform: none !important; }`;
