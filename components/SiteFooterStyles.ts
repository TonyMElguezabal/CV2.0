// Transparent: the page's existing ambient background (AmbientSparkleLayer,
// the hero scene's fixed layers) shows through the footer rather than being
// boxed off by a flat panel (design.md Decision 3, revised). Just a thin
// accent rule along the top edge. Bottom padding clears the fixed chat
// trigger (bottom-6 right-6, ~56px tall).
export const siteFooterClass =
  "mx-auto flex w-full flex-col items-center gap-10 border-t border-accent px-6 pt-16 pb-28 text-center";

export const footerTextBlockClass = "flex max-w-xl flex-col items-center gap-4";

export const footerHeadlineClass =
  "font-display font-bold text-[clamp(22px,3vw,34px)] leading-[1.1] tracking-[-0.03em] text-balance text-ink";

export const footerSublineClass = "text-[15px] leading-[1.6] text-ink-body";

// The primary action: a raised, bordered box with a hard accent offset shadow.
// Activation "presses" it: the shadow collapses and the box drops onto it.
export const footerCtaClass =
  "mt-2 flex flex-col items-center gap-1 rounded-md border-2 border-ink bg-surface-raised px-8 py-4 text-ink shadow-[5px_5px_0_0_var(--accent)] transition-[transform,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:translate-x-[5px] active:translate-y-[5px] active:shadow-none";

export const footerCtaLabelClass = "font-display text-[18px] font-semibold text-ink";

export const footerCtaSubLabelClass = "text-[13px] text-ink-meta";

export const footerIconRowClass = "flex flex-wrap items-center justify-center gap-3";

export const footerIconLinkClass =
  "flex h-11 w-11 items-center justify-center rounded-full border border-hair text-ink-body transition-colors hover:border-ink-meta hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const footerDisclosureClass = "text-[13px] text-ink-meta";

// Finger wag: the forearm group rotates around the elbow, transform only
// (design.md Decision 4). Keyframes and times are the same length; the wag
// sits in the first ~55% of each cycle and rests for the remainder.
export const FOOTER_WAG_ROTATE_KEYFRAMES = [0, -9, 7, -6, 3, 0, 0];
export const FOOTER_WAG_TIMES = [0, 0.1, 0.22, 0.34, 0.45, 0.55, 1];
export const FOOTER_WAG_DURATION_SECONDS = 2.4;

// Elbow pivot in the SVG canvas's own pixel space (viewBox="0 0 469 564"),
// not a CSS percentage — the final art is one SVG document, so this is the
// only coordinate space it needs. From the owner's vector concept artifact
// (docs/design/jos-191-disruptive-footer/README.md has full provenance).
export const FOOTER_ELBOW_TRANSFORM_ORIGIN = "66px 420px";

export const footerIllustrationClass =
  "relative mx-auto aspect-[469/564] w-[min(100%,220px)]";

export const footerIllustrationSvgClass = "absolute inset-0 h-full w-full";

// Soft accent glow behind the figure, kept inside the illustration column so
// it never sits under the text (JOS-191 Decision 2).
export const footerGlowClass =
  "pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_24%,transparent),transparent)]";
