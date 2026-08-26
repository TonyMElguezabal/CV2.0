## Context

`components/AmbientSparkleLayer.tsx` (JOS-110) renders a full-viewport canvas
of 140 additively-blended particles drifting behind the page, with pure
simulation logic separated into `lib/particles/simulation.ts`. It already
carries six compliance behaviours that were expensive to get right: it stops on
tab-hidden, stops out-of-view, cancels its loop and every listener on unmount,
gates to `sm` and up, renders nothing without JavaScript, and enters as a step
of the shared arrival sequence. Its colour derives from the one shared accent
token.

This change adds constellation links and pointer response to that layer. The
originating ticket (JOS-119) proposed a vendored third-party component instead;
Decision 1 records why that was rejected. Everything else here is a consequence
of adding lines to a field that was designed for points.

Three constraints shape every decision below:

- **`simulation.ts` is deliberately pixel-free.** Positions are normalised to
  `[0, 1)` so the simulation has no dependency on dimensions or
  `devicePixelRatio`. Links are inherently a *distance* concept, and distance
  in normalised coordinates on a non-square container is not distance.
- **The palette is bounded and measured.** `app/globals.css` documents each
  tint's WCAG 2.1 contrast against the real `#0a0a0a` background, with `--hair`
  (3.47:1) explicitly designated for borders and rules and forbidden for text.
- **`performance-budget-compliance` treats the Worker size limit as a release
  blocker**, and requires canvas animation to hold a 60fps frame budget and to
  stop when not visible.

## Goals / Non-Goals

**Goals:**

- Particles read as a connected constellation rather than unrelated dots.
- The link layer is provably incapable of competing with page text, not merely
  tuned to look subtle.
- Field density is consistent across viewports, which it currently is not.
- Pointer response that reads as attention, without the layer capturing a
  single event.
- All six existing compliance behaviours survive untouched.

**Non-Goals:**

- The vendored `<iframe srcDoc>` component and its knob API
  (`mode`/`hue`/`saturation`/`brightness`/`gap`/`speed`). This site has one
  palette and one motion pace (`components/motionPace.ts`).
- A twinkle/pulse per node. Deferred; it interacts awkwardly with the
  reduced-motion still frame and is not needed for the "connected" reading.
- Any change to `HeroLaptop`, the arrival sequence, `CareerTimeline`, the CSP,
  or the dependency set.
- Making the constellation meaningful — the links are decorative proximity, not
  a data visualisation of anything.

## Decisions

### Decision 1: Implement natively; do not vendor the iframe component

The ticket's component wraps an entire unrelated marketing page in
`<iframe srcDoc>` and string-patches it at runtime. Seven independent blockers,
each verified against this repo rather than assumed:

1. **CSP.** A `srcdoc` frame inherits the parent CSP. Its three CDN
   `<script src>` tags (`cdn.tailwindcss.com`, `code.iconify.design`,
   `cdnjs.cloudflare.com/gsap`) violate `script-src 'self' 'unsafe-inline'`;
   its `cdn.21st.dev` images violate `img-src 'self' data:`
   (`lib/security/config.ts:6-18`). The component simply does not run here.
2. **Event capture.** The `<iframe>` element carries no `pointer-events: none`,
   so a full-viewport background frame swallows every click and scroll over it.
3. **No stop conditions.** Its internal `requestAnimationFrame` loop runs
   forever — no tab-hidden stop, no out-of-view stop — and an iframe cannot
   participate in the parent's `IntersectionObserver` anyway.
4. **Palette.** Hardcoded `#E6C879` gold and `#070914` navy, against a spec
   requirement that colour derive from the shared accent.
5. **Bundle.** ~19 KB of dead marketing HTML compiled into the Worker as a
   string constant, against a release-blocking size limit.
6. **Accessibility.** An `<iframe title="...">` is exposed in the
   accessibility tree and focusable, against a decorative-only requirement.
7. **Duplication.** A second full-viewport canvas particle field in the same
   stacking position as the one that already exists.

