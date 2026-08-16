## Context

Nothing on the site moves unless the visitor acts. The hero text animates once on
load; the laptop animates in response to scroll. Open the page and hold still and
it is completely inert. The goal driving this change is that the site should feel
alive on arrival, and `docs/PRD2.md`'s additive spark field is the reference.

JOS-105 evaluated and rejected WebGL for the hero laptop, and the spark field was
discarded with it. That was a reasoning error: the comparison drawn was "three.js
versus nothing," when Canvas 2D sits between them at zero dependency cost. This
change revisits only that specific conclusion, not JOS-105's other findings —
the decision to keep the *laptop* in CSS remains correct for all the reasons
recorded there.

## Goals / Non-Goals

**Goals**
- Continuous, subtle motion that reads as light rather than as noise.
- Zero added dependency, zero asset, zero network request.
- Degradation rules that hold up for something that runs indefinitely.

**Non-Goals**
- The page-load arrival sequence (JOS-112) — a different window with different
  machinery.
- Scroll-linked reveals (JOS-111).
- Any WebGL. This change exists specifically because Canvas 2D makes WebGL
  unnecessary here.
- Particles as a foreground effect. They sit behind all content, always.

## Decisions

### Decision 1: Canvas 2D, revisiting JOS-105's rejection on its own terms

| | Three.js | **Canvas 2D** | CSS/DOM |
|---|---|---|---|
| Added bytes | ~170 KB gz | **0 — built in** | 0 |
| 200 particles | trivial | trivial | ~200 DOM nodes ✗ |
| Additive glow | native | `globalCompositeOperation = "lighter"` ✓ | ✗ |
| Per-frame cost | GPU | one canvas repaint | 200 node style recalcs ✗ |

The DOM approach is the one worth ruling out explicitly: 200 absolutely-positioned
elements each with an animated transform would mean 200 style recalculations per
frame, which is precisely the layout-thrash the site's 60fps requirement exists
to prevent. A single canvas is one paint.

`globalCompositeOperation = "lighter"` is what makes the particles read as
*light* rather than as dots — overlapping particles sum toward white, exactly as
the additive blending in the PRD2 reference does.

### Decision 2: The layer sits above the hero scrim — measured, not assumed

This is the decision most likely to be gotten wrong by placing the canvas inside
the existing hero layer, and JOS-105 already paid for the lesson.

```
particle painted on the stage       rgb(231,217,181)   +221 over background
same particle under the 80% scrim   rgb( 53, 51, 45)   + 43 over background
```

An 80% reduction. For comparison, JOS-105's light ⑤ (the key/shadow wash) was
*removed* after real-browser A/B testing showed it contributed ~12 levels under
the same scrim and was visually indistinguishable from nothing. At 43 the
particles would technically survive, but they would read as muted grey dust —
the precise opposite of the effect this change exists to produce.

So the ambient layer is its own fixed layer, stacked **above** the hero laptop
layer and its scrim, and **below** all page content. Text legibility is
unaffected because content paints on top; the scrim continues to do its job for
the laptop, which is what it was tuned for.

### Decision 3: Reduced motion means static, not slower — and that is not a choice

`accessibility-compliance` is unambiguous: "no movement-based animation plays;
only opacity/fade transitions remain." A drifting particle field is
movement-based animation. There is no reading under which a slowed drift
complies.

The layer therefore renders a **still field** under `prefers-reduced-motion:
reduce`, optionally fading in. The still field is preferred over rendering
nothing because it preserves the visual texture that motivates the feature while
fully complying — and because "renders nothing" and "failed to initialise" look
identical, which makes the compliant state indistinguishable from a bug.

### Decision 4: Stopping when invisible is the substance, not the polish

This is the first thing on the site that runs indefinitely. Everything prior
completes: the hero entrance finishes, the laptop only recomputes on scroll.

Browsers already throttle `requestAnimationFrame` in hidden tabs, which makes it
tempting to skip explicit pausing. That is not sufficient here, for two reasons:
throttled is not stopped, and the *scrolled-out-of-view* case — the layer sitting
behind three screens of content, still repainting every frame — is not covered by
any browser heuristic at all.

Both cases are therefore explicit requirements, along with releasing the loop on
unmount. The owner's decision that performance does not gate this site
(2026-08-13) was about page weight and load scoring; it was not a decision to
drain a battery on a tab left open in the background.

### Decision 5: Mobile follows the laptop's existing gate

The hero laptop is `hidden sm:flex`. The ambient layer matches, for three
reasons: constrained devices are the ones where a continuous loop costs most; the
effect is a background flourish on a viewport that has little background to
spare; and matching an existing gate is one rule for a reader to learn instead of
two.

### Decision 6: Extend the 60fps requirement rather than leave canvas uncovered

The requirement reads: animations run at 60fps "by animating only
compositor-friendly properties (transform/opacity)". A canvas particle field
animates neither — it repaints pixels.

That means it does not *violate* the requirement, but it is not *covered* by it
either — which is the worse outcome, since the 60fps intent obviously applies. A
future reader would find a continuously-animating surface with no frame-rate
obligation attached to it anywhere.

The requirement is therefore broadened to name both mechanisms: DOM property
animation keeps the transform/opacity constraint verbatim, and canvas-rendered
animation gains a frame-budget obligation plus the stop-when-invisible rule from
Decision 4 — putting the lifecycle rule in the capability that will actually be
consulted when someone next adds an animated surface.

**Ordering with JOS-107.** `narrow-performance-budget` also modifies this
capability and explicitly keeps this requirement unchanged. It is spec-only and
smaller, so it should land first and this delta is written against that state. If
the order reverses, this requirement's text is still the intended final one —
but verify rather than assume, since two changes editing one requirement is
exactly where a silent revert happens.

### Decision 7: Particle colour comes from the shared accent token

JOS-108 establishes a single accent token, and JOS-105 already learned what
happens when a colour is specified twice — the terminal's accent was applied via
a Tailwind class that never compiled, so the className looked right and rendered
nothing. Deriving the particle tint from the shared token keeps one source of
truth and avoids a second place for the accent to drift.

## Risks / Trade-offs

- **Ambient motion can read as noise rather than atmosphere.** Too many particles,
  too fast, or too bright and the page looks dirty instead of alive — and unlike
  a one-shot animation, the visitor is exposed to it for the entire session.
  *Mitigation:* tune against the real composed page rather than in isolation, the
  way JOS-105's lighting was; be willing to reduce count and brightness well
  below what looks good in a demo.
- **It competes with the hero laptop for attention.** Both are background motion
  in the same viewport. *Mitigation:* the particle field is subordinate by
  design — small, dim, slow; if the two fight, the particles yield.
- **Continuous CPU on an idle tab is a real cost**, even with the pausing rules,
  whenever the page is genuinely visible and idle. That is the accepted trade for
  ambient motion existing at all. *Mitigation:* keep the particle count modest and
  the per-frame work trivial; the frame-budget requirement makes it measurable.
- **The scrim decision could still be wrong in the other direction.** Above the
  scrim, particles may prove *too* prominent over text-heavy sections.
  *Mitigation:* if so, the correction is lowering the layer's own opacity — not
  moving it back under the scrim, which Decision 2 rules out on measured grounds.
