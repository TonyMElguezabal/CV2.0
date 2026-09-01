## Context

Two fixed, full-viewport decorative layers currently stop at Tailwind's `sm` breakpoint (640px):

| Export | File | Current |
| --- | --- | --- |
| `heroLaptopLayerClass` | `components/HeroShellStyles.ts` | `fixed inset-0 -z-10 hidden … sm:flex` |
| `ambientSparkleLayerClass` | `components/AmbientSparkleLayerStyles.ts` | `fixed inset-0 -z-10 hidden … sm:block` |

There is no JavaScript-level viewport branching anywhere in `HeroLaptop.tsx`, `HeroFramer.tsx`, or `AmbientSparkleLayer.tsx` — the gate is these two class strings and nothing else. That makes the mechanical part of this change very small; the substance is in the composition decisions the gate was hiding, and in one mobile-only failure mode nothing in this repo has ever exercised.

**The laptop's interior is already mobile-sized.** Every inner class carries a real base value beneath its `sm:` upsize — `heroLaptopBaseClass` is `h-40 w-64` before `sm:h-[300px] sm:w-[520px]`, and the keyboard, trackpad, lid and terminal text all follow the same pattern. A 160×256px laptop was authored for a mobile render the outer gate then prevented. Un-hiding the layer yields a correctly-scaled laptop, not an unstyled one.

**One class breaks that pattern, and it is the whole of Decision 2:** `heroLaptopSceneClass` is `… sm:-mr-4 sm:-mb-6` with no base value. Those negative margins are what push the scene past the viewport edge to produce the cropped, off-axis composition.

## Goals / Non-Goals

**Goals**

- The laptop and the constellation field render and animate at every viewport width.
- The off-axis, cropped composition — the thing that stops the laptop reading as a centered thumbnail — holds on mobile too, not just the bare presence of the object.
- The 60fps and canvas-stops-when-invisible guarantees keep holding on hardware where they are, for the first time, actually under pressure.

**Non-Goals**

- Touch-drag pointer attraction for the constellation. The mouse-only filter is correct behaviour on touch and is explicitly out of scope (see "Deliberately unchanged").
- Any change to particle density logic, the CareerTimeline rail, reduced-motion paths, or the no-JS behaviour of either layer.
- A site-wide viewport-unit migration. See Decision 3.
- Re-litigating whether the effects are worth having. That is the owner's call and it has been made.

## Decisions

### Decision 1 — Hero copy anchors off-center at every width; only the padding stays breakpoint-scoped

`heroWrapperClass` today is `items-center justify-center text-center` at base, flipping to `sm:items-start sm:text-left sm:pl-16 sm:pr-16`. Its own comment ties this directly to the gate: *"Below sm the laptop layer doesn't render at all, so the hero copy stays centered there."* This change invalidates that premise.

**This decision reverses the recommendation carried in the enriched ticket**, which proposed keeping the copy centered on mobile. Two things found while reading the actual spec text changed the answer:

1. **The requirement is stricter than the ticket assumed.** `hero-signature-motion`'s "The laptop is framed off-axis and cropped" contains the scenario *"Copy and laptop do not share one axis → the copy is anchored off the viewport's center axis."* Once the small-viewport exemption is removed, keeping mobile copy centered would leave that scenario failing at mobile widths. The ticket's recommendation would have shipped a spec violation.
2. **The ticket conflated alignment with padding.** Its argument against left-anchoring was that `sm:pl-16 sm:pr-16` leaves only ~262px of text column at 390px. But alignment (`items-start` / `text-left`) and padding (`pl-16`) are independent utilities. Moving *alignment* to base while leaving the generous *padding* at `sm:` gives left-aligned copy inside the existing base `px-6` — ~342px of column at 390px, which is more room than the centered layout has today, not less.

So: `items-start` and `text-left` move to base; `sm:pl-16 sm:pr-16` stay where they are. The requirement then holds uniformly and needs no viewport carve-out in its scenario text.

*Alternative considered:* rewrite the scenario to express only the underlying intent ("laptop and copy do not share a single centered axis") and argue that a corner-docked laptop satisfies it even against centered copy. Rejected — it weakens a requirement to fit an implementation, when the implementation can simply satisfy the requirement as written.

### Decision 2 — Mobile gets a base bleed offset, not a fully-contained laptop

Un-hiding the layer without touching `heroLaptopSceneClass` renders a complete, uncropped 160×256px laptop docked in the bottom-right corner. That is close to the "small centered thumbnail" read that `hero-laptop-cinematic-lighting` Decision 5 was written specifically to eliminate — the change would technically show a laptop on mobile while losing the composition that makes it worth showing.

That original decision gives two reasons for cropping, and **neither is desktop-specific**: it breaks the shared centre axis between object and copy, and it hides CSS 3D's worst artifacts — the far edges, and the lid degenerating to a hairline at grazing angles. A small uncropped laptop on a phone displays those artifacts at least as plainly as a large one on a desktop.

