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
