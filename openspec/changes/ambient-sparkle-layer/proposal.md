Linear-Issue: JOS-110

## Why

The site has no ambient motion. Everything that moves today is either one-shot
(hero text entrance) or scroll-linked (the laptop). Open the page and hold still,
and nothing is alive. The owner's stated goal is that the site "must surprise
anyone the moment they see the page… sparkly animation" — and a drifting,
additively-blended particle field is the one element of `docs/PRD2.md`'s WebGL
layer that is genuinely worth salvaging.

**This corrects a reasoning error from JOS-105.** When WebGL was rejected for the
hero laptop, the spark field was discarded along with it. That comparison was
"three.js particle system versus nothing," when the real option was Canvas 2D:

| | Three.js | **Canvas 2D** | CSS/DOM |
|---|---|---|---|
| Added bytes | ~170 KB gz | **0 — built in** | 0 |
| 200 particles | trivial | trivial | ~200 DOM nodes ✗ |
| Additive glow | native | `globalCompositeOperation = "lighter"` ✓ | ✗ |
| Degrades to nothing without JS | ✓ | ✓ | n/a |

Canvas 2D gets the additive spark look for **zero dependency bytes**, which is a
materially different trade-off from the one JOS-105 evaluated and rejected.

## What Changes

- **Add an ambient particle field** rendered on a single `<canvas>` with
  `globalCompositeOperation = "lighter"` for additive glow. Decorative,
  `aria-hidden`, non-interactive, no new dependency.

- **Place it above the hero scrim, not beneath it.** This is the decision most
  likely to be gotten wrong, and JOS-105 already paid for the lesson. Measured:

  ```
  particle painted on the stage      rgb(231,217,181)   delta +221 over background
  same particle under the 80% scrim  rgb( 53, 51, 45)   delta  +43 over background
  ```

  An 80% reduction. JOS-105's light ⑤ was removed precisely because a scrimmed
  overlay contributed only ~12 levels and was visually indistinguishable. At 43
  the particles would survive but read as muted grey dust — the opposite of
  "sparkly." The layer therefore sits in its own fixed layer between the laptop
  layer and the page content: above the scrim, below all text.

- **Pin the degradation rules that a continuously-running animation needs**,
  none of which are optional:
  - **`prefers-reduced-motion`: no drift.** The site-wide requirement is explicit
    — "no movement-based animation plays; only opacity/fade transitions remain."
    A drifting field is movement-based, so under reduced motion the field renders
    **static**, faded in, and never animates position.
  - **Pause when not visible.** The loop stops when the tab is hidden and when
    the layer is scrolled out of view — this is the first thing on the site that
    would otherwise run forever.
  - **Mobile follows the laptop's gate.** The hero laptop is `hidden sm:flex`;
    the particle layer matches, for battery and for the same readability reason.
  - **No JS: renders nothing, and that is fine.** A bare `<canvas>` is empty; the
    layer is purely decorative and carries no content.

- **Extend the 60fps requirement to cover canvas rendering.** As written it says
  animations run at 60fps "by animating only compositor-friendly properties
  (transform/opacity)". A canvas particle field animates *neither* — it repaints
  pixels. So it does not violate the requirement, but it is not covered by it
  either, which is worse: the intent plainly applies and nothing enforces it.

- **Out of scope:** the page-load arrival sequence (JOS-112) and scroll-linked
  reveals (JOS-111). This ticket is the *ambient* window only.

## Capabilities

### New Capabilities
- `site-ambient-motion`: the continuously-running decorative motion layer — what
  it is, where it sits in the stacking order, and the lifecycle and degradation
  obligations that come with anything that runs indefinitely (reduced motion,
  visibility pausing, viewport gating, no-JS, and decorative-only status).

### Modified Capabilities
- `performance-budget-compliance`: the "Animations sustain 60fps" requirement is
  broadened to cover both animation mechanisms the site now uses — DOM property
  animation (unchanged: transform/opacity only) and canvas-rendered animation
  (new: a frame-budget obligation and a requirement to stop when not visible).

  **Ordering note:** JOS-107 (`narrow-performance-budget`) also touches this
  capability and deliberately keeps this requirement *unchanged*. JOS-107 is
  spec-only and much smaller, so it is expected to land first; this delta is
  written against the post-JOS-107 state. If they land in the other order, this
  requirement's final text still wins — but confirm rather than assume.

## Impact

- **New files:** an ambient-layer client component, its styles, and a small
  particle-simulation module. Mounted in `app/(marketing)/layout.tsx` only —
  explicitly not in `app/admin/layout.tsx`, which `app/admin/layout.test.tsx`
  already asserts is free of marketing chrome.
- **No new dependency, no new asset, no network request.** Canvas 2D is built in.
  Nothing is added to the Cloudflare Worker bundle (JOS-106) — this is client
  code, which ships as a static asset.
- **This is the first thing on the site that runs indefinitely.** Every prior
  animation is one-shot or scroll-linked. That is a genuine trade even under the
  owner's "performance does not gate this site" decision (2026-08-13) — that
  decision concerned *page weight and load scoring*, not draining a laptop
  battery on a tab left open. Hence the pausing requirements, which are the
  substance of this change rather than polish on top of it.
- **Depends on JOS-108** (`site-typography-and-palette`) for the accent tint the
  particles are coloured from — a second hard-coded accent would undo that
  change's single-source-of-truth requirement.
