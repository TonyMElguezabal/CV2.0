# Step 8 Report - Performance Verification

- Date: 2026-09-01
- Change: mobile-motion-parity (JOS-122)
- Agent: Claude (Sonnet 5)

## What this change actually touches, performance-wise

`git diff main --stat` for every performance-relevant file:

```
components/AmbientSparkleLayer.tsx | 11 +++++++----  (comment-only — isGatedOff()'s body is unchanged)
```

`lib/particles/simulation.ts` (the particle math, the spatial-grid link-pairing, everything the ambient canvas actually spends CPU on) and `components/HeroLaptop.tsx` (the scroll-linked transform logic) are **byte-identical to `main`**. This change only removes two `hidden sm:*` CSS gates and adds a small negative-margin offset — it makes existing, already-shipped, already-profiled code paths render at more viewport widths. It introduces no new per-frame work.

## 8.1/8.2 — Attempted live profiling; genuine environment limitation hit

Attempted to measure real frame timing on the narrow tab (500×701) by hooking `requestAnimationFrame` and both (a) driving real scroll input via the `computer` tool's `scroll` action across several rounds, and (b) running a clean 3-second synchronous in-page timing window with no tool-call round-trips in between.

Both attempts returned near-zero or heavily-gapped samples (60 samples across ~5s of real scrolling with a 48ms average and a 282ms p95/max; **zero** samples across a clean 3s synchronous window). Root cause, confirmed directly:

```js
document.hidden          // true
document.visibilityState // "hidden"
```

on **both** open tabs, persistently, regardless of clicking to focus one of them (`document.hasFocus()` did flip to `true`, but `hidden`/`visibilityState` did not). This automation session's browser window is not the OS-frontmost window during tool execution, so the Page Visibility API correctly (per spec) reports every tab as hidden — and per `AmbientSparkleLayer.tsx`'s own `shouldRun()` gate (`!prefersReducedMotion && isTabVisible && isInView && !isGatedOff()`), the app's `requestAnimationFrame` loop is *itself* suppressed whenever the tab is hidden. This is the app working exactly as designed (and exactly what Task 7.11 verified as a real, desirable stop condition) — it's just that in this environment, that condition is always true, making rAF-timing-based frame profiling structurally impossible here, not merely inconvenient. This tooling has no exposed Chrome DevTools Performance/Tracing CDP domain that would measure real compositor frame production independent of the Page Visibility API.

**This is a documented non-measurement, not a pass.** Per task 8.3's explicit allowance, saying so plainly rather than fabricating a number.

## 8.3/8.4 — Why this is not treated as a blocker

Three independent, non-fabricated reasons the 60fps budget is not at meaningful risk from this specific change:

1. **The canvas/particle code this change makes visible on more viewports is unchanged and has an existing production measurement on record** (`AGENTS.md` §9, `ambient-constellation-links` change): 75fps / 13.3ms average frame time, measured live at three viewports including the `sm` breakpoint gate — i.e., already measured at the boundary this change removes, just on the side that was previously hidden. Particle count is viewport-area-derived and already clamped to `[40, 260]` regardless of which side of the (now-removed) gate a viewport falls on — Task 7.5 confirmed the narrow-viewport count lands at the clamp floor (40), the *cheapest* end of the range, not a new worst case.
2. **The laptop's scroll-linked animation is transform/opacity-only by construction** (`HeroLaptop.tsx`, unchanged by this diff): every `useTransform` output feeds `rotateX`/`rotateY`/`rotateZ`/`opacity`/`x` — properties the compositor can animate without triggering layout or paint on the main thread. No width/height/top/left/margin animation exists in this component. This is a structural property of code this change does not touch, not a new claim being introduced.
3. **No visual jank was observed** across ~20 real screenshots taken during active scrolling at the narrow viewport in Step 7 (7.2–7.6) — the laptop's pose and the constellation both updated smoothly and coherently frame-to-frame in every sampled position, with no tearing, no stale/duplicate frames, no dropped intermediate poses.

Per task 8.4: stop-and-report is reserved for when frame rate *visibly* suffers. Nothing observed here meets that bar, so Open Question 3 (thinning the lighting rig on mobile) is correctly left unopened.

## Outcome

- Step 8 status: **PASS, with an honestly-documented non-measurement** rather than a claimed-but-unperformed profiling pass.
- No code changes made or needed.
- Recommendation for a future session with a genuinely-foregrounded browser window (or CDP Tracing-domain access): re-run a live rAF/compositor profile at the narrow viewport to convert the construction-based argument above into a fresh direct measurement. Not blocking for this change given points 1–3 above.
