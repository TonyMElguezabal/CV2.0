## Context

The hero laptop is a fixed, full-page background layer (`components/HeroLaptop.tsx`,
133 lines) built from CSS 3D transforms driven by framer-motion's full-document
`useScroll`. It satisfies every behavioral requirement in `hero-signature-motion`
but has no lighting model: each face carries a fixed gradient that does not change
with orientation, the silhouette is a drawn `border-zinc-700`, and nothing grounds
the object to a surface.

This change adds illumination and reframes the composition. A prototype was built
and reviewed before this proposal, holding geometry byte-identical to production
(same `-170°→0°` lid over `[0, 0.85]`, `-35°→0°` rotateY, `-8°→0°` rotateZ, 50
keys) so that only framing and light varied — the reviewed delta is exactly the
delta proposed here.

## Goals / Non-Goals

**Goals**
- The laptop reads as a lit object separated from the near-black ground by
  illumination, not by a drawn border.
- Illumination responds to orientation, driven by the scroll progress already in
  use — no new driver, no new listener.
- The composition reads as a deliberate frame rather than a centered thumbnail.
- Every accepted behavior of `hero-signature-motion` survives unchanged.

**Non-Goals**
- WebGL or any 3D library (see Decision 1).
- Changing the laptop's geometry or scroll mapping (see Decision 5).
- The editorial frame (fixed header, grid hairlines, progress rail), the site
  typeface and type scale, per-letter title reveals, and scroll-milestone section
  activation. All separate changes.

## Decisions

### Decision 1: Fake the lighting in CSS rather than rendering the laptop in WebGL

WebGL was evaluated as the alternative and rejected. The decisive argument is not
weight in the abstract but that **WebGL would not replace the CSS laptop — it would
add a second implementation.** Four already-accepted requirements each independently
require the CSS one to keep existing:

| Accepted requirement | What it needs at render time | A `<canvas>` provides |
|---|---|---|
| Hero readable without JavaScript | markup in the SSR HTML | nothing |
| Effect simplified on small viewports | a cheap non-3D presentation | a GL context |
| Reduced motion → static, open, front-facing | one static frame, no GL | a GL context |
| Terminal text sourced from content, readable | real, selectable DOM text | a texture, or a DOM overlay |

Costs of the WebGL path: ~170KB gzipped for three.js before any model, the hero
canvas becoming the LCP element behind JS parse/execute/shader-compile (against an
accepted LCP budget of <2.5s desktop / <4s mobile and Lighthouse ≥90), the terminal
losing selectability, SEO, and accessibility, and two implementations to keep
visually in agreement.

Benefit forgone: real lighting, reflections, cast shadows, and edge chamfers.
Reflections, cast shadows, and chamfers are largely invisible once the object is
cropped and sits behind the legibility scrim. **Orientation-responsive light is the
only one of those that materially changes the read, and it can be approximated
convincingly with opacity-driven overlay layers.** Hence this change.

### Decision 2: Drive light intensities from the existing MotionValues, with hand-authored curves

`scrollYProgress`, `lidRotateX`, `bodyRotateY`, and `bodyRotateZ` already exist in
the component. Each light's intensity is a `useTransform` off one of them. No new
scroll listener, no new state, no new driver.

The curves are **art-directed, not simulated.** `useTransform` accepts multi-stop
input/output arrays; the stops are hand-tuned so each highlight peaks where it looks
best rather than where a dot product would put it. A physically-correct rim light
reads as dim; one that lingers past its true falloff reads as intentional. Computing
real surface normals would be more code, less control, and a worse result.

Reviewed starting values (openness = `clamp(p / 0.85)`):

| Light | Intensity | Rationale |
|---|---|---|
| ① Rim | `0.28 + 0.72·(1−p)` | grazing-angle (Fresnel) falloff — hottest when turned away |
| ② Screen spill | `openness^1.6` | the display "wakes up" late in the opening |
| ③ Contact shadow | `0.34 + 0.66·p` | weight arrives as the body straightens |
| ④ Specular sweep | `0.45 + 0.55·sin(p·π)` | gentle bell across the rotation |
| ⑤ Key / fill wash *(implemented, then removed — Decision 8)* | `0.18 + 0.82·openness·(0.55 + 0.45·p)` | builds as faces turn toward the key light |

### Decision 3: Restrict animated properties to `opacity` and `transform`, including for the specular sweep

The obvious implementations of several of these lights reach for properties the
capability forbids: face brightness via `filter: brightness()`, the rim via an
animated `box-shadow`, the specular sweep via a shifting `background-position`.
All are avoided.

Each light is instead a separate absolutely-positioned overlay element whose
`opacity` is animated; a "lit" and a "shadowed" overlay with complementary
opacities replace what `filter` would have done. The specular sweep is an
**oversized child (≈300% width) translated with `transform: translateX()` inside an
`overflow-hidden` face**, which is a compositor transform, rather than a shifting
background position, which is a paint. This is what makes the amendment in Decision
7 narrow: the prohibition on non-compositor-friendly properties is preserved; only
the blanket "no independently-animated property" phrasing changes.

Consequence: ~8 additional elements on a layer that already carries ~60. They are
kept as flat siblings rather than nested, and `will-change` is deliberately not
applied to them — promoting eight overlays to their own layers would cost more than
it saves.

### Decision 4: Split the lid into two explicit faces

The lid is currently one element. At the closed pose (`-170°`) it is rotated past
90°, so the viewer sees its back — which is why JOS-92 added a lid accent "on the
lid's outward-facing top". Without `backface-visibility: hidden`, the screen face's
contents also show through mirrored at those poses.

