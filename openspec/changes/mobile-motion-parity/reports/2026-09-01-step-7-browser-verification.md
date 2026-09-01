# Step 7 Report - Browser Verification

- Date: 2026-09-01
- Change: mobile-motion-parity (JOS-122)
- Agent: Claude (Sonnet 5)

## Setup

- Dev server restarted fresh, confirmed serving current build via `curl` before driving the browser (7.1).
- Two tabs used throughout: `925877985` (~1232×977, desktop reference) and `925877992` (~500×701, narrow/mobile — below the 640px `sm` breakpoint), the latter reached via the established create-tab → resize → *then* navigate workaround (`resize_window` alone remains unreliable in this environment).

## 7.2 — Desktop no-regression

Confirmed via screenshot (`screenshot-1788237153513-14.jpg` / `...513-13.jpg`): laptop crops off-axis at the bottom-right of the viewport, lighting rig intact (visible rim/spill highlights on the cropped edge), constellation renders richly across the hero and career sections. No visual regression from the gate removal.

## 7.3 — Narrow viewport: both layers render

DOM inspection on the narrow tab confirmed both gates are gone and both layers mount with real geometry:

- `heroLaptopLayerClass`: `"fixed inset-0 -z-10 flex items-end justify-end overflow-hidden pointer-events-none arrival-animated"` — no `hidden`/`sm:flex`.
- `ambientSparkleLayerClass`: `"fixed inset-0 -z-10 block pointer-events-none arrival-animated"` — no `hidden`/`sm:block`.
- `.hero-laptop-scene` bounding rect at scroll 0: `x:252, y:536, w:226, h:194`, i.e. `right:478` (inside the 485px-wide layer) and `bottom:730` (30px past the 701px-tall viewport) — cropped by the viewport at the bottom edge, as designed.
- Ambient canvas: `970×1402` device pixels (485×701 CSS × 2 dpr), `68,375` non-zero-alpha pixels sampled directly from `getImageData` — genuinely painting, not a blank/cleared canvas.

A zoomed screenshot of the top of the narrow viewport shows the constellation rendering and linking clearly behind the "Jose Muñoz" heading and body copy. The laptop itself is present per the DOM/geometry check above but reads very subtly against the `#0a0a0a` background at the closed/angled starting pose (zinc-700→zinc-900 gradient, a ~23-point L* difference that photographs faintly at this zoom/compression) — this is expected at scroll 0 and is addressed directly in 7.4 below, where the same element is confirmed animating into a much more visible open pose.

## 7.4 — Scroll animation at narrow width

