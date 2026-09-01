import { focusRingClass } from "./a11yStyles.ts";

// The hero copy anchors off-center at every viewport width, so it never
// shares the laptop's centered axis — see design.md Decision 5 in
// openspec/changes/hero-laptop-cinematic-lighting, and mobile-motion-
// parity design.md Decision 1 for why the alignment itself (`items-start`,
// `text-left`) is unconditional while the side padding stays `sm:`-scoped:
// alignment and padding are separable, and it is the generous padding —
// not the alignment — that would cramp a narrow column. Un-prefixed
// alignment previously depended on the laptop layer being hidden below
// `sm` (it no longer is); the coupling this comment used to describe was
// removed along with that gate, not preserved by accident.
//
// The extra `md:pl-56` clears CareerTimeline's fixed left rail
// (`md:fixed md:left-4`, ~176px right edge measured in the browser —
// real-browser verification during Step 11 caught this collision, which
// jsdom's layout-free tests could not) — that rail only goes fixed at
// `md:`, so `sm:pl-16` alone is enough between sm and md where the rail is
// still in normal document flow.
export const heroWrapperClass =
  "relative flex min-h-screen flex-col items-start justify-center overflow-hidden px-6 text-left sm:pl-16 sm:pr-16 md:pl-56";

// Display role: clamp(34px, 6.2vw, 88px), Expanded 700, -0.035em tracking —
// site-typography-and-palette design.md Decision 3's type scale table.
// text-ink here also serves as the gradient fallback color for browsers
// without background-clip:text support — see Task Group 5.
export const heroNameClass =
  "font-display font-bold text-[clamp(34px,6.2vw,88px)] tracking-[-0.035em] text-balance text-ink";

// Display gradient — site-typography-and-palette design.md Decision 6.
// Applied only to the hero display's lead-text span (HeroFramer.tsx splits
// the name into a lead span + an accent-word span), never merged into
// heroNameClass itself: -webkit-text-fill-color inherits to children in
// WebKit/Blink, so if this lived on a shared ancestor of both spans, the
// accent word's own `color` would be silently overridden by the inherited
// transparent fill. Deliberately not Tailwind's `text-transparent`
// (unconditional `color:transparent`, no fallback) — `color` is left to
// inherit from the outer heading's `text-ink`, which is what non-WebKit
// browsers without bg-clip-text support actually render. The darkest
// gradient stop (#6f6558, matching --hair) clears the 3:1 large-text
// threshold but not 4.5:1 normal-text — this class must only ever be
// applied to text at or above the WCAG large-text size.
export const heroDisplayGradientClass =
  "bg-clip-text [-webkit-text-fill-color:transparent] bg-[linear-gradient(180deg,#ffffff_0%,#ece7dd_38%,#9a8f7e_82%,#6f6558_100%)]";

// The hero's accent word (the specimen the owner reviewed applied the
// sapphire accent to one word, not the whole name) — a sibling of the
// gradient span, never a descendant of it.
export const heroAccentWordClass = "text-accent";

// Body role: 17px/1.68, Regular 400 — one flat size, no responsive variant
// (unlike display's fluid clamp()), per the same scale table.
export const heroPositioningClass =
  "mt-6 max-w-2xl text-[17px] leading-[1.68] text-ink-body";

export const ctaRowClass =
  "mt-10 flex flex-wrap items-center justify-center gap-4";

export const ctaPrimaryClass = `text-sm font-medium text-ink-body underline underline-offset-4 hover:text-ink ${focusRingClass}`;

export const ctaSecondaryClass = `rounded-full border border-hair px-4 py-2 text-sm font-medium text-ink-body hover:border-ink-meta hover:text-ink ${focusRingClass}`;

// The laptop is a fixed, whole-page background layer, kept behind page
// content (negative z-index) and non-interactive (pointer-events none) —
// see design.md Decision 2/3 in openspec/changes/hero-laptop-scroll-motion.
// Docked to the bottom-right corner (rather than centered) so the enlarged
// scene bleeds past the viewport edge — design.md Decision 5 in
// openspec/changes/hero-laptop-cinematic-lighting. `overflow-hidden` on
// this full-viewport layer is what clips the part that bleeds past.
//
// Renders at every viewport width, not gated below `sm` — mobile-motion-
// parity removed that gate deliberately (it was justified partly against a
// mobile LCP budget the project has since stopped tracking) and it must
// not be reinstated as a reflexive performance measure. The composition
// that makes this work at small sizes lives in `heroLaptopSceneClass`'s
// base bleed offset, not here.
export const heroLaptopLayerClass =
  "fixed inset-0 -z-10 flex items-end justify-end overflow-hidden pointer-events-none";

