// Shared marker classes for the scroll-reveal system's no-JS safety net —
// one `<noscript>` override in app/(marketing)/layout.tsx covers every
// reveal instance on the page, rather than duplicating a per-instance
// override the way HeroFramer.tsx does for its own single entrance
// (openspec/changes/scroll-reveal-motion design.md Decision 2).
//
// Deliberately two separate classes, never combined on the same element:
// `revealAnimatedClass` is forced to its final visible state under no-JS
// (section wrappers and each heading's sharp character copies).
// `revealGhostClass` is forced hidden under no-JS instead — the blurred
// ghost copies exist only to cross-fade under the sharp copies; if the
// no-JS override made both visible, the sharp text would render with a
// permanent blurred halo behind it.
export const revealAnimatedClass = "reveal-animated";
export const revealGhostClass = "reveal-ghost";

// The single shared no-JS override — mounted once in
// app/(marketing)/layout.tsx inside a <noscript><style> block, covering
// every SectionReveal/RevealHeading instance on the page. Exported as a
// constant (not inlined at the call site) so it has one source of truth
// and is directly testable.
export const revealNoscriptOverrideCss = `.${revealAnimatedClass} { opacity: 1 !important; transform: none !important; } .${revealGhostClass} { opacity: 0 !important; }`;