Alternative considered — *vendor it and fix the seven issues*. Rejected: after
removing the iframe, the marketing HTML, the CDN scripts, the knob API, the
`postMessage` channel and the `performance.now` monkey-patching, what remains
is ~40 lines of link-drawing logic. Porting those 40 lines into the existing
layer is strictly less work than reforming the wrapper, and inherits the six
compliance behaviours for free instead of re-implementing them inside a frame
that structurally cannot have them.

### Decision 2: Link geometry lives in pixel space, in a pure function

`simulation.ts` stores positions normalised to `[0, 1)`. A single normalised
link radius describes an **ellipse in pixels** on any non-square container —
links would reach visibly further horizontally than vertically on a wide
viewport.

Resolved with a pure `linkedPairs(particles, { width, height, radiusPx })` that
projects to pixel space internally and returns `{ a, b, strength }`. The
renderer stays dumb; the geometry stays unit-testable without a canvas — the
same separation the file's own header comment argues for, and the same
precedent `CareerTimeline` set by separating scroll logic from rendering.
`stepParticles(particles, deltaSeconds, pointer?)` takes the same treatment:
the pointer arrives in normalised coordinates *plus* the aspect ratio, so its
influence radius is a circle in pixels too.

Alternative considered — *store positions in pixels*. Rejected: it would make
every particle position invalid on resize and reintroduce the `devicePixelRatio`
coupling the module was written to avoid.

### Decision 3: Links composite `source-over`; nodes keep `lighter`

This is the load-bearing decision of the change, and it is a correctness
constraint rather than a style preference.

The existing node pass uses `globalCompositeOperation = "lighter"` (additive)
so overlapping particles sum toward white instead of stacking as opaque dots.
Applied to links, that same additivity means **crossings accumulate**. Measured
against the real `#0a0a0a` background using WCAG 2.1 relative luminance:

