## Why

The hero laptop shipped by `hero-laptop-scroll-motion` (JOS-90) and detailed by
`hero-laptop-visual-fidelity` (JOS-92) is technically complete — scroll-driven,
reduced-motion-safe, no-JS readable, 60fps — but visually inert. Two concrete
problems:

1. **It has no light.** The base and lid carry fixed gradients that look
   identical whether a face is turned toward the viewer or nearly edge-on. Its
   silhouette is defined by a drawn `border-zinc-700` line, not by illumination,
   so on the near-black `#0a0a0a` ground the object does not separate from the
   void. It also floats — nothing grounds it to a surface.
2. **It is framed as a thumbnail.** At `h-56 w-96` (384×224px) dead-centered
   behind dead-centered hero text, the laptop and the copy share one axis and
   nothing is in tension with anything. It reads as a small object placed on a
   page rather than as a composed frame.

A comparative prototype (built and reviewed before this proposal, geometry held
byte-identical to production so only framing and light varied) confirmed that
five hand-authored light layers plus an off-axis crop change the character of
the hero substantially, at zero additional bytes and with no new dependency.

**This change contradicts an accepted requirement and therefore requires an
explicit spec amendment.** `hero-signature-motion`'s "The laptop is visually
recognizable as a laptop" requirement currently states that the laptop's detail
elements add "no independently-animated property". Every light introduced here
animates its own opacity from scroll progress. That clause was authored to scope
the JOS-92 keyboard/trackpad/bezel work and was never intended to forbid future
scroll-driven treatment; the owner has reviewed the contradiction and approved
amending it. The clause's real intent — no new dependency, no image/SVG asset,
and no layout-triggering or non-compositor-friendly property — is preserved and
tightened below.

## What Changes

- **Add a faked three-point lighting rig** to the laptop, derived from the same
  `scrollYProgress`, `lidRotateX`, and `bodyRotateY` MotionValues that already
  drive the geometry. No new scroll listener, no new driver. Five lights:

  | # | Light | Driver | Animated property |
  |---|-------|--------|-------------------|
  | ① | Rim (`#e3f2ff`, grazing from behind-left) | `bodyRotateY` | `opacity` |
  | ② | Screen spill onto the deck + bezel bloom | lid openness | `opacity` |
  | ③ | Contact shadow beneath the base + hinge ambient occlusion | `bodyRotateZ` / openness | `opacity` |
  | ④ | Specular sweep across the lid | `bodyRotateY` | `opacity` + `translateX` |
  | ⑤ | Key (`#fff3e6`, upper-right) and shadow wash per face | openness, `bodyRotateY` | `opacity` |

  **Outcome:** ① through ④ shipped as proposed. ⑤ was implemented, then
  removed after Step 11 real-browser verification found it visually
  indistinguishable from the other four once composited under the scrim (a
  before/after DOM toggle at its peak intensity produced identical
  screenshots) — see design.md Decision 8. The rig ships with four lights.

  Every light animates **only `opacity` and `transform`**. No `filter:`, no
  `background-position`, no `box-shadow` animation — so the capability's
  transform/opacity-only and 60fps guarantees hold unchanged. The specular sweep
  is an oversized child translated inside an `overflow-hidden` face rather than a
  shifting background position, specifically to keep it on the compositor.

- **Give the lid a true two-faced structure.** The lid is currently one element;
  at the closed pose (`-170°`) its back is what faces the viewer. Split it into an
  explicit screen face and an aluminium outer face with `backface-visibility:
  hidden`, so the rim and specular lights can be applied to whichever face is
  actually visible. This also removes the existing mirrored-content bleed-through
  at closed poses.

- **Reframe the laptop off-axis.** Render it substantially larger and cropped so
  it bleeds off the bottom-right rather than sitting centered. The screen must
  stay fully in frame at open poses (the terminal-legibility requirement is
  unchanged). Hero copy anchors to a left column instead of centering, breaking
  the shared centre axis.

- **Move the screen accent from emerald to sapphire.** The terminal is currently
  `text-emerald-400` (Tailwind's default terminal green). It becomes a sapphire
  accent, which also colors the screen spill and bloom — the light the display
  throws must match what the display emits. Owner-selected from a three-way
  comparison (bronze / emerald / sapphire).

- **Unchanged (explicitly):** the scroll mapping and all transform constants
  (`-170°→0°` lid over `[0, 0.85]`, `-35°→0°` rotateY, `-8°→0°` rotateZ), the
  terminal's content-sourced text pipeline, the `prefers-reduced-motion` static
  open state, the `<noscript>` static state, the legibility scrim, the
  `hidden sm:flex` mobile gating, and the laptop's `aria-hidden` decorative role.

- **Out of scope:** WebGL or any 3D library (evaluated and rejected — it would
  add a second implementation while no-JS, mobile, and reduced-motion all still
  require the CSS one); the editorial frame (fixed header, grid hairlines, scroll
  progress rail); the site typeface and type-scale change; per-letter title
  reveals; scroll-milestone section activation; adding a base `rotateX` so the
  deck foreshortens. Each is a separate change.

## Capabilities

### New Capabilities
_None._ This is a visual treatment of the existing signature laptop.

### Modified Capabilities
- `hero-signature-motion`: amend the "no independently-animated property" clause
  in the visual-recognizability requirement so scroll-driven lighting is
  permitted, while still forbidding new dependencies, image/SVG assets, and any
  layout-triggering or non-compositor-friendly animated property. Add a
  requirement for the scroll-driven lighting rig (including its reduced-motion
  and no-JS static states) and a requirement for the off-axis framing that keeps
  the screen in frame and the hero copy legible.

## Impact

- **Modified files:** `components/HeroLaptop.tsx` (two-faced lid, light layers,
  intensity `useTransform`s, reduced-motion static values), `components/
  HeroShellStyles.ts` (light classes, reframing, larger geometry),
  `components/HeroLaptop.test.tsx` (add light-presence and reduced-motion/no-JS
  static-value assertions), `components/HeroShellStyles.ts` terminal accent,
  and `components/HeroFramer.tsx` / hero copy classes for the left-column anchor.
- **Accessibility:** the sapphire accent must clear the site's contrast bar for
  terminal text on `#000` (computed ≈5.2:1 for `#4d82bd`, above the 4.5:1 AA
  floor for normal text) — verified as a task, not assumed. The scrim may need
  retuning now that the laptop is lit rather than drawn; text contrast over the
  laptop is re-verified either way.
- **Performance:** ~8 additional static overlay elements on an existing fixed
  background layer, animating opacity/transform only. No new dependency, no new
  asset, no image, no network request. First Load JS, the CSP, and the
  transform/opacity-only budget are untouched. Mobile is unaffected — the layer
  is `hidden sm:flex`, so none of this renders below `sm`.
- **No backend, endpoint, schema, or content-model change.**