So `heroLaptopSceneClass` gains a base negative-margin offset. The exact value is deliberately **not** fixed here: it is proportional to a much smaller scene and must be tuned against a real narrow viewport, then confirmed by eye. Task Group 5 owns that.

*Alternative considered:* scale the whole scene up on mobile so it crops naturally without a margin offset. Rejected — a 520px-wide laptop on a 390px viewport would push the screen out of frame, and the same requirement mandates the screen stay fully visible wherever the terminal must be readable.

### Decision 3 — Treat `100vh` as verify-first, change only on evidence

`heroWrapperClass` uses `min-h-screen` (`100vh`) and both layers are `fixed inset-0`. On mobile browsers — iOS Safari especially — `100vh` is the address-bar-retracted height, and a fixed element's box changes as that bar collapses and re-expands during scroll.

This matters here more than it would elsewhere. The laptop's entire animation is driven by `useScroll()`'s whole-document `scrollYProgress`, mapped through `useTransform` into lid `rotateX`, body `rotateY`/`rotateZ`, and five lighting-layer opacities. A fixed layer resizing mid-scroll can make the laptop visibly jump during precisely the interaction the effect exists to showcase. Desktop has no address bar, so no amount of desktop verification would surface it — and until this change there was no mobile render to surface it *from*.

`dvh`/`svh` are the standard fix, but switching viewport units touches every `min-h-screen` on the page, not just the hero. **Verify first, change only if the jump is observed** — and if it is observed, that is a spec-visible change in its own right and should be scoped accordingly rather than slipped in.

*Alternative considered:* pre-emptively switch to `dvh` as cheap insurance. Rejected — it is a global layout change made on speculation, and `dvh` has its own trade-off (the layer resizes continuously as the bar moves, rather than staying stable and occasionally clipping).

### Decision 4 — `isGatedOff()` and its zero-size test stay; only their justification changes

`AmbientSparkleLayer.tsx` derives "am I gated off?" from the container measuring 0×0, with a comment explaining that the CSS class is the single source of truth so no breakpoint value needs syncing. After this change the layer is never gated off by CSS, so that comment is false.

The **function stays** — a rAF loop against a zero-size canvas is worth refusing regardless of *why* the canvas has no size, and a container can legitimately measure zero mid-mount. Likewise `AmbientSparkleLayer.test.tsx`'s "starts no loop when its container reports zero size" test asserts behaviour that remains correct and valuable; only its name and comment reference the gate that motivated it.

Recorded as an explicit decision because the tempting move — deleting a guard whose stated rationale just evaporated — would remove real robustness. What evaporated is the explanation, not the need.

## Risks / Trade-offs

**[60fps fails on real mobile hardware]** → This is the risk the original gate existed to avoid, and it is the one this change genuinely takes on. Mobile GPUs must composite the laptop's ~8 overlay layers *plus* a full-viewport canvas. Mitigation: it is the primary thing Task Group 6 measures rather than assumes, and `performance-budget-compliance` already permits documenting why a full profiling run was not achievable in a given environment — but a documented non-measurement is not a pass, and a visible frame-rate problem is a reason to reconsider scope, not to ship.

**[Address-bar resize jump during the hero scroll]** → Decision 3. Verify on a real mobile browser scrolling the full hero range; a static screenshot cannot show it.

**[Battery cost of a continuous canvas on a phone]** → Materially mitigated already: the loop stops on hidden document, on scrolling out of view, and on unmount. These stop conditions were always good practice; on battery-powered hardware they become the actual justification for running the effect at all. Task Group 6 verifies they still fire on mobile rather than assuming inheritance.

**[The composition reads worse small than it does large]** → Decisions 1 and 2 are aesthetic judgements, and the honest position is that they cannot be fully settled from source. Mitigation: both are explicitly staged for confirmation against the rendered result, and owner sign-off on the mobile render is in the Definition of Done.

**[Removing a requirement loses the reasoning behind it]** → The removed requirement encodes a real trade-off that a future reader might otherwise re-derive from scratch. Mitigation: the REMOVED delta carries an explicit Reason and Migration, and the archived change keeps the full argument.

## Migration Plan

No data, API, dependency, or content-model change. The behaviour change is two class strings plus a composition offset; a revert restores the previous gating exactly.

Sequence: invert the gate tests (red) → drop both gates → base bleed offset and copy alignment → tune the offset against a real narrow viewport → measure. The tuning step deliberately comes after the layer is visible, because it cannot be done any earlier.

## Open Questions

1. **The exact base bleed offset for `heroLaptopSceneClass`.** Cannot be derived — it is proportional to a much smaller scene and needs tuning by eye at a real narrow viewport (Task Group 5). Starting point: scale the existing `-mr-4 -mb-6` roughly in proportion to the scene's size reduction, then adjust.
2. **Whether the address-bar jump actually occurs on this layout.** Decision 3 resolves the *policy* (verify first); the observation itself is Task Group 6's to make.
3. **Whether the ~8-layer lighting rig should be thinned on mobile if 60fps does not hold.** Only worth answering if measurement shows a problem — pre-emptively simplifying would give up the effect this change exists to deliver.