| composite mode | contrast at alpha 1.0 | vs `--ink-meta` (5.23:1, the site's text floor) |
| --- | --- | --- |
| `lighter` (additive) | **5.64:1** | **exceeds it — reaches text weight** |
| `source-over` (normal alpha) | **4.94:1** | below it, always |

With `lighter`, a dense crossing is not merely bright — it lands above the
faintest tint the site permits for text, in a decorative layer sitting behind
real text. With `source-over`, no accumulation of overlapping links can exceed
the accent's own 4.94:1, because normal alpha compositing converges to the
source colour rather than past it. That converts "the links should not compete
with the content" from a value someone tuned into a property of the render
mode.

So: **two passes, two composite modes.** Links first with `source-over`, then
nodes with `lighter`. The stars still glow; the web cannot.

Alternative considered — *keep `lighter` and lower the per-link alpha until a
typical crossing looks acceptable*. Rejected: the bound would then depend on
link density, which Decision 5 makes viewport-dependent, so a value tuned on
one display would be wrong on another. A structural bound beats a tuned one.

Alternative considered — *render links to an offscreen canvas with
`source-over`, then composite that layer once with `lighter` at a bounded
global alpha*. This preserves crossing glow with a hard ceiling, but costs a
full-viewport offscreen buffer and an extra composite per frame. Rejected as
not worth it for a decorative layer; revisit only if the flat look disappoints
in browser verification.

### Decision 4: Peak link alpha is derived from `--hair`, and the falloff needs no `sqrt`

`--hair` (3.47:1) is the site's existing designation for *structure that is not
content* — borders and rules, explicitly forbidden for text. That is exactly
the register a constellation should occupy, so it becomes the ceiling rather
than a number chosen by eye.

Under `source-over`, alpha `0.79` puts a link exactly at `--hair` parity. The
implementation targets **peak alpha 0.75** (3.23:1), just below, leaving margin
for anti-aliasing and DPR scaling. `0.79` is the hard ceiling a unit test
asserts against.

Falloff is `alpha(d) = PEAK * (1 - d²/R²)`:

| distance | alpha | contrast |
| --- | --- | --- |
| 0 | 0.750 | 3.23:1 |
| 25% of R | 0.703 | 2.96:1 |
| 50% of R | 0.563 | 2.29:1 |
| 75% of R | 0.328 | 1.50:1 |
| R | 0.000 | 1.00:1 |

It reaches exactly zero at the radius, so links dissolve instead of popping out
of existence at the boundary — and because it is expressed in **squared**
distance it needs no `Math.hypot` and no `sqrt` at all. The aesthetic choice
and the hot-loop optimisation happen to be the same expression.

The reference component's ramp (`0.22 + (1 - d/R) * 0.55`) is rejected on both
counts: it peaks far above the text floor, and its `0.22` floor means links
appear at the radius boundary at 22% opacity rather than fading in.

### Decision 5: Particle count is derived from viewport area, not fixed

The binding cost constraint is **not** the distance tests — it is link count,
which scales as `n²R²/A`. A fixed `PARTICLE_COUNT` therefore produces wildly
different link densities per viewport.

Mean neighbours per node is `ρ · πR²` where `ρ = n/A`. Fixing the single
aesthetic dial — **target mean neighbours = 5**, a readable web rather than a
mesh — at `R = 160px` gives `ρ = 5 / (π · 160²) = 6.217e-5` particles/px², or
one particle per ~16,085 px². Then `n = ρ · A`, clamped to `[40, 260]`.

| viewport | `n = ρ·A` | links | naive pairs | grid pairs | today's fixed `n=140` yields |
| --- | --- | --- | --- | --- | --- |
| 640×800 (`sm` gate) | 32 | 80 | 496 | 229 | **22.0 neighbours** |
| 1280×800 | 64 | 160 | 2,016 | 458 | 11.0 |
| 1440×900 | 81 | 203 | 3,240 | 580 | 8.7 |
| 1920×1080 | 129 | 323 | 8,256 | 924 | 5.4 |
| 2560×1440 | 229 | 573 | 26,106 | 1,640 | 3.1 |
| 3440×1440 | 260 (clamped) | 650 | 47,278 | 2,206 | **2.3 neighbours** |

The last column is the **pre-existing bug**: the current constant is ~10×
denser at the `sm` gate than on an ultrawide. Invisible in a field of
unconnected dots; unmissable once they are joined.

Two supporting choices fall out:

- **A uniform spatial grid** at cell size `R`, so each node tests only its nine
  neighbouring cells. Cuts pair tests 16–21× at large viewports
  (26,106 → 1,640 at QHD). It earns its place above ~150 particles and is
  harmless below, so it is unconditional rather than a branch. Its output must
  be identical to the naive scan — a test asserts that equivalence.
- **Resize hysteresis.** Recompute `n` on resize, but only re-seed when the
  delta exceeds ~15%; otherwise add or remove the difference incrementally.
  Regenerating the field would teleport every particle at once, which is very
  visible during a window drag.

Alternative considered — *keep 140 and accept the density variance*. Rejected:
it is the specific failure this change would make visible.

### Decision 6: Pointer attraction is delta-time based, bounded, and mouse-only

Four properties, each fixing a specific defect in the reference implementation:

- **Delta-time.** The reference applies `node.x -= (node.x - pointer.x) * 0.005`
  *per frame*, so its strength depends on frame rate — a 144Hz display gets
  2.4× the pull of a 60Hz one. The existing `stepParticles` is already
  delta-time based, so attraction uses `1 - Math.exp(-k * deltaSeconds)`, which
  is frame-rate invariant by construction. A test asserts that the same elapsed
  time split across different frame counts produces the same result.
- **Bounded.** The reference bounces off edges; this simulation **wraps**
  (`simulation.ts:49-54`). Unbounded attraction plus wrapping produces a
  permanent clump at the cursor, since nothing pushes particles back out.
  Displacement from a particle's free-drift path is therefore capped.
- **Released, not teleported.** On `pointerleave` from the document and on
  window blur, the pointer goes inactive and the field **eases back** to free
  drift. The reference's `pointer.x = -1000` is a teleport that happens to fall
  outside the influence radius; an explicit inactive state is clearer and
  produces a smooth release rather than an instant one.
- **Mouse only** (`event.pointerType === "mouse"`). The layer is gated to `sm`
  and up, which still includes touch laptops and large tablets. A touch
  "pointer" is a tap, not a hover — an unfiltered listener would yank the field
  to wherever a finger last landed and strand it there until the next tap.

The listener is attached to `window` with `{ passive: true }`, not to the layer,
because the layer keeps `pointer-events-none` and must never receive an event.
Client coordinates are converted to container-normalised coordinates at read
time.

### Decision 7: Reduced motion renders a still constellation, with no listener attached

The existing layer draws exactly one static frame under
`prefers-reduced-motion: reduce` — a still field rather than nothing, since a
compliant empty canvas and a failed one look identical. That frame now includes
links, which is strictly better: a still constellation is a more legible
still image than a still scattering of dots.

Pointer attraction is positional movement, so it is not merely inert under
reduced motion — **the listener is never attached at all**, and the tests assert
its absence rather than its inactivity. An attached-but-ignored listener is a
latent regression waiting for someone to "fix" the ignore.

## Risks / Trade-offs

- **The 60fps budget is modelled, not yet measured.** → The pair counts and
  density above are arithmetic; per-frame cost in a real browser is not. Task
  Group 9 profiles the real thing at `sm`, laptop and ultrawide, and the
  measured value is recorded. If it misses, the levers in priority order are:
  lower the target mean-neighbour count (fewer links, same particles), then
  raise the alpha-bucket count's coarseness, then reduce the clamp ceiling.
- **`source-over` links lose crossing glow.** → Accepted deliberately: the
  provable contrast bound is worth more than the glow on a layer whose whole
  job is to stay behind content. The offscreen-buffer alternative in Decision 3
  is the escape hatch if browser verification finds the flat look lifeless.
- **Peak alpha 0.75 is derived but not yet seen.** → The contrast arithmetic is
  exact; whether 3.23:1 *looks* right on a real display is a judgement call the
  owner makes in Task Group 12, with 0.79 as the hard ceiling.
- **Changing particle count changes the existing look.** → On a 1440×900
  laptop the field goes from 140 particles to ~81. That is a visible thinning
  of a shipped surface, not a pure addition. It is required for consistent link
  density (Decision 5), and the links themselves add visual mass back, but it
  is worth flagging as a deliberate change to something already live rather
  than letting it read as a regression.
- **A stale pointer keeps updating while the loop is stopped.** → While the
  layer is tab-hidden or scrolled out of view, `pointermove` still fires and
  updates state. `shouldRun()` correctly refuses to restart the loop, and the
  cost is a few arithmetic operations per event. Accepted and recorded as a
  decision rather than guarded, so it does not later read as an oversight.
- **The spatial grid is a second code path for the same answer.** → Any
  divergence between it and the naive scan is a silent visual bug. Mitigated by
  a test asserting the two produce identical pair sets over randomised inputs.

## Migration Plan

None required. This is a client-only presentational change to a decorative
layer: no data migration, no API surface, no persisted state, no content-schema
change. Rollback is reverting the commit — the layer returns to its current
behaviour with no residue, since nothing it touches is persisted anywhere.

## Open Questions

- **Peak alpha final value** — 0.75 is derived and defensible; the owner signs
  off on the rendered result in Task Group 12. Ceiling 0.79 is not negotiable.
- **Pointer strength `k` and influence radius** — no principled derivation
  exists for these the way it does for alpha and density; they are set to a
  sensible starting point and tuned by eye during browser verification.
- **Whether the target mean-neighbour count of 5 is right** — it is the one
  free aesthetic parameter in Decision 5. Everything else follows from it, so
  changing it later is a one-constant edit rather than a redesign.
