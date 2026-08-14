## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Created `feature/ambient-sparkle-layer` from post-JOS-109 `main` (commit `61c9ca6`)
- [x] 0.2 Verified: `git branch --show-current` → `feature/ambient-sparkle-layer`. (Caught and fixed a real mistake here: the branch was initially cut from a *stale* local `main` that still lacked JOS-109's merge, since `git fetch` alone doesn't fast-forward the local branch — several JOS-109 files briefly reverted. Fixed by fast-forwarding local `main` to `origin/main` and rebasing this branch onto it before any implementation began.)
- [x] 0.3 Confirmed — JOS-108 merged via PR #44 (`00ce6e7`). `--accent` token confirmed present in `app/globals.css`
- [x] 0.4 Confirmed JOS-107 has **not** merged (no matching commit in `git log --all`, and `openspec/specs/performance-budget-compliance/spec.md`'s "Animations sustain 60fps" requirement still reads the pre-JOS-107 text). Read JOS-107's own spec delta directly (`git show chore/site-wow-factor-specs:openspec/changes/narrow-performance-budget/specs/performance-budget-compliance/spec.md`): it ADDs a Worker-bundle-size requirement and REMOVEs three others (Lighthouse, LCP, JS budget) — it never touches "Animations sustain 60fps" at all. This change's broadening delta to that one requirement applies cleanly regardless of merge order; no conflict, no silent-revert risk

## 1. The canvas layer and its stacking position (AC: "renders above the hero scrim")

- [ ] 1.1 Add failing tests: the ambient layer exists, is `aria-hidden`, is not focusable, does not intercept pointer events, and contains no text
- [ ] 1.2 Add a failing test asserting the layer paints **after** the hero scrim and **before** page content — the same DOM-order/stacking check used for the scrim fix in JOS-105
- [ ] 1.3 Build the layer as its own fixed element between the hero laptop layer and the page content — **not** inside the hero layer. Placing it under the scrim cuts its contribution from +221 to +43 levels over the background (design.md Decision 2)
- [ ] 1.4 Mount it in `app/(marketing)/layout.tsx` only. **Not** in `app/admin/layout.tsx` — `app/admin/layout.test.tsx` asserts the admin area is free of marketing chrome

## 2. Particle simulation (AC: "An ambient decorative motion layer runs behind the page content")

- [ ] 2.1 Add failing tests for the simulation module's pure logic — particle initialisation and per-step position update — kept separate from the rendering so it is testable without a canvas
- [ ] 2.2 Implement the field on a single `<canvas>` with `globalCompositeOperation = "lighter"` for additive glow. **One canvas, not N DOM nodes** — 200 animated elements would mean 200 style recalcs per frame, the exact layout-thrash the 60fps requirement exists to prevent (design.md Decision 1)
- [ ] 2.3 Derive the particle colour from the shared accent token; do not introduce a second colour value (design.md Decision 7 — JOS-105 shipped a duplicated accent that silently rendered nothing)
- [ ] 2.4 Handle canvas sizing and `devicePixelRatio` so the field is not blurry on high-DPI displays, and re-size on viewport resize

## 3. Reduced motion — static, not slower (AC: "does not move under reduced motion")

- [ ] 3.1 Add failing tests: under `prefers-reduced-motion: reduce` no positional update occurs and no animation loop is started
- [ ] 3.2 Implement the static branch — render the field once, optionally fade in, never update positions. Use the existing `prefersReducedMotion ? … : …` pattern from `HeroLaptop.tsx`/`HeroFramer.tsx`
- [ ] 3.3 Confirm the still field is rendered rather than nothing at all — "renders nothing" and "failed to initialise" are indistinguishable, which makes the compliant state look like a bug (design.md Decision 3)
- [ ] 3.4 Verify this satisfies `accessibility-compliance`'s site-wide rule: "no movement-based animation plays; only opacity/fade transitions remain"

## 4. Lifecycle — the substance of this change (AC: "stops when it is not visible")

- [ ] 4.1 Add failing tests for all three stop conditions: document hidden, layer scrolled out of view, component unmounted
- [ ] 4.2 Stop the loop on `visibilitychange` when the document is hidden; resume when visible
- [ ] 4.3 Stop the loop when the layer leaves the viewport (an `IntersectionObserver` is the natural fit — `CareerTimeline` already establishes the pattern in this codebase); resume on re-entry. **Browser rAF throttling does not cover this case** — a layer three screens up is fully visible to the browser's heuristics while invisible to the visitor (design.md Decision 4)
- [ ] 4.4 Cancel the animation frame and remove every registered listener on unmount; assert no callback or listener survives
- [ ] 4.5 Confirm "throttled" is not mistaken for "stopped" — the requirement is that the loop stops

## 5. Viewport and no-JS gating (AC: "omitted on small viewports and without JavaScript")

- [ ] 5.1 Add failing tests: the layer does not render below the `sm` breakpoint and starts no loop there
- [ ] 5.2 Gate the layer to `sm` and up, matching the hero laptop's existing `hidden sm:flex` (design.md Decision 5)
- [ ] 5.3 Confirm no-JS behaviour: the canvas renders nothing and every piece of page content remains readable and complete without it

## 6. Review and Update Existing Unit Tests (MANDATORY)

- [ ] 6.1 Review `accessibilityStructure.test.tsx` — a new always-present layer must not affect landmark or heading structure
- [ ] 6.2 Review `app/admin/layout.test.tsx` — confirm the ambient layer does not leak into `/admin`
- [ ] 6.3 Review `HeroLaptop.test.tsx`'s scrim stacking assertion — the new layer sits adjacent to that stack and must not disturb the scrim-above-scene ordering it locks in
- [ ] 6.4 Confirm no test was weakened to pass

## 7. Run Unit Tests and Verify State (MANDATORY)

- [ ] 7.1 Run targeted tests for the changed modules
- [ ] 7.2 Run the full suite: `npx vitest run`
- [ ] 7.3 Run `npx tsc --noEmit` clean
- [ ] 7.4 Run `npm run validate:content` clean
- [ ] 7.5 Run `npm run lint` (pre-existing repo-wide ESLint config failure — no `eslint.config.js`; skip with the same rationale as prior stories)
- [ ] 7.6 Database state verification: **N/A** — no backend/database in this repo (CLAUDE.md §9). Record the rationale in the report
- [ ] 7.7 Create report `openspec/changes/ambient-sparkle-layer/reports/YYYY-MM-DD-step-7-unit-test-and-state-verification.md`

## 8. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [ ] 8.1 **N/A** — no endpoint or API route is touched. Record the rationale in the Step 9 report

## 9. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

- [ ] 9.1 Start the dev server and drive a real browser — this effect cannot be judged from unit tests at all
- [ ] 9.2 **Verify the particles read as light, not grey dust.** This is the whole point of the layer, and the JOS-105 precedent is directly relevant: light ⑤ was removed after an A/B toggle showed it invisible under the scrim. Do the same A/B here — toggle the layer's opacity to 0 and back, and confirm the difference is obvious
- [ ] 9.3 Verify the field reads as atmosphere rather than noise over text-heavy sections; be willing to reduce count and brightness well below what looks good in isolation (design.md Risk 1)
- [ ] 9.4 Verify the particles do not fight the hero laptop for attention (design.md Risk 2)
- [ ] 9.5 Verify the loop actually stops: hide the tab and confirm no frames are drawn; scroll the layer out of view and confirm the same. **Verify it is stopped, not merely throttled**
- [ ] 9.6 Verify at a small viewport that the layer is absent and no loop runs
- [ ] 9.7 Verify under `prefers-reduced-motion` if achievable with the available tooling; if not, document the limitation and the substitute unit-test coverage, per the precedent in JOS-105's Step 11 report
- [ ] 9.8 Profile the animation and confirm per-frame work stays within a 60fps budget, or document why a representative profiling run was not achievable
- [ ] 9.9 Capture before/after screenshots and, if possible, a short capture — a still image cannot show ambient motion
- [ ] 9.10 Create report `openspec/changes/ambient-sparkle-layer/reports/YYYY-MM-DD-step-9-browser-verification.md`, including the curl N/A rationale

## 10. Build sanity (NOT a performance gate — owner decision 2026-08-13)

- [ ] 10.1 Run `npm run build` and confirm it succeeds
- [ ] 10.2 Confirm no new dependency and no new network origin
- [ ] 10.3 Confirm nothing was added to the Cloudflare Worker bundle — this is client code and ships as a static asset, but re-measure given JOS-106's tight ceiling

## 11. Update Technical Documentation (MANDATORY)

- [ ] 11.1 Update `CLAUDE.md` §9 if the architecture description needs the ambient layer
- [ ] 11.2 Record the "above the scrim, never below" constraint somewhere a future implementer will encounter it before repeating the mistake

## 12. OpenSpec sync

- [ ] 12.1 After merge, sync `specs/site-ambient-motion/` and `specs/performance-budget-compliance/` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`). **Verify the 60fps requirement's final text is the broadened one** and was not reverted by JOS-107's sync (task 0.4)
