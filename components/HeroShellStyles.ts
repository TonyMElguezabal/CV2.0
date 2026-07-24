import { focusRingClass } from "./a11yStyles.ts";

export const heroWrapperClass =
  "relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center";

export const heroNameClass =
  "font-sans text-4xl font-semibold tracking-tight sm:text-6xl";

export const heroPositioningClass =
  "mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl";

export const spacerSectionClass =
  "flex min-h-screen items-center justify-center text-zinc-400";

export const heroAnimatedTextClass = "hero-animated-text";

export const ctaRowClass =
  "mt-10 flex flex-wrap items-center justify-center gap-4";

export const ctaPrimaryClass = `text-sm font-medium text-zinc-200 underline underline-offset-4 hover:text-white ${focusRingClass}`;

export const ctaSecondaryClass = `rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500 hover:text-white ${focusRingClass}`;

// The laptop is a fixed, whole-page background layer, kept behind page
// content (negative z-index) and non-interactive (pointer-events none) —
// see design.md Decision 2/3 in openspec/changes/hero-laptop-scroll-motion.
export const heroLaptopLayerClass =
  "fixed inset-0 -z-10 hidden items-center justify-center overflow-hidden pointer-events-none sm:flex";

// Scrim keeps the laptop subdued behind text for contrast — Decision 3.
export const heroLaptopScrimClass =
  "absolute inset-0 bg-zinc-950/80";

// `hero-laptop-scene`/`-lid`/`-screen` are dedicated marker classes (not
// Tailwind utilities) so the `<noscript>` override in HeroLaptop.tsx can
// force the no-JS static state without depending on test-only attributes —
// mirrors `heroAnimatedTextClass`'s role for HeroFramer's noscript override.
export const heroLaptopSceneClass =
  "hero-laptop-scene relative [perspective:1200px] [transform-style:preserve-3d]";

export const heroLaptopBaseClass =
  "relative h-40 w-64 rounded-b-lg border border-zinc-700 bg-gradient-to-b from-zinc-700 to-zinc-900 sm:h-56 sm:w-96";

export const heroLaptopLidClass =
  "hero-laptop-lid absolute inset-x-0 bottom-full h-40 origin-bottom rounded-t-lg border border-zinc-700 bg-gradient-to-t from-zinc-900 to-zinc-700 [transform-style:preserve-3d] sm:h-56";

export const heroLaptopScreenClass =
  "hero-laptop-screen absolute inset-2 overflow-hidden rounded border-2 border-zinc-950 bg-black";

// Hinge shadow line at the base's top edge, where the lid meets the base.
export const heroLaptopHingeClass =
  "absolute inset-x-3 top-0 h-px bg-black/50 sm:inset-x-4";

// Keyboard deck: a small grid of key marks on the base's top face. The
// container needs an explicit height for `grid-rows-5` to divide — grid
// cells have no intrinsic size of their own to size the rows from.
export const heroLaptopKeyboardClass =
  "absolute inset-x-4 top-3 grid h-16 grid-cols-10 grid-rows-5 gap-1 sm:inset-x-6 sm:top-5 sm:h-28 sm:gap-1.5";

export const heroLaptopKeyClass =
  "rounded-[1px] bg-zinc-950/60 sm:rounded-sm";

// Trackpad: a rounded rectangle centered below the keyboard.
export const heroLaptopTrackpadClass =
  "absolute inset-x-0 bottom-3 mx-auto h-8 w-20 rounded-md border border-zinc-950/40 bg-zinc-950/20 sm:bottom-4 sm:h-10 sm:w-28";

// Closed-pose lid accent: a subtle centered mark on the lid's outward-facing
// top, so the shut clamshell still reads as a laptop rather than a flat slab
// — see design.md Decision 3 in openspec/changes/hero-laptop-visual-fidelity.
export const heroLaptopLidAccentClass =
  "absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full bg-zinc-950/40 sm:top-4 sm:h-2.5 sm:w-2.5";

export const terminalClass =
  "h-full w-full space-y-1 p-3 font-mono text-[0.6rem] text-emerald-400 sm:text-xs";
