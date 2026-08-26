Linear-Issue: JOS-119

## Why

The ambient particle field behind the hero (JOS-110) is a field of *unrelated*
points. The site it sits behind is about a career as a connected system — one
behaviour recurring across five platform generations — and the layer currently
carries none of that reading. Joining nearby particles with distance-faded
lines turns a dot field into a constellation: the same restrained atmosphere,
but one that says *network* rather than *noise*. A gentle lean toward the
pointer makes it respond to presence, so the page feels attentive rather than
merely animated.

A second, less visible reason: **the existing layer has a latent density bug
that links would expose.** `PARTICLE_COUNT` is a fixed `140` regardless of
viewport, which means areal density varies ~10× between the smallest viewport
that renders it and an ultrawide. Nobody can see that in a field of unconnected
dots. With links — whose count scales as `n²R²/A` — it becomes a dense mesh on
a small laptop and a nearly empty scattering on a large display. Fixing it is a
prerequisite for this change, not an optional extra.

The originating ticket proposed a vendored `<iframe srcDoc>` component. That is
not the delivery vehicle here — see design.md Decision 1 for the seven verified
blockers (CSP, event capture, no stop conditions, palette, bundle, a11y,
duplicate motion system). The *intent* of that ticket is kept in full; only the
implementation is replaced.

## What Changes

- **Particles gain links.** Pairs closer than a link radius in **pixel space**
  are joined by a stroked line whose opacity falls to zero at the radius, drawn
  before the node pass so nodes stay crisp on top. Same single canvas, same
  accent token, no new dependency, no new asset.
- **Links composite `source-over`; nodes keep `lighter`.** This is a
  correctness constraint, not a style preference. Additive compositing makes
  overlapping links *sum*, and a saturated crossing measures 5.64:1 against the
  page background — above `--ink-meta`'s 5.23:1, i.e. text weight. `source-over`
  caps any pile-up at the accent's own 4.94:1, permanently below the text floor
  regardless of how many links overlap. See design.md Decision 3.
- **The field leans toward the pointer.** A bounded, delta-time attraction for
  particles near the cursor, released with an ease-back when the pointer leaves
  the window. Mouse only — a touch "pointer" is a tap, not a hover.
- **Particle count becomes viewport-derived.** `PARTICLE_COUNT` (a constant)
  becomes `particleCountForArea()` — a fixed areal density derived from a target
  mean-neighbour count — clamped to a sane range, with resize hysteresis so a
  window drag does not re-seed and teleport the whole field.
- **Deliberately does not** vendor the iframe component, introduce the
  `mode`/`hue`/`saturation`/`brightness`/`gap`/`speed` knob API (this site has
  one palette and one pace), add a twinkle pulse, or touch `HeroLaptop`, the
  arrival sequence, or `CareerTimeline`.

## Capabilities

### New Capabilities

None. Links, pointer response, and field density are all behaviour of the
ambient layer that `site-ambient-motion` already defines; adding a capability
for them would split one surface's spec across two files.

### Modified Capabilities

- `site-ambient-motion`: the layer gains three requirements — particles are
  joined by distance-faded links; the link pass is bounded below the site's
  text-contrast floor by construction (which constrains its compositing mode);
  and the field leans toward the pointer without intercepting events and
  without being required for the layer to animate. A fourth requirement makes
  field density a function of viewport area rather than a fixed count. The
  existing requirements — decorative-only, above-the-scrim stacking,
  reduced-motion stillness, stop-when-not-visible, small-viewport and no-JS
  gating, accent-derived colour — are unchanged and must continue to hold.

## Impact

- `lib/particles/simulation.ts` — `LINK_RADIUS_PX`, `linkedPairs()`,
  `particleCountForArea()`, a uniform spatial grid, and pointer influence in
  `stepParticles()`. All additions stay pure and canvas-free.
- `lib/particles/simulation.test.ts` — new coverage (TDD, written first).
- `components/AmbientSparkleLayer.tsx` — two-pass `draw()`, passive pointer
  listeners with cleanup, area-derived count with resize hysteresis.
- `components/AmbientSparkleLayer.test.tsx` — new task groups; existing Task
  Group 1–5 and arrival tests must pass unchanged.
- `components/AmbientSparkleLayerStyles.ts` — **expected unchanged**;
  `pointer-events-none` must stay.
- `CLAUDE.md` — the `AmbientSparkleLayer` architecture bullet.
- **No changes** to `lib/security/config.ts` (no CSP relaxation is needed —
  that is the point), `package.json` (no new dependency), or
  `app/(marketing)/layout.tsx` (the layer is already mounted correctly).
- No API, endpoint, database, or content-schema surface is touched.

## Depends on

Nothing. `site-ambient-motion` is current and this change modifies it in place.
