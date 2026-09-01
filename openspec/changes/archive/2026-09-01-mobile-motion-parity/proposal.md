Linear-Issue: JOS-122

## Why

The site's two signature motion surfaces — the scroll-driven 3D laptop and the ambient constellation field — do not exist on mobile. Not simplified, not reduced: absent. Confirmed live on production at a ~500px viewport, where the header, hero copy, and chat trigger all render correctly against an empty background.

That was a deliberate 2026-08 decision, justified partly on a mobile LCP budget that the project has since explicitly stopped budgeting (`performance-budget-compliance`: client-delivery metrics "do not measure this site's actual audience", owner decision 2026-08-13). The owner's call is that current mobile hardware can carry both effects, and that a profile site whose entire premise is a signature first impression should not drop that impression for the visitors most likely to open it from a phone link.

## What Changes

- The hero laptop layer renders at **all** viewport widths — **BREAKING** against `hero-signature-motion`'s "The laptop effect is simplified on small viewports" requirement, which is removed outright rather than weakened.
- The ambient constellation layer renders at all viewport widths — **BREAKING** against `site-ambient-motion`'s small-viewport omission. The unrelated no-JS half of that same requirement is deliberately kept.
- The laptop's off-axis cropped framing gains a base (mobile) bleed offset. Today `heroLaptopSceneClass`'s negative margins are `sm:`-only, so simply un-hiding the layer would render a fully-contained, uncropped laptop — precisely the "small centered thumbnail" composition the off-axis framing requirement exists to prevent.
- The hero copy anchors off-center at all widths, so the existing "copy and laptop do not share one axis" guarantee holds uniformly instead of being exempted below `sm`.
- Three tests that pin the current gating are inverted; a fourth that only *looks* like a gate test is kept and reworded.

## Capabilities

### New Capabilities

_None._ This removes viewport-conditional exemptions from two existing capabilities; it introduces no new behaviour of its own.

### Modified Capabilities

- `hero-signature-motion`: the "simplified on small viewports" requirement is **removed**; the off-axis-and-cropped requirement's scenarios are **modified** to drop their `sm`-breakpoint scoping and their small-viewport exemption.
- `site-ambient-motion`: the "omitted on small viewports and without JavaScript" requirement is **renamed and modified** to cover only the no-JS case, which is unrelated to viewport width and remains correct.

### Considered and deliberately not modified

- `performance-budget-compliance`. Its 60fps requirement already applies to every animated surface with no device-tier carve-out, and its canvas clause already mandates stopping the loop when not visible. Both are exactly the guarantees this change needs to keep proving — on hardware where they are, for the first time, genuinely at risk. Nothing in the requirement text needs to change for that to be true; only the verification does. Adding a mobile-specific scenario would restate an obligation that already binds.

## Impact

**Components** — `components/HeroShellStyles.ts` (drop the layer gate, add base bleed offset, move copy alignment to base), `components/AmbientSparkleLayerStyles.ts` (drop the layer gate), `components/AmbientSparkleLayer.tsx` (one comment, now factually wrong, must be rewritten; the code it describes stays).

**Tests** — `components/HeroLaptop.test.tsx` (two gate assertions inverted; one carries a stale reference to the very AC this change removes), `components/AmbientSparkleLayer.test.tsx` (one gate assertion inverted; one zero-size robustness test kept and reworded).

**Not affected** — particle density (already area-derived and clamped), touch pointer handling (mouse-only filter is correct behaviour on touch, not a gap), the CareerTimeline rail (normal-flow below `md`, no collision), reduced-motion paths (already viewport-independent). No new dependency, no new asset, no network request, no content-model change.

**Risk** — the one genuinely new failure mode is mobile-only and untestable from a desktop browser: `min-h-screen` (`100vh`) plus two `fixed inset-0` layers means the layers' box can resize mid-scroll as a mobile address bar collapses — during the exact scroll interaction the laptop animation exists to showcase. The repo has no prior `dvh`/`svh` usage and no recorded viewport-unit decision, so this is new ground rather than a settled question being reopened.
