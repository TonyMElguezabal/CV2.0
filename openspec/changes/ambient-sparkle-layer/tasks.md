## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Created `feature/ambient-sparkle-layer` from post-JOS-109 `main` (commit `61c9ca6`)
- [x] 0.2 Verified: `git branch --show-current` → `feature/ambient-sparkle-layer`. (Caught and fixed a real mistake here: the branch was initially cut from a *stale* local `main` that still lacked JOS-109's merge, since `git fetch` alone doesn't fast-forward the local branch — several JOS-109 files briefly reverted. Fixed by fast-forwarding local `main` to `origin/main` and rebasing this branch onto it before any implementation began.)
- [x] 0.3 Confirmed — JOS-108 merged via PR #44 (`00ce6e7`). `--accent` token confirmed present in `app/globals.css`
- [x] 0.4 Confirmed JOS-107 has **not** merged (no matching commit in `git log --all`, and `openspec/specs/performance-budget-compliance/spec.md`'s "Animations sustain 60fps" requirement still reads the pre-JOS-107 text). Read JOS-107's own spec delta directly (`git show chore/site-wow-factor-specs:openspec/changes/narrow-performance-budget/specs/performance-budget-compliance/spec.md`): it ADDs a Worker-bundle-size requirement and REMOVEs three others (Lighthouse, LCP, JS budget) — it never touches "Animations sustain 60fps" at all. This change's broadening delta to that one requirement applies cleanly regardless of merge order; no conflict, no silent-revert risk

## 1. The canvas layer and its stacking position (AC: "renders above the hero scrim")

- [x] 1.1 Added `components/AmbientSparkleLayer.test.tsx` (failing first — module didn't exist): `aria-hidden="true"`, no focusable descendants, `pointer-events-none` present, `container.textContent === ""`
- [x] 1.2 Added a DOM-order stacking test rendering `<HeroLaptop />` then `<AmbientSparkleLayer />` together (mirroring how they're actually mounted in layout.tsx) and asserting `compareDocumentPosition` shows the sparkle layer *following* the laptop layer — same technique as `HeroLaptop.test.tsx`'s own scrim-order assertion. Also asserts `-z-10` is present (matching `heroLaptopLayerClass`/`gridOverlayClass`'s convention), which is what actually guarantees normal content paints above it regardless of DOM order
- [x] 1.3 Built `AmbientSparkleLayer.tsx` + `AmbientSparkleLayerStyles.ts` as its own fixed `-z-10` element (`ambientSparkleLayerClass`), never rendered inside `HeroLaptop`
- [x] 1.4 Mounted in `app/(marketing)/layout.tsx` between `HeroLaptop` and `GridOverlay`. Confirmed `app/admin/layout.test.tsx` (which asserts marketing chrome absence) still passes unmodified — the admin layout never imports this component

## 2. Particle simulation (AC: "An ambient decorative motion layer runs behind the page content")

- [x] 2.1 Added `lib/particles/simulation.ts` (`createParticles`/`stepParticles`, normalized `[0,1)` coordinates, no canvas dependency) and `lib/particles/simulation.test.ts` (9 tests: count, bounds, determinism, velocity-based advancement, boundary wrap, immutability, deltaSeconds=0 no-op). **Caught a real bug via the tests, not written after them**: the deltaSeconds=0 no-op test failed on first run — `%` is not an exact floating-point identity even for already-in-range values, so a stationary particle drifted by a float-epsilon every step. Fixed `wrap()` to skip the modulo entirely when the value is already in `[0,1)`
- [x] 2.2 Implemented on a single `<canvas>` in `AmbientSparkleLayer.tsx` with `ctx.globalCompositeOperation = "lighter"`. Verified via `AmbientSparkleLayer.test.tsx`: exactly one `<canvas>` element rendered, `fakeCtx.globalCompositeOperation === "lighter"` after mount
- [x] 2.3 Particle color derives from `heroLaptopAccentHex` via a new `hexToRgb` export added to `lib/color/contrast.ts` (extending the existing shared color module rather than duplicating the hex-parse logic) — verified by a test asserting the canvas fill call's rgba string matches `hexToRgb(heroLaptopAccentHex)` exactly, not a second hard-coded triplet
- [x] 2.4 `resizeCanvas()` reads the container's real `getBoundingClientRect()` and `window.devicePixelRatio`, sets the canvas backing-store size and `ctx.setTransform` accordingly; re-run on a `resize` listener

## 3. Reduced motion — static, not slower (AC: "does not move under reduced motion")

- [x] 3.1 Added tests in `AmbientSparkleLayer.test.tsx`'s "reduced motion" describe block: under `prefers-reduced-motion: reduce`, exactly one `clearRect` call ever happens (one static frame, never a second) and `requestAnimationFrame` is never scheduled. **Real, non-trivial bug caught here, not written after the fact**: these two tests genuinely failed on first run — traced to a framer-motion internal detail (`useReducedMotion`'s state lives in a `motion-dom` module-level singleton, initialized exactly once per process); my test file's `beforeEach` was clearing the fake `matchMedia` change-listener array, which orphaned framer-motion's own one-time-registered listener and froze reduced-motion state at whatever the very first test in the file observed. Fixed by not clearing that array (matching `HeroLaptop.test.tsx`/`HeroFramer.test.tsx`'s own setup, which never clears it either) — documented inline in the test file so a future reader doesn't reintroduce it
- [x] 3.2 Implemented the static branch in `AmbientSparkleLayer.tsx`: `shouldRun()` gates on `!prefersReducedMotion` (from framer-motion's `useReducedMotion()`, the same hook `HeroLaptop.tsx`/`HeroFramer.tsx` use), and the effect always draws one frame immediately regardless of motion preference, only conditionally scheduling the rAF loop. No fade-in implemented — design.md marks it explicitly optional
- [x] 3.3 Verified: a dedicated test confirms particles are still drawn (`fill:` calls present) under reduced motion, not an empty canvas
- [x] 3.4 Satisfied by construction: under reduced motion, positions never update after the first frame (task 3.1's assertion) — no movement-based animation plays, matching the site-wide rule verbatim

## 4. Lifecycle — the substance of this change (AC: "stops when it is not visible")

- [x] 4.1 Added tests in `AmbientSparkleLayer.test.tsx`'s "lifecycle" describe block for all three stop conditions plus their resume counterparts, using a controllable `requestAnimationFrame` mock (`pendingRafCount()`/`flushRaf()`) so "scheduled vs. not scheduled" is asserted directly rather than inferred
- [x] 4.2 Implemented via a `visibilitychange` listener toggling an `isTabVisible` flag consulted by `shouldRun()`; resumes by calling `startLoopIfNeeded()` on the same event
- [x] 4.3 Implemented via `IntersectionObserver` (same pattern `CareerTimeline.tsx` already establishes in this codebase — its own `ACTIVE_CHAPTER_ROOT_MARGIN` observer was the direct precedent), toggling `isInView`; resumes the same way on re-entry
- [x] 4.4 Effect cleanup calls `cancelAnimationFrame` (if a frame is pending), removes the `resize` and `visibilitychange` listeners, and disconnects the `IntersectionObserver`. A dedicated unmount test spies on `removeEventListener` (both `window` and `document`) and the observer's own `disconnect`, and confirms `pendingRafCount()` drops to 0
- [x] 4.5 A dedicated test asserts the loop keeps re-scheduling itself across multiple flushes while no stop condition has fired — "still scheduled" is the observable proxy for "not stopped"; the three stop-condition tests (4.1) are what prove it actually reaches 0 pending frames, not merely a longer gap between them

## 5. Viewport and no-JS gating (AC: "omitted on small viewports and without JavaScript")

- [x] 5.1 Added tests in `AmbientSparkleLayer.test.tsx`'s "viewport gating" describe block: `ambientSparkleLayerClass` contains `hidden`/`sm:block`, and — the behavioral half — no `requestAnimationFrame` is ever scheduled when the container reports zero size (mocked `getBoundingClientRect` returning `0x0`, simulating the `hidden` collapsed state)
- [x] 5.2 `ambientSparkleLayerClass = "fixed inset-0 -z-10 hidden pointer-events-none sm:block"` — matches `heroLaptopLayerClass`'s own `hidden sm:flex` gate. The component additionally derives its "gated off" check from the container's *real measured size* (`isGatedOff()`) rather than hardcoding the `640px` breakpoint a second time in JS — one source of truth (the CSS class) for both the visual gate and the loop-start gate, so they cannot drift apart
- [x] 5.3 Added `components/AmbientSparkleLayer.ssr.test.tsx` (`renderToStaticMarkup`, no hydration): confirms the server-rendered output is an empty, `aria-hidden` canvas with no text content. Unlike `HeroLaptop.tsx`, this component has no `<noscript>` override, because it has no real content that needs one — a blank canvas *is* the fully correct no-JS state for a purely decorative layer, not a degraded fallback

## 6. Review and Update Existing Unit Tests (MANDATORY)

- [x] 6.1 Extended `accessibilityStructure.test.tsx`'s composed-surfaces test to render `AmbientSparkleLayer` alongside `SiteHeader`/`HeroLaptop`/`CareerTimeline` — `axe` reports no violations (the layer is `aria-hidden` and carries no landmarks/headings, so it can't affect heading order or landmark uniqueness), and added an explicit `aria-hidden="true"` assertion on it, mirroring the existing laptop-layer check
- [x] 6.2 Added an explicit `queryByTestId("ambient-sparkle-layer")` absence assertion to `app/admin/layout.test.tsx`'s existing "no public marketing chrome" test, alongside the equivalent JOS-109 assertion for the header — locked in by a test, not left implicit
- [x] 6.3 Confirmed — `HeroLaptop.tsx` was never touched by this change; `HeroLaptop.test.tsx`'s scrim-stacking assertion (scrim paints after the scene in DOM order) passes unmodified, and this change's own stacking test (Task 1.2) only asserts the *sibling* relationship between `HeroLaptop` and `AmbientSparkleLayer`, not anything inside the laptop's own layer
- [x] 6.4 Confirmed — every change in this group added a new assertion; nothing was loosened or removed

## 7. Run Unit Tests and Verify State (MANDATORY)

- [x] 7.1 Ran targeted tests for every changed module throughout implementation (per task group), not only at the end
- [x] 7.2 Full suite: `npx vitest run` — **90 files / 463 tests passed** on the cleanest run. `ChatWidget.test.tsx`'s pre-existing `waitFor`-timing test (unrelated file, untouched by this change) flaked repeatedly across later runs; root-caused to host machine CPU contention (`uptime` showed load average 20.95, from long-running `wrangler dev`/`workerd` processes already running before this session, not started here) rather than anything in this change — full investigation in the report
- [x] 7.3 `npx tsc --noEmit` — clean
- [x] 7.4 `npm run validate:content` — clean
- [x] 7.5 `npm run lint` — same pre-existing repo-wide `eslint.config.js` gap as prior stories; skipped with the same rationale
- [x] 7.6 Database state verification: **N/A** — no backend/database in this repo (`AGENTS.md`/`CLAUDE.md` §9). Rationale recorded in the report
- [x] 7.7 Report created: `openspec/changes/ambient-sparkle-layer/reports/2026-08-14-step-7-unit-test-and-state-verification.md`

## 8. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [x] 8.1 **N/A** — no endpoint or API route is touched (a canvas particle field and a pure simulation module are all client/static). Rationale recorded in `reports/2026-08-14-step-9-browser-verification.md`

## 9. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

- [x] 9.1 Started `npm run dev` and drove real Chrome via `mcp__claude-in-chrome`
- [x] 9.2 A/B opacity toggle: obvious, immediate difference (sapphire points vs. nothing) — opposite finding from JOS-105's removed light ⑤, exactly as design.md predicted
- [x] 9.3 Verified over the career-chapters (text-heavy) section: particles stay dim, sit mostly in gutters, text always paints above the `-z-10` layer — atmosphere, not noise
- [x] 9.4 Verified: the laptop remains the visually dominant background element; particles are clearly subordinate
- [x] 9.5 **Genuine tooling limitation found and documented in depth** (report Scenario 4): this automation environment's `document.visibilityState` is permanently `"hidden"`, and — root cause — `requestAnimationFrame` never fires at all, confirmed with a bare unrelated loop (0 callbacks in 500ms). Live "stops when hidden" verification isn't achievable in the direction that matters here. Substitute: `AmbientSparkleLayer.test.tsx`'s lifecycle tests (Task Group 4), more precise than a real-browser check would be
- [x] 9.6 Verified at a real ~500×667 viewport: `display:none`, `0×0` rect, no particles rendered
- [x] 9.7 Not achievable (same root cause as 9.5 — no rAF, no media-feature emulation exposed). Substitute: `AmbientSparkleLayer.test.tsx`'s reduced-motion tests (Task Group 3)
- [x] 9.8 Real rAF profiling not achievable (same cause); worked around by timing the actual per-frame draw work synchronously 300× against the real mounted canvas: **0.343ms average, ~2% of the 16.67ms/60fps budget**
- [x] 9.9 Captured screenshots (desktop hero, A/B toggle, text-heavy scroll, small viewport) in-conversation. No GIF captured — an accurate one would show a static field given this environment's rAF suspension, which would misrepresent rather than demonstrate the feature
- [x] 9.10 Report created: `openspec/changes/ambient-sparkle-layer/reports/2026-08-14-step-9-browser-verification.md`, including the curl N/A rationale

## 10. Build sanity (NOT a performance gate — owner decision 2026-08-13)

- [x] 10.1 `npm run build` succeeds cleanly (Turbopack, TypeScript, static generation all pass; the only warning — missing `metadataBase` — is pre-existing and unrelated)
- [x] 10.2 `git diff main -- package.json package-lock.json` is empty — no new dependency. No new network origin (Canvas 2D is a browser built-in, no fetches, no assets)
- [x] 10.3 Re-measured rigorously rather than assumed: `npx wrangler deploy --dry-run` on this branch reports **Total Upload: 12728.49 KiB / gzip: 3006.83 KiB**. Stashed this change, ran the identical measurement against baseline `main` (post-JOS-109), got the **exact same figure, byte-for-byte**. Confirms zero bytes added to the Worker bundle — this change is 100% client code shipped as a static asset, exactly as proposal.md claimed. (The gap between this figure and README's earlier-recorded ~2.86 MiB is pre-existing JOS-108/109 growth, not attributable to this change — noted for whoever next re-measures, not corrected here since it's out of this change's scope)

## 11. Update Technical Documentation (MANDATORY)

- [x] 11.1 `CLAUDE.md` is a symlink to `AGENTS.md` (per §6) — edited the canonical `AGENTS.md` directly. Added a bullet documenting `AmbientSparkleLayer.tsx`, its mount position, and the lifecycle rationale. Verified via `grep -c "AmbientSparkleLayer" CLAUDE.md` that the symlink correctly reflects the change
- [x] 11.2 Recorded directly in the same `AGENTS.md` bullet, in bold, with the measured numbers (+221 vs. +43) and the direct JOS-105 precedent (light ⑤ removed for being indistinguishable under the scrim) — a future implementer moving this component will encounter the constraint and the reason for it in the same place they'd look for the component's own description, not just in `design.md`

## 12. OpenSpec sync

- [ ] 12.1 After merge, sync `specs/site-ambient-motion/` and `specs/performance-budget-compliance/` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`). **Verify the 60fps requirement's final text is the broadened one** and was not reverted by JOS-107's sync (task 0.4)