// Scrim keeps the laptop subdued behind text for contrast — Decision 3.
export const heroLaptopScrimClass =
  "absolute inset-0 bg-zinc-950/80";

// `hero-laptop-scene`/`-lid`/`-screen` are dedicated marker classes (not
// Tailwind utilities) so the `<noscript>` override in HeroLaptop.tsx can
// force the no-JS static state without depending on test-only attributes.
// The negative margin is a static layout offset (not animated, not
// transform — so it doesn't collide with framer-motion's inline `transform`
// on this same element, which manages rotateY/rotateZ via sceneStyle) that
// pushes the corner-docked scene further past the viewport edge than flex
// alignment alone would; `heroLaptopLayerClass`'s overflow-hidden clips the
// excess. See design.md Decision 5 in openspec/changes/
// hero-laptop-cinematic-lighting.
//
// The base (mobile) offset is a load-bearing composition choice, not
// decoration — see mobile-motion-parity design.md Decision 2. Without it,
// the smaller base-scale laptop (160x256px, from `heroLaptopBaseClass`)
// renders fully contained rather than cropped, which is exactly the "small
// centered thumbnail" read the off-axis framing exists to eliminate.
// Cropping isn't a desktop-only concern either: it's what hides CSS 3D's
// worst artifacts (far edges, the lid degenerating to a hairline at
// grazing angles), which are at least as visible at mobile scale.
// `-mr-2 -mb-3` is a starting value scaled roughly in proportion to the
// laptop's smaller base size relative to its `sm:` upsize — tuned against
// a real narrow-viewport render in Task Group 7, not a final number.
export const heroLaptopSceneClass =
  "hero-laptop-scene relative [perspective:1200px] [transform-style:preserve-3d] -mr-2 -mb-3 sm:-mr-4 sm:-mb-6";

// Enlarged from the original sm:h-56 sm:w-96 (224x384px centered thumbnail)
// so the laptop reads as a cropped, off-axis composition rather than a
// small centered object — design.md Decision 5.
export const heroLaptopBaseClass =
  "relative h-40 w-64 rounded-b-lg border border-zinc-700 bg-gradient-to-b from-zinc-700 to-zinc-900 sm:h-[300px] sm:w-[520px]";

// The lid's own transform (rotateX, driven by scroll) lives on this
// container; position/size/frame only — the two faces below carry the
// per-side material and content, see design.md Decision 4 in
// openspec/changes/hero-laptop-cinematic-lighting.
export const heroLaptopLidClass =
  "hero-laptop-lid absolute inset-x-0 bottom-full h-40 origin-bottom rounded-t-lg border border-zinc-700 [transform-style:preserve-3d] sm:h-[300px]";

// Shared face geometry: each face fills the lid and hides itself once
// rotated past 90° from the viewer, so only the viewer-facing face ever
// renders its content (screen bleeding through the closed pose, fixed).
export const heroLaptopLidFaceClass =
  "absolute inset-0 overflow-hidden rounded-t-lg [backface-visibility:hidden]";

export const heroLaptopLidFaceScreenClass =
  "hero-laptop-lid-face-screen bg-gradient-to-t from-zinc-900 to-zinc-700";

// Outer (aluminium) face sits back-to-back with the screen face via
// rotateY(180deg), so it is the one visible whenever the lid is rotated
// past horizontal (i.e. at/near the closed pose).
export const heroLaptopLidFaceOuterClass =
  "hero-laptop-lid-face-outer bg-gradient-to-b from-zinc-800 to-zinc-950 [transform:rotateY(180deg)]";

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

