## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 PR #56 (JOS-121) was already merged (squash). **Found a real problem**: `git pull` on local `main` failed with "divergent branches" — local `main` had a `Sync and archive origins-earlier-career` commit (`867a6a5`) that was not an ancestor of `origin/main`'s squash-merge commit (`1f4806b`, parented on `c2e0df0`). Verified `867a6a5`'s content was already fully contained in `1f4806b`'s tree (checked the archived origins-earlier-career files exist in `origin/main`) before doing anything destructive — confirmed no data loss, then `git reset --hard origin/main` to properly sync local `main`, and branched `feature/mobile-motion-parity` from that
- [x] 0.2 `git status --short` on the new branch shows only the three known untracked files (`dplyprod.sh`, this change's own artifacts, `project-evidence-and-technical-depth/`) — no unrelated tracked work carried in

## 1. Invert the gate tests (TDD — red first)

These four tests encode the behaviour being reversed. Three flip; one is kept and reworded. Do this before touching any style file, so the gates' removal is what turns them green.

- [x] 1.1 `components/HeroLaptop.test.tsx:106` inverted — asserts no `hidden`/`sm:flex`, has `flex`; renamed
- [x] 1.2 `components/HeroLaptop.test.tsx:~300` — flipped the assertion and rewrote the comment (no longer cites the removed AC)
- [x] 1.3 `components/AmbientSparkleLayer.test.tsx:632` inverted — asserts no `hidden`/`sm:block`, has `block`; renamed
- [x] 1.4 `components/AmbientSparkleLayer.test.tsx:637` kept exactly, reworded name/comment only
- [x] 1.5 **Found and fixed a fifth pinned test not enumerated in this task list**: `HeroFramer.test.tsx`'s existing "anchors the name/positioning copy to a left column on sm+ viewports" asserted `sm:items-start`/`sm:text-left` presence — this would have broken once Decision 1 moved those to base, unnoticed until Task Group 3. Rewrote it in place (asserting base `items-start`/`text-left`, absence of the `sm:`-prefixed forms, and that `sm:pl-16`/`sm:pr-16` stay scoped) rather than adding a near-duplicate new test — this single edit satisfies both the fix and this task
- [x] 1.6 Added `HeroLaptop.test.tsx`: "crops the scene at every viewport width via a base bleed offset" — checks for *some* unprefixed `-m[rb]-\d` class, not a specific value (the value is Task Group 7's to tune against a render)
- [x] 1.7 Ran all 4 touched files: **5 fail red** (the 3 inverted + 2 new/fixed), exactly as expected; the kept zero-size test (1.4) passes both before and after, confirmed in the same run

## 2. Remove the two viewport gates

- [x] 2.1 `heroLaptopLayerClass`: `hidden`/`sm:flex` dropped, now unconditional `flex`; comment rewritten to explain the removal and point at where the mobile composition actually lives
- [x] 2.2 `ambientSparkleLayerClass`: `hidden`/`sm:block` dropped, now unconditional `block`; comment rewritten
- [x] 2.3 `isGatedOff()`'s comment rewritten (was factually false the moment the CSS gate was removed); function itself untouched
- [x] 2.4 Confirmed: all 4 gate-inversion tests (1.1–1.4) pass. Only the new bleed-offset test (1.6) still fails red, exactly as expected — that's Task Group 4's job

## 3. Hero copy alignment (Decision 1)

- [x] 3.1 `heroWrapperClass`: `items-start`/`text-left` moved to base; `sm:pl-16 sm:pr-16` left scoped; `justify-center` (identical at both breakpoints in the original, never actually toggled) kept unconditional
- [x] 3.2 Comment rewritten — no longer explains alignment via the laptop's absence, since that premise no longer holds
- [x] 3.3 `HeroFramer.test.tsx`: 8/8 pass, including the rewritten alignment test

## 4. Laptop mobile framing (Decision 2)

- [x] 4.1 `heroLaptopSceneClass` gains `-mr-2 -mb-3` at base, scaled roughly proportional to the smaller mobile laptop size — starting point, tuned for real in Task Group 7
- [x] 4.2 Comment records the "why": cropping isn't decorative, it's what prevents the small-centered-thumbnail read and hides grazing-angle 3D artifacts, at any size
- [x] 4.3 `HeroLaptop.test.tsx`: 19/19 pass
- [x] 4.4 **Decision 5 (found via owner sign-off on the Task Group 7 render, not pre-planned)**: lighten the closed-pose material at base only — `heroLaptopBaseClass`'s border/gradient, `heroLaptopLidClass`'s border, and `heroLaptopLidFaceOuterClass`'s gradient each gain a `sm:`-scoped pair matching their prior unscoped value exactly, with a one-step-lighter base value. Zero change to any `sm:`-and-above rendering
- [x] 4.5 Re-run `HeroLaptop.test.tsx` — no test asserts the literal zinc-shade classes, so this is a pure addition; confirm still 19/19
- [x] 4.6 Re-verified live at the narrow viewport (500×701): the closed pose now shows a clearly defined lighter-gray laptop shape with visible edges (`screenshot-1788237823956-15.jpg`), a material improvement over the prior near-invisible read. Desktop re-screenshotted at the same hero position — pixel-identical to the pre-Decision-5 desktop screenshot, confirming zero regression (the `sm:`-scoped values restore the exact original desktop material)

## 5. Review and Update Existing Unit Tests (MANDATORY)

- [x] 5.1 `HeroLaptop.test.tsx` (19), `HeroFramer.test.tsx` (8) run; no `HeroLaptop.ssr.test.tsx` exists in this repo (confirmed, not skipped)
- [x] 5.2 `accessibilityStructure.test.tsx` and `palette.test.tsx` run in the same pass
- [x] 5.3 `git diff --stat` on all touched test files: 53 insertions / 20 deletions across 3 files — additive; every deletion paired with a stronger, more specific replacement (verified individually in Task Groups 1–4)
- [x] 5.4 Combined run: 5 files, 91/91 pass, no flake this run. The known `ChatWidget.test.tsx` flake is untouched by this change (that file isn't part of it) and wasn't run here

## 6. Run Unit Tests and Verify State (MANDATORY)

This repo has no database; content/index integrity is the equivalent state to verify.

- [x] 6.1 Pre-test baseline: `validate:content` clean; chunk count **91**
- [x] 6.2 Targeted tests (5 files): 91/91 pass
- [x] 6.3 Full suite run ×2: 648/649 pass both times, same single known flake (`ChatWidget.test.tsx`, unrelated file), confirmed passing in isolation
- [x] 6.4 `npx tsc --noEmit` clean
- [x] 6.5 Post-test chunk count: **91**, unchanged; `validate:content` re-run clean
- [x] 6.6 Report written: `2026-09-01-step-6-unit-test-and-state-verification.md`
- [x] 6.7 Confirmed complete

## 7. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

The substance of this change is visual and mobile-only. Unit tests can prove the gates are gone; they cannot prove the result is any good.

- [x] 7.1 Started a fresh dev server, confirmed serving the current build before driving the browser
- [x] 7.2 Desktop (~1232px): confirmed no regression via screenshot — laptop still crops off-axis, lighting rig intact, constellation unchanged
- [x] 7.3 Narrow viewport (~500×701, via the create-tab → resize → navigate workaround): confirmed both gates are gone in the live DOM (`heroLaptopLayerClass`/`ambientSparkleLayerClass` carry no `hidden`/`sm:*`), both layers have real non-zero geometry, and the ambient canvas has 68,375 non-zero-alpha pixels (genuinely painting)
- [x] 7.4 Scrolled the full hero range at narrow width and confirmed the laptop animates — lid `rotateX` -170deg→0, body `rotateY`/`rotateZ` -35/-8deg→0, terminal opacity 0→1, all monotonic across 10 sampled scroll positions. **Found and worked around a real methodological trap first**: `window.scrollTo()` alone does not trigger the app's Framer Motion scroll listener in this environment (7 samples across the full range were byte-identical, on both tabs) — real wheel-driven scroll via the `computer` tool's `scroll` action does. Documented in the Step 7 report so this isn't rediscovered the hard way again
- [x] 7.5 Confirmed the constellation renders and links at narrow width; derived particle count = 40 (the `[40, 260]` clamp's floor, for a 339,985px² narrow-viewport area)
- [x] 7.6 **Tuned the base bleed offset (Decision 2 / Open Question 1)**: verified the existing `-mr-2 -mb-3` against real rendering (22px inset from the layer's right edge, 29px cropped past the viewport bottom) — reads as cropped/corner-anchored, not a small contained object. No change needed; this value is now the tuned value, not just a starting point
- [x] 7.7 Confirmed hero copy is left-anchored, legible, and not cramped at narrow width (Decision 1) — no overlap with the laptop at any sampled scroll position. No new contrast measurement needed; the change didn't touch ink tokens or the scrim, only which breakpoint the alignment classes apply at
- [x] 7.8 Confirmed no horizontal overflow: `scrollWidth` (485) ≤ `innerWidth` (500) on the narrow tab
- [x] 7.9 **Environment limitation, documented rather than tested**: this session drives a resized desktop Chrome window with no real collapsing mobile address bar. No jump observed, but that isn't equivalent to a real-device check — Decision 3's open question stays open; no `dvh`/`svh` change made
- [x] 7.10 **Environment limitation** (established across three prior changes): no `prefers-reduced-motion` emulation available. Not independently re-verified visually; rests on the passing `HeroLaptop.test.tsx`/`AmbientSparkleLayer.test.tsx` reduced-motion assertions, unaffected by this change
- [x] 7.11 Verified the canvas's visibility-based stop condition: with the tab genuinely backgrounded (`document.hidden === true`), a `requestAnimationFrame` probe measured 0 calls over 600ms. Note: the layer is `fixed inset-0` (always positionally in-view), so its real stop conditions are tab-visibility/reduced-motion, not scroll position — the resume-on-refocus half couldn't be cleanly re-triggered via this tooling's tab-click (partial verification; covered by unit tests for the app-logic half)
- [x] 7.12 Screenshots captured and saved to disk (desktop + narrow, both layers visible) — 5 files, paths recorded in the Step 7 report
- [x] 7.13 Report written: `2026-09-01-step-7-browser-verification.md`

## 8. Performance verification (MANDATORY — the risk this change takes on)

- [x] 8.1 Attempted a live rAF-timing profile of the laptop's scroll animation at narrow width — see 8.3 for why this could not be completed. By construction (unchanged `HeroLaptop.tsx`), every animated property is `rotateX`/`rotateY`/`rotateZ`/`opacity`/`x` — compositor-only, no layout/paint triggered
- [x] 8.2 Attempted a live rAF-timing profile of the canvas field at narrow width — see 8.3. `lib/particles/simulation.ts` is byte-identical to `main`; an existing production measurement (75fps/13.3ms, `ambient-constellation-links`) already covers this exact code path at the `sm` boundary this change removes
- [x] 8.3 **Genuine environment limitation hit and documented, not a tooling inconvenience**: `document.hidden`/`visibilityState` read `true`/`"hidden"` on both open tabs throughout this session (the automation window is never the OS-frontmost window), which means the app's own `shouldRun()` visibility gate (correctly, by design — see Task 7.11) suppresses its `requestAnimationFrame` loop the entire time, making rAF-based frame timing structurally unmeasurable here. No CDP Performance/Tracing domain was available as an alternative. Documented plainly as a non-measurement in the Step 8 report, not implied as a pass
- [x] 8.4 No visual jank observed across ~20 real screenshots taken during active scrolling in Step 7 — nothing met the "frame rate visibly suffers" bar, so Open Question 3 (thinning the lighting rig) stays closed, correctly
- [x] 8.5 Findings recorded in `2026-09-01-step-8-performance-verification.md`

## 9. Build sanity

- [x] 9.1 `npm run build` succeeds — prebuild chain (91 chunks embedded, index published, site config, OG image) then `next build` compiled clean, TypeScript clean, all 10 routes generated
- [x] 9.2 Confirmed no dependency change: `git diff main --stat -- package.json package-lock.json` is empty
- [x] 9.3 Re-measured via `npx opennextjs-cloudflare build` + `npx wrangler deploy --dry-run`: **1524.04 KiB gzip**, essentially flat against the 1524.06 KiB baseline (JOS-121) — as expected, since this change adds no asset, no dependency, and no bundled content

## 10. Update Technical Documentation (MANDATORY)

- [x] 10.1 Updated `AGENTS.md` §9 (new bullet after the `ambient-constellation-links` entry): both layers now render at all viewport widths; the `hidden sm:*` gates were removed deliberately and should not be reinstated as a performance reflex — pointed at the existing viewport-derived levers to use instead if a real problem surfaces
- [x] 10.2 Recorded the base bleed offset's load-bearing rationale, with the actual measured numbers from Task 7.6 (22px/29px)
- [x] 10.3 Recorded that `isGatedOff()` survives with a rewritten rationale (standalone zero-size guard, not a breakpoint proxy)
- [x] 10.4 Recorded that Decision 3 was left unresolved by live-device evidence (environment limitation, Task 7.9) — no viewport-unit change made; the open question stays open and is called out as still open, not silently closed
- [x] 10.5 Edited `AGENTS.md` directly; confirmed `readlink CLAUDE.md` still resolves to `AGENTS.md` and both files have identical line counts (596) after the edit

## 11. OpenSpec sync

- [ ] 11.1 **After merge**, sync both delta specs into `openspec/specs/`. `site-ambient-motion` carries a RENAMED **and** a MODIFIED operation on the same requirement — apply the rename first, then the body edit, or the MODIFIED header will not match
- [ ] 11.2 Verify `hero-signature-motion` no longer contains "The laptop effect is simplified on small viewports", and that its off-axis requirement's scenarios carry no `sm`-breakpoint scoping
- [ ] 11.3 Verify `site-ambient-motion`'s no-JS guarantee survived the edit unchanged — it is unrelated to viewport width and must not be collateral damage
- [ ] 11.4 Run `openspec validate mobile-motion-parity --type change --strict`, and `--type spec --strict` against both edited specs
- [ ] 11.5 Archive this change (per CLAUDE.md §10 / `opsx:archive`)
- [ ] 11.6 Comment on JOS-122 in Linear with what shipped, the tuned bleed value, and how Decisions 1–3 actually resolved against the rendered result
- [ ] 11.7 **Owner sign-off on the mobile render before archiving.** Decisions 1 and 2 are aesthetic judgements; the DoD requires they be seen, not just described