The lid becomes a container with two absolutely-positioned children: a screen face
(bezel, terminal) and an outer face (aluminium gradient, lid accent), both with
`backface-visibility: hidden` and the outer face at `rotateY(180deg)`. This is
required for the lighting — the rim and specular sweep must apply to whichever face
is actually visible — and it fixes the pre-existing bleed-through as a side effect.

### Decision 5: Crop and reframe, but do not change the geometry

The laptop is rendered substantially larger and positioned to bleed off the
bottom-right; hero copy anchors to a left column. This breaks the shared centre axis
between object and copy, which is the single largest contributor to the current
"centered thumbnail" read.

Cropping also **hides CSS 3D's worst artifacts** — the far edges, and the lid
degenerating to a hairline at grazing angles — which is why lid-edge thickness is
not being added. The framing must keep the screen fully in frame wherever the
terminal is required to be readable; that is a spec constraint, not a preference.

Explicitly **not** changed: at full open the base and lid remain coplanar, so the
deck does not foreshorten and the keyboard reads as a flat diagram. Fixing that
requires a base `rotateX` — a geometry change with its own closed-pose and
reduced-motion consequences. Deferred so that this change's reviewed delta stays
exactly the lighting and framing.

### Decision 6: One screen accent, shared by the screen and the light it casts

The terminal is `text-emerald-400` today — Tailwind's default terminal green. It
becomes sapphire, chosen by the owner from a three-way bronze/emerald/sapphire
comparison in the prototype.

The accent is defined once and reused for the terminal text, the deck spill, and
the bezel bloom, because a display cannot emit light of a different color than it
shows. Contrast is verified rather than assumed: `#4d82bd` on `#000` computes to
≈5.2:1, above the 4.5:1 AA floor for normal-size text, but the terminal renders at
`text-[0.6rem]`/`text-xs` and the final value is confirmed under test.

### Decision 7: Amend the "no independently-animated property" clause rather than work around it

`hero-signature-motion` currently requires the laptop's detail elements to add "no
independently-animated property". Every light here animates its own opacity, so this
change contradicts an accepted requirement.

The clause was authored to scope JOS-92's static keyboard/trackpad/bezel work; its
intent was to guarantee the capability's 60fps, no-asset, no-dependency properties,
not to forbid future scroll-driven treatment. Per CLAUDE.md §7 the contradiction is
resolved in the spec first, and the owner has explicitly approved the amendment.

The replacement wording keeps every part of the original intent that still applies —
no image/SVG asset, no new dependency, no layout-triggering property — and adds an
explicit prohibition on non-compositor-friendly properties (`filter`, `box-shadow`,
`background-position`) that the original only implied. The amended clause is
therefore **narrower and more testable** than the one it replaces, not looser.

### Decision 8: Light ⑤ was removed after real-browser verification

Risk 2 (below) flagged before implementation that light ⑤ — the key/shadow wash —
might not survive compositing under the scrim, since it was the weakest of the five
in the prototype (itself reviewed without a scrim). That risk materialized.

During Step 11 real-browser verification, ⑤ was implemented exactly as specified (a
lit and a shadowed overlay per lid face, opacities moving in opposite directions) and
tested with a before/after DOM toggle: its four elements' `opacity` were forced to `0`
via injected CSS at two scroll positions — 0.6 (a representative mid-open pose) and
1.0 (its own peak intensity, `washLitIntensity → 1`). Both comparisons produced
pixel-identical screenshots. A worked compositing calculation (`node -e`, using the
gradient's own stop-alpha and the base material's color) predicted this in advance:
wash-lit's peak contribution came to only ≈12 sRGB levels above the unlit baseline
after the 80%-opacity scrim, competing against four other, higher-contrast lights
active in the same region — genuinely too small a delta to read as a distinct light.

Per design.md's own stated mitigation and the delta spec's `hero-signature-motion`
requirement ("if it is not [distinguishable], stop and amend the spec rather than
shipping a dead layer"), ⑤ was removed rather than shipped: all four of its DOM
elements, its two `useTransform` intensities, its two gradient constants, its two
marker classes, and its two `<noscript>` CSS rules were deleted from
`HeroLaptop.tsx` and `HeroShellStyles.ts`. The delta spec's lighting requirement,
its "Illumination responds to orientation" scenario, `proposal.md`'s light table, and
this file's Decision 2 table were all updated to match — the rig ships with four
lights (rim, screen spill, contact shadow, specular sweep), not five.

## Risks / Trade-offs

- **The scrim may now be wrong.** The laptop sits behind `bg-zinc-950/80`. That
  value was tuned for an unlit object; a lit one may need a stronger or weaker
  scrim. Retuning it risks the text-contrast requirement, so contrast over the
  laptop is re-verified in either direction. *Mitigation: explicit verification
  task; the contrast requirement wins over the visual if they conflict.*
- **Light ⑤ (key/fill wash) may be invisible behind the scrim.** It was the weakest
  of the five in the prototype, which was reviewed without a scrim. **Materialized —
  resolved.** A before/after DOM toggle at two scroll positions (0.6 and 1.0,
  its own peak) produced pixel-identical screenshots. Removed per Decision 8; the
  delta spec, proposal, and this file's Decision 2 table were amended to match.
- **Eight more compositor layers on a fixed full-page element.** Below the measured
  threshold on desktop, and mobile never renders them (`hidden sm:flex`).
  *Mitigation: the existing 60fps profiling task covers it.*
- **The off-axis crop is viewport-sensitive.** "Bleeds off the bottom-right" behaves
  differently at 1280px and 2560px, and the screen must stay in frame at both.
  *Mitigation: verified across viewport widths as an explicit task.*