// ── Lighting rig (openspec/changes/hero-laptop-cinematic-lighting) ────────
// Every layer below is a static overlay; HeroLaptop.tsx binds each one's
// opacity (and, for the specular sweep, translateX) to the laptop's
// existing scroll-derived MotionValues — no new scroll listener, no new
// driver, and no animated `filter`/`box-shadow`/`background-position`
// anywhere in the rig (design.md Decision 3). Most layers share one
// position class; the specular sweep and contact shadow need their own
// geometry (oversized/overflowing respectively).
export const heroLaptopLightOverlayClass = "absolute inset-0";

export const heroLaptopContactShadowPositionClass =
  "absolute inset-x-[-8%] top-full h-24";

export const heroLaptopSpecularPositionClass =
  "absolute -inset-y-3 left-0 w-[300%]";

// Shared screen accent (sapphire, owner-selected from a bronze/emerald/
// sapphire comparison) — the terminal's text color and the light the
// screen casts (deck spill, bezel bloom) derive from the same value, since
// a display can't emit light of a different color than it shows (design.md
// Decision 6). Contrast against the terminal's black screen background is
// verified in HeroLaptop.test.tsx.
export const heroLaptopAccentHex = "#4d82bd";
const heroLaptopAccentSoft = `${heroLaptopAccentHex}4d`;

// Marker classes (mirroring `hero-laptop-scene`/`-lid`/`-screen`'s role) so
// the no-JS `<noscript>` override in HeroLaptop.tsx can force each light
// type to its open-pose opacity without depending on test-only attributes.
export const heroLaptopRimMarkerClass = "hero-laptop-rim";
export const heroLaptopSpillMarkerClass = "hero-laptop-spill";
export const heroLaptopContactShadowMarkerClass = "hero-laptop-contact-shadow-layer";
export const heroLaptopHingeAoMarkerClass = "hero-laptop-hinge";
export const heroLaptopSpecularMarkerClass = "hero-laptop-specular";

// ① Rim — a diagonal top-left highlight standing in for a grazing-angle
// (Fresnel) edge light; strongest when the surface is most turned away.
export const heroLaptopRimGradient =
  "linear-gradient(135deg, rgba(227,242,255,0.85) 0%, rgba(227,242,255,0.25) 18%, transparent 42%)";

// ② Screen spill — light the display throws onto the deck, and a soft
// bloom around the bezel; both colored from the shared screen accent.
export const heroLaptopDeckSpillGradient = `radial-gradient(ellipse 62% 100% at 50% 0%, ${heroLaptopAccentSoft}, transparent 68%)`;
export const heroLaptopBezelBloomGradient = `radial-gradient(ellipse at center, ${heroLaptopAccentSoft}, transparent 62%)`;

// ③ Contact shadow — grounds the laptop instead of letting it float.
export const heroLaptopContactShadowGradient =
  "radial-gradient(ellipse 55% 100% at 50% 0%, rgba(0,0,0,0.85), transparent 72%)";

// ④ Specular sweep — an oversized band translated across an
// overflow-hidden face (a compositor transform), never a shifting
// background-position.
export const heroLaptopSpecularGradient =
  "linear-gradient(105deg, transparent 34%, rgba(255,244,230,0.18) 46%, rgba(255,255,255,0.3) 50%, rgba(255,244,230,0.18) 54%, transparent 66%)";

// ⑤ Key/shadow wash was evaluated (complementary lit/shadowed overlays with
// opposing opacities) and removed — real-browser verification during Step
// 11 of openspec/changes/hero-laptop-cinematic-lighting found it visually
// indistinguishable from the other four lights once composited under the
// scrim, at both mid-scroll and peak intensity. See design.md Decision 8.

// Layout/typography only — color is deliberately NOT a Tailwind utility
// here. Tailwind's JIT scanner only sees literal text in source files, so
// a class name built via JS template-literal interpolation (an earlier
// version of this file had `text-[${heroLaptopAccentHex}]`) never gets a
// CSS rule generated: the className string looks correct but has zero
// visual effect on the actual page. Found via Step 11's real-browser
// verification in openspec/changes/hero-laptop-cinematic-lighting — jsdom
// has no CSS engine, so no unit test could have caught it. Terminal.tsx
// applies `heroLaptopAccentHex` as an inline `style.color` instead, the
// same technique the lighting rig already uses for its gradients.
export const terminalClass =
  "h-full w-full space-y-1 p-3 font-mono text-[0.6rem] sm:text-xs";
