## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/hero-laptop-cinematic-lighting` from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. Two-faced lid structure (AC: "Only the viewer-facing lid face is visible")

- [x] 1.1 Add a failing test in `components/HeroLaptop.test.tsx` asserting the lid renders two distinct faces (screen face and outer face) and that both carry `backface-visibility: hidden`
- [x] 1.2 In `components/HeroLaptop.tsx`, restructure the lid into a container with two absolutely-positioned face children; move the bezel/terminal into the screen face and the lid accent onto the outer face (outer face at `rotateY(180deg)`)
- [x] 1.3 Add the face classes to `components/HeroShellStyles.ts`
- [x] 1.4 Confirm the closed pose no longer shows mirrored screen contents bleeding through; run `npx vitest run components/HeroLaptop.test.tsx` (7/7 pass)

## 2. Lighting rig (AC: "The laptop is lit by a scroll-driven lighting rig")

- [x] 2.1 Add failing tests asserting each of the five light layers is present in the DOM and that none of them declares an animated `filter`, `box-shadow`, or `background-position`
- [x] 2.2 Implement ① rim light — a diagonal top-left highlight (grazing-angle stand-in), opacity from scroll progress (strongest at `p=0`, most turned away), applied on the base and on both lid faces (screen face auto-hides via `backface-visibility` when the outer face is showing, and vice versa — no manual face-gating needed)
- [x] 2.3 Implement ② screen spill — a radial gradient on the base deck plus a bloom around the bezel, opacity from lid openness (`openness^1.6`), colored from the shared screen accent (`heroLaptopAccentHex`, sapphire)
- [x] 2.4 Implement ③ contact shadow beneath the base and deepen the existing hinge line into an ambient-occlusion crease (`hingeAoOpacity`), opacity from openness
- [x] 2.5 Implement ④ specular sweep — an oversized (300% width) gradient child inside each `overflow-hidden` lid face, animated with framer-motion's `x` shorthand (resolves to `transform: translateX()`) only, never `background-position`
- [x] 2.6 Implement ⑤ key/fill wash — complementary lit (warm) and shadowed overlays on both lid faces with opposing opacities (never `filter: brightness()`). **Removed in Step 7.2** after real-browser verification found it indistinguishable — see design.md Decision 8.
- [x] 2.7 Derive every intensity via `useTransform` off the existing `scrollYProgress` MotionValue (plus a derived `openness`); add no new scroll listener, driver, or state. Used the hand-authored curves from design.md Decision 2 as starting values
- [x] 2.8 Kept the light layers as flat siblings (12 initially, 8 after ⑤'s removal); no `will-change` applied

**Scope note:** the key/fill wash (⑤) and rim (①) apply to the base and both lid faces rather than a third "base wash" surface — the delta spec's scenario says "across the laptop's faces" (plural), and the two lid faces introduced in Step 1 satisfy that without adding a third wash pair on the base. **Resolved in Step 7.2:** ⑤ was indistinguishable behind the scrim and was removed; ① (rim) survived and remains on all three surfaces.

Full suite: `npx vitest run` — 74 files / 367 tests pass, no regressions. `npx tsc --noEmit` clean. (Counts as of this step; final counts after ⑤'s later removal are in Step 7.)

## 3. Reduced-motion and no-JS static lighting (AC: those two scenarios)

- [x] 3.1 Add failing tests: under `prefers-reduced-motion: reduce` every light renders at a fixed open-pose constant with no scroll binding. The no-JS half is **not** unit-tested, per this file's own established precedent (jsdom doesn't expose `<noscript>` children — see the trailing comment in `HeroLaptop.test.tsx`); extended that comment instead and deferred to task 11.5's real-browser check
- [x] 3.2 Implemented the reduced-motion branch using the existing `prefersReducedMotion ? constant : motionValue` pattern — each `STATIC_*` constant is that light's own formula evaluated at the static open pose (p=1), not an arbitrary number
- [x] 3.3 Extended the existing `<noscript>` override: added marker classes (`hero-laptop-rim`, `-spill`, `-contact-shadow-layer`, `-hinge`, `-specular`; two more, `-wash-lit`/`-wash-dark`, were added here and later removed along with light ⑤ in Step 7.2) so the noscript CSS can force every light to its open-pose opacity, same technique as the existing scene/lid/screen overrides
- [x] 3.4 Existing reduced-motion and no-JS assertions in `HeroLaptop.test.tsx` stay green (11/11 pass)

Full suite: `npx vitest run` — 367/368 pass; the one failure (`ChatWidget.test.tsx`, an unrelated focus-timing `waitFor` test) passes in isolation, confirmed pre-existing flake, not a regression. `npx tsc --noEmit` clean.

## 4. Screen accent → sapphire (AC: "The screen accent color is shared...")

- [x] 4.1 Added a failing test asserting the terminal text color and the spill/bloom color derive from one shared accent token (`heroLaptopAccentHex`), not independent literals — matches by RGB triplet since jsdom normalizes 8-digit hex+alpha to `rgba()` on serialization
- [x] 4.2 `heroLaptopAccentHex = "#4d82bd"` defined once in `HeroShellStyles.ts` (introduced in Step 2 for spill/bloom). Initially also drove `terminalClass` via an arbitrary-value Tailwind class (`text-[${heroLaptopAccentHex}]`) — **this had zero visual effect**, found during Step 11 real-browser verification: Tailwind's JIT scanner only sees literal text in source files, so a class name built via JS template-literal interpolation never gets its CSS rule generated. Fixed by applying it as an inline `style.color` in `Terminal.tsx` instead (the same technique every light in the rig already used), and the test was corrected to check the actual rendered color rather than the className string. The `text-emerald-400` literal is gone either way.
- [x] 4.3 Contrast **measured** via a WCAG relative-luminance/contrast-ratio calculation in `HeroLaptop.test.tsx` (pure arithmetic on two known hex values — not the jsdom-layout-dependent axe `color-contrast` check that's disabled in `accessibilityStructure.test.tsx`): `#4d82bd` on `#000` = 5.244:1, above the 4.5:1 AA floor. No adjustment needed.

Full suite: `npx vitest run` — 74 files / 370 tests pass (the prior `ChatWidget.test.tsx` flake did not recur). `npx tsc --noEmit` clean.

## 5. Off-axis framing (AC: "The laptop is framed off-axis and cropped")

- [x] 5.1 Added failing tests: laptop enlarged, corner-docked (`items-end justify-end` + negative margin), `hidden sm:flex` mobile gating unchanged; plus a copy-anchoring test in `HeroFramer.test.tsx` (AC "Copy and laptop do not share one axis" needed coverage beyond what this bullet named). **Sizes below were re-tuned in Step 11** after real-browser verification — see 5.4.
- [x] 5.2 Enlarged and repositioned in `HeroShellStyles.ts`: `heroLaptopLayerClass` docks to the bottom-right (`items-end justify-end`, `overflow-hidden` clips the excess), `heroLaptopSceneClass` carries a static (non-animated, non-transform) negative margin pushing it further past the edge — margin doesn't collide with framer-motion's inline `transform` on the same element
- [x] 5.3 `heroWrapperClass` anchors to a left column at `sm:` (`sm:items-start sm:text-left`); mobile (below `sm`, where the laptop doesn't render) stays centered — no JSX changes needed in `HeroFramer.tsx`, only `data-testid="hero-wrapper"` for testability. **Extended in Step 11** with `md:pl-56` after finding a real collision with `CareerTimeline`'s fixed left rail (see 11.2).
- [x] 5.4 **Verified in Step 11 with real browser measurements** (`getBoundingClientRect()` at four widths, checking the terminal screen's box against the viewport bounds). The initial size (`sm:h-[420px] sm:w-[680px]`, margin `sm:-mr-20 sm:-mb-12`) **failed**: at 1280×800 the terminal screen's top edge sat 160px above the viewport (terminal text entirely invisible) and its right edge extended 56px past the viewport width. Iterated empirically to `sm:h-[300px] sm:w-[520px]`, margin `sm:-mr-4 sm:-mb-6`, confirmed `fullyInFrame: true` at all four required widths:

  | Viewport | Screen box (l/r/t/b) | In frame |
  |---|---|---|
  | 1280×800 | 770 / 1272 / 56 / 338 | ✅ |
  | 1440×900 | 930 / 1432 / 156 / 438 | ✅ |
  | 1920×1080 | 1410 / 1912 / 336 / 618 | ✅ |
  | 2560×1440 | 2050 / 2552 / 340 / 622 | ✅ |

  Corresponding unit test assertions and code comments updated to the final values.

Full suite: `npx vitest run` — 74 files / 373 tests pass. `npx tsc --noEmit` clean.

## 6. Scrim re-tuning and contrast re-verification (design.md Risk 1)

- [x] 6.1 **Found a real latent issue while assessing this**, not just a tuning question: the scrim was DOM-first, before the scene, in the original (pre-lighting) markup. Since both are `position:absolute`/`relative` siblings with `z-index:auto`, DOM order determines paint order — the scrim was painted *underneath* the laptop's fully-opaque base/lid material, fully occluded, with **zero visual effect over the laptop shape itself** (only over the empty viewport space around it, which was already near-black via the body background). This was inert even before this change; it becomes actively relevant now that bright light layers sit on that same material. Fixed by moving the scrim to render *after* the scene (regression test added: scrim's DOM index > scene's DOM index, i.e. paints on top).
- [x] 6.2 Computed a worst-case bound rather than assuming: 80% opacity `zinc-950` (~`#09090b`) composited over even a hypothetical *pure white* background (strictly more extreme than anything the gradients actually produce) yields ≈rgb(58,58,60) — right at the edge of the `zinc-400` paragraph text's own AA contrast budget (≈57) and comfortably clear of the near-white heading's budget (≈108). Real composited brightness is well below that bound in every actual case (peak gradient alphas are 0.3–0.85 over already-dark zinc material, never pure white). Left opacity unchanged at 80% rather than loosening it speculatively — per design.md's explicit rule, contrast wins over the visual when they conflict. Final visual balance (does 80% feel too heavy now?) is a Step 11 real-browser call, not a contrast-safety one.
- [x] 6.3 `accessibilityStructure.test.tsx` and `focusVisibility.test.tsx`: 9/9 pass. The laptop layer is still `aria-hidden="true"` with no semantic content (unchanged from before this change — the scrim reorder and all light layers are inside the already-`aria-hidden` layer).

Full suite: `npx vitest run` — 74 files / 373 tests, one pre-existing `ChatWidget.test.tsx` timing flake (confirmed passes in isolation, unrelated to this change). `npx tsc --noEmit` clean.

## 7. Confirm all prior hero behavior is preserved

- [x] 7.1 Confirmed unchanged by grep: `CLOSED_LID_ROTATE_X=-170`/`OPEN_LID_ROTATE_X=0` over `[0, 0.85]`, `ANGLED_ROTATE_Y=-35`/`FRONT_ROTATE_Y=0` and `ANGLED_ROTATE_Z=-8`/`FRONT_ROTATE_Z=0` over `[0, 1]` — none of these constants or their input ranges were touched in Steps 1–6; the new `openness`/`specularX` transforms reuse the same `scrollYProgress` and ranges without altering them. Terminal content pipeline and `hidden sm:flex` gating verified passing in every test run through Steps 1–6.
- [x] 7.2 **Resolved in Step 11 with real evidence, not a guess.** Analytical prediction (see the earlier note in this row's history) was confirmed empirically: in a real browser, all four of light ⑤'s DOM elements had their `opacity` forced to `0` via injected CSS (`!important`) and the result screenshotted, then restored and re-screenshotted, at two scroll positions — 0.6 (representative mid-open pose, wash-lit opacity ≈0.65 at that point) and 1.0 (its own peak, opacity = 1). **Both before/after comparisons produced visually identical screenshots.** Per the delta spec's own instruction, ⑤ was removed rather than shipped as a dead layer: its 4 DOM elements, 2 `useTransform` intensities, 2 gradient constants, 2 marker classes, and 2 `<noscript>` CSS rules were deleted from `HeroLaptop.tsx`/`HeroShellStyles.ts`; its 2 test assertions and the "five-light" test description were updated to "four-light" in `HeroLaptop.test.tsx`; the delta spec's lighting requirement and "Illumination responds to orientation" scenario, `proposal.md`'s light table, and `design.md`'s Decision 2 table were all amended to match (design.md Decision 8 documents the full finding). Rim (①) was NOT removed — it remains on all three surfaces and was clearly visible in the same browser session (a faint but real diagonal highlight along the closed lid's edge, and a strong highlight along the keyboard's top edge when opening).

## 8. Review and Update Existing Unit Tests (MANDATORY)

- [x] 8.1 Audited all 6 pre-existing `HeroLaptop.test.tsx` assertions: none reference the old single-element lid or the emerald literal — all query by `data-testid` (scene/lid/screen/keyboard/trackpad/lid-accent/layer), which stayed stable across the lid restructure since those elements still exist, just nested one level deeper inside the new face containers
- [x] 8.2 Searched the whole repo for `hero-laptop`/`HeroLaptop` references outside the component's own files: only `app/admin/layout.test.tsx` matched, and it asserts the *absence* of `hero-laptop-layer` (a testid never renamed) — no incidental coupling found in `CareerTimeline`/`ChatWidget`/SSR tests
- [x] 8.3 No assertion was weakened. The one place matching strategy changed (the accent-token test) was to work around jsdom's own `rgba()` serialization of 8-digit hex+alpha — RGB-triplet matching is more precise than substring matching, not looser

Full suite: `npx vitest run` — 74 files / 373 tests, same pre-existing `ChatWidget.test.tsx` flake (unrelated, passes in isolation).

## 9. Run Unit Tests and Verify State (MANDATORY)

- [x] 9.1 Targeted tests: `npx vitest run components/HeroLaptop.test.tsx components/HeroFramer.test.tsx` — 20/20 pass
- [x] 9.2 Full suite: `npx vitest run` — 74 files / 373 tests pass (the intermittent `ChatWidget.test.tsx` flake, confirmed unrelated in Steps 3/6/8, did not recur on this run)
- [x] 9.3 `npx tsc --noEmit` clean
- [x] 9.4 `npm run validate:content` clean
- [x] 9.5 `npm run lint` fails on a pre-existing, repo-wide condition (no `eslint.config.js` exists at all in this repo) — unrelated to this change, matches the precedent in `openspec/changes/archive/2026-07-24-hero-laptop-visual-fidelity/tasks.md` step 5.4
- [x] 9.6 Database state verification: **N/A** — no backend/database in this repo (CLAUDE.md §9); only presentational components touched. Recorded in the report
- [x] 9.7 Report created: `openspec/changes/hero-laptop-cinematic-lighting/reports/2026-08-13-step-9-unit-test-and-state-verification.md`
- [x] 9.8 Complete — tests pass, report exists

## 10. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [x] 10.1 **N/A** — this change adds no endpoint and touches no API route. Rationale recorded in the Step 11 report.

## 11. E2E / Browser Testing (MANDATORY - AGENT MUST EXECUTE)

- [x] 11.1 Started `npm run dev`, drove it with `mcp__claude-in-chrome` tools (real Chrome, not a simulator)
- [x] 11.2 Verified on load at 1440×900: laptop closed, cropped off-axis in the bottom-right, rim visible as a faint edge highlight, no screen spill. **Found and fixed a real regression while doing this**: the off-axis hero copy (Step 5.3) collided with `CareerTimeline`'s pre-existing fixed left rail (`md:fixed md:left-4`, measured right edge at x=176px) — the H1 started at x=64px, a 112px overlap, confirmed both visually and via `getBoundingClientRect()`. Fixed by adding `md:pl-56` to `heroWrapperClass` (only at `md:`, matching where the rail itself goes fixed; `sm:pl-16` alone is fine below that since the rail is in normal flow there).
- [x] 11.3 Scrolled through the full document at multiple positions (0.3, 0.6, 1.0 progress): rim strongest near closed, screen spill/bloom absent when closed and building as the lid opens, keyboard detail and specular highlight clearly visible mid-scroll, terminal fully legible at full scroll. **Found and fixed a second real regression**: the terminal text rendered as `rgb(237,237,237)` (inherited body foreground), not sapphire — `getComputedStyle` confirmed zero effect from the `text-[${heroLaptopAccentHex}]` Tailwind class. Root cause: Tailwind's JIT scanner only sees literal text in source files, so a class name built via JS template-literal interpolation never gets a CSS rule generated — the className string was correct, the rendered color was not. Fixed by applying `heroLaptopAccentHex` as an inline `style.color` on the terminal instead (matching every other light in the rig), verified via `getComputedStyle` returning `rgb(77, 130, 189)` after the fix.
- [ ] 11.4 **Not achievable with the available tooling** — `prefers-reduced-motion` is read via `window.matchMedia` at component mount; overriding it requires either real OS-level media emulation or CDP's `Emulation.setEmulatedMedia`/script-injection-before-load, neither exposed by the browser automation tools available in this session. Covered instead by 15 passing unit tests in `HeroLaptop.test.tsx` that assert the exact static open-pose value for every light under `prefers-reduced-motion: reduce`, using the same `prefersReducedMotion ? constant : motionValue` mechanism already proven in production by the accepted JOS-90/JOS-92 changes.
- [ ] 11.5 **Not achievable with the available tooling**, same reason as task 3.1's no-JS half: no exposed way to disable JavaScript for a single navigation in this session's browser tools. The `<noscript>` CSS override (extended with 5 light-specific rules) follows the identical pattern already shipped and visually verified for the scene/lid/screen in JOS-90.
- [x] 11.6 Verified at 390×844 (mobile): no laptop, no lighting, hero text centered and fully readable. Re-verified after the geometry re-tuning in task 5.4 to confirm the change didn't affect mobile (it doesn't — the layer is `hidden sm:flex` regardless of the `sm:` size values).
- [ ] 11.7 **Not achievable with the available tooling** — no CPU/frame profiling capability exposed by the browser automation tools in this session (no DevTools Performance panel access). Static verification stands in its place: every animated property across all 8 light layers is `opacity` and (for the specular sweep) `x`/`translateX` only — enforced by a unit test (`el.style.filter/boxShadow/backgroundPosition` all assert `""`) and confirmed by source review of every `style={{...}}` object in `HeroLaptop.tsx`. No new `will-change`, no new scroll listener (verified in 7.1).
- [x] 11.8 Screenshots captured throughout (load, mid-scroll, full-scroll, mobile, before/after for both regressions found) — available in this session's tool-call history.
- [x] 11.9 Report created: `openspec/changes/hero-laptop-cinematic-lighting/reports/2026-08-13-step-11-browser-verification.md`

## 12. Performance budget check

- [x] 12.1 `npm run build` (Turbopack) succeeds. First Load JS confirmed via a **same-day delta measurement** (`next build --webpack`, matching README's established methodology, run once on this branch and once on `main` via `git stash`): the shared/vendor chunks (`framework`, `main-app`, `polyfills`, `webpack` runtime, plus two numbered framework chunks) are **byte-identical hashes on both branches**, proving no new dependency. Only the route's own `layout`/`page` chunks differ: baseline 7833 bytes gzip → this branch 9204 bytes gzip, a **+1.33 KB gzip delta** — for 8 new light layers, the two-faced lid restructure, and a shared accent token, well within the README's ~160 KB regression ceiling. (Note: an absolute full-bundle measurement attempted first came to ~152–191 KB depending on which shared chunks were included, well above the 3-week-old recorded ~123 KB baseline; likely dependency/toolchain drift unrelated to this change, not something this delta measurement depends on — the delta is computed identically on both sides of the same build.)
- [x] 12.2 CSP confirmed untouched: `git diff --stat main -- lib/security/config.ts next.config.ts` shows zero changes. No new network request: `grep` for `http://`/`https://`/`url(` across all four changed component files returns nothing — every gradient and color in the lighting rig is an inline CSS value, no external resource.
- [x] 12.3 Ran Lighthouse (`npx lighthouse`, v13.4.1) against `next start` production build. **Desktop:** Performance 100, Accessibility 100, Best Practices 100, SEO 100, LCP 0.6s — an exact match to the README's recorded 2026-07-23 baseline, zero regression. **Mobile:** Performance 96, Accessibility 100, Best Practices 100, SEO 100, LCP 2.9s, TBT 40ms, CLS 0 — clears the ≥90/<4s targets comfortably (the README's own recorded mobile baseline was a "near-miss" at 86–87/4.1s; this run clears it, though the improvement may reflect environment/Lighthouse-version differences rather than this change, so it's reported as "no regression," not claimed as an intentional fix).

## 13. Update Technical Documentation (MANDATORY)

- [x] 13.1 **N/A, confirmed by grep** — `CLAUDE.md` contains zero references to "hero" or "laptop" anywhere; it never described the hero's internal architecture (§9's "Architecture" bullets cover content/schema/validation modules and `CareerChapters.tsx` specifically, not the hero). Nothing to update.
- [x] 13.2 Confirmed still holds, directly by this change's own Step 12 measurements: Lighthouse ≥90 (100/100/100/100 desktop, 96/100/100/100 mobile — PRD.md §9's "Performance" bullet); LCP <2.5s desktop / <4s mobile (0.6s / 2.9s measured); 60fps via transform/opacity-only (verified by property audit + unit test); "motion library loaded lazily" (the `MotionProvider→framer-motion` chunk hash is byte-identical to `main`, confirming it's untouched); CSP headers (`lib/security/config.ts` diff is empty vs `main`). Nothing in §9 is stale or contradicted.

## 14. OpenSpec sync

- [x] 14.1 After merge, sync `specs/hero-signature-motion/spec.md` into `openspec/specs/hero-signature-motion/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