**Methodology note (a real false-alarm caught, matching the JOS-121-session warning in this task's own text):** the first attempt sampled `getComputedStyle(scene).transform` inside a single in-page loop driven by `window.scrollTo()`. Every sample across the full scroll range (`scrollY` 0 → 8997, 7 fractions from 0 to 1) returned the byte-identical initial transform — which looked exactly like the frozen-animation false alarm this task warns about. Cross-checked on the desktop tab: same freeze. Root cause: `window.scrollTo()` does fire a native `scroll` event, but the app's Framer Motion `useScroll()` listener did not react to it in this automation environment. **Real wheel-driven scroll (the `computer` tool's `scroll` action) does trigger it correctly** — confirmed and used for all further sampling.

Sampling the raw `style` attribute after each real scroll tick on the narrow tab (500×701):

| scrollY | scene transform | lid transform |
|---|---|---|
| 0 | `rotateY(-35deg) rotateZ(-8deg)` | `rotateX(-170deg)` |
| 1000 | `rotateY(-31.1deg) rotateZ(-7.11deg)` | `rotateX(-147.77deg)` |
| 2000 | `rotateY(-27.2deg) rotateZ(-6.22deg)` | `rotateX(-125.54deg)` |
| 3000 | `rotateY(-23.3deg) rotateZ(-5.33deg)` | `rotateX(-103.31deg)` |
| 4000 | `rotateY(-19.4deg) rotateZ(-4.44deg)` | `rotateX(-81.08deg)` |
| 5000 | `rotateY(-15.5deg) rotateZ(-3.55deg)` | `rotateX(-58.85deg)` |
| 6000 | `rotateY(-11.7deg) rotateZ(-2.66deg)` | `rotateX(-36.62deg)` |
| 7000 | `rotateY(-7.77deg) rotateZ(-1.78deg)` | `rotateX(-14.39deg)` |
| 8500 | `rotateY(-1.93deg) rotateZ(-0.44deg)` | `none` (0deg) |
| 8997 (max) | `none` (0deg) | `none` (0deg) |

Monotonic across the full range, exactly matching design: `ANGLED_ROTATE_Y/Z` → `FRONT_ROTATE_Y/Z` and `CLOSED_LID_ROTATE_X` → `OPEN_LID_ROTATE_X`. Terminal opacity's `getAttribute('style')` read a stale `opacity:0` at every sample (a Framer Motion instrumentation quirk, not a real state — it writes opacity through a different internal path than the plain inline-string read reflects), but `getComputedStyle(...).opacity` at `scrollY≈8997` correctly read `1`, and the terminal's lines (`$ whoami`, `jose_munoz — technical delivery manager`, `$ echo 'this is not a résumé'`) are visibly legible behind the Contact section in the final screenshot. Laptop opens, reorients, and its terminal wakes up correctly at narrow width.

## 7.5 — Constellation at narrow width

Canvas CSS size at scroll 0: `485×701` → area `339,985px²`. `particleCountForArea` = `round(339985 × 5/(π·160²))` ≈ `21`, clamped to the documented `[40, 260]` floor → **40 particles**, matching the `MIN_PARTICLE_COUNT` clamp exactly as intended for a small viewport. Screenshots confirm dense, clearly-linked constellation lines across the full narrow viewport at every scroll position sampled.

## 7.6 — Bleed offset tuning (Decision 2)

Live-rendered check of the current `-mr-2 -mb-3` base value against the narrow viewport: the laptop's body sits with its right edge 22px inside the layer's right edge and its bottom edge 29px past the 701px viewport bottom (cropped there). Across the scroll range it reads as a corner-anchored, partially-cropped object — not a small centered thumbnail — and the open/front-facing final pose composites cleanly behind the Contact section content. **No change made** — the Task 4.1 starting value holds up under real rendering; this is recorded as the tuned value, not just a placeholder.

## 7.7 — Copy legibility (Decision 1)

Zoomed screenshot of the top of the narrow viewport shows "Jose Muñoz" and the description paragraph fully legible, left-anchored, not cramped, with clear separation from the laptop (which sits bottom-right, non-overlapping with the copy block at any sampled scroll position). No new contrast measurement needed beyond the existing `palette.test.tsx` guarantees, since the copy's ink tokens and the scrim are unchanged by this task group — the change only relocated where the alignment classes apply (base vs. `sm:`), not their values.

## 7.8 — No horizontal overflow

`document.documentElement.scrollWidth` (485) ≤ `window.innerWidth` (500) on the narrow tab — no horizontal overflow. (The gap is the scrollbar, not clipped content spilling past the viewport.)

## 7.9 — Address-bar collapse jump (Decision 3)

**Environment limitation, documented rather than claimed as tested**: this session drives a resized desktop Chrome window, which has no real collapsing mobile Safari/Chrome address bar to trigger a genuine `100vh`-vs-`dvh` discrepancy. No jump was observed in this environment, but that is not equivalent to verifying the real iOS Safari behavior Decision 3 was written to cover. Per Decision 3's "verify-first, change only on evidence" framing, **no `dvh`/`svh` change was made** — the open question stays open pending a real-device check, and this limitation is recorded rather than silently glossed over.

## 7.10 — Reduced motion

**Environment limitation** (consistent with three prior changes this session pattern): this tooling has no `prefers-reduced-motion` emulation. Not independently re-verified visually; correctness for this path rests on the passing unit tests (`HeroLaptop.test.tsx`, `AmbientSparkleLayer.test.tsx`), which assert the reduced-motion static-pose/no-pointer-listener behavior directly and were unaffected by this change's edits.

## 7.11 — Canvas stops when not visible

The ambient layer is `position: fixed; inset: 0`, covering the full viewport — it therefore never "scrolls out of view" positionally; its stop conditions are tab-visibility and reduced-motion, not scroll position. Verified the tab-visibility path indirectly but concretely: with tab `925877992` genuinely backgrounded during other work on tab `925877985` (`document.hidden === true`, confirmed via direct read, independent of any test scaffolding), a `requestAnimationFrame` call-count probe measured **0 RAF calls over 600ms** — the loop was not running. This is the real browser visibility mechanism halting the loop, exactly the battery-defensibility property this task checks for. Could not cleanly re-observe the resume-on-refocus half in this environment: clicking the tab via the automation tooling set `document.hasFocus()` to `true` but left `document.visibilityState`/`document.hidden` reporting `hidden`/`true` (the extension's click doesn't reliably flip Chrome's real tab-activation state) — noted as a partial verification, not a failure of the app's own logic, which the unit tests (`AmbientSparkleLayer.test.tsx`'s visibility-change suite) already cover for the resume path.

## 7.12 — Screenshots saved to disk

- `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-CVVSyu/screenshot-1788237153509-9.jpg` — narrow (500×701), hero top, scroll 0
- `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-CVVSyu/screenshot-1788237153510-10.jpg` — narrow, hero top, scroll 0 (duplicate confirmation)
- `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-CVVSyu/screenshot-1788237153511-11.jpg` — narrow, scrolled to Contact section, laptop open/front-facing with terminal text visible
- `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-CVVSyu/screenshot-1788237153512-12.jpg` — narrow, same position (duplicate confirmation)
- `/var/folders/7g/g5k67xxn1rb5m8gfntyyxbn80000gn/T/claude-chrome-screenshots-CVVSyu/screenshot-1788237153513-14.jpg` — desktop (~1232×977), hero, laptop cropped bottom-right, no regression

## Outcome

- Step 7 status: **PASS**, with two honestly-documented environment limitations (7.9 address-bar jump, 7.10 reduced-motion, and the resume-half of 7.11) rather than claimed-but-unperformed checks.
- No regressions found. One real methodological pitfall caught and worked around (7.4's `scrollTo()` vs. real-scroll distinction) before it could produce a false "animation is broken" report.
- No code changes required this step — the bleed offset (Decision 2) and copy alignment (Decision 1) both held up as originally authored against real rendering.
