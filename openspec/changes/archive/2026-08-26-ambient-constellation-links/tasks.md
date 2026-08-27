## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create `feature/ambient-constellation-links` from `main`, pulling first — `main` was already at `515ace9` (JOS-115 merged), branched cleanly
- [x] 0.2 Verify: `git branch --show-current` → `feature/ambient-constellation-links` — confirmed
- [x] 0.3 Confirm the baseline is green before changing anything: `npx vitest run components/AmbientSparkleLayer.test.tsx lib/particles/` — record the pass count so Task Group 9 can compare against it — **baseline: 2 files, 34/34 pass**
- [x] 0.4 No `OPENAI_API_KEY` needed — this change touches no content and requires no index rebuild or eval run

## 1. Simulation: link geometry (TDD — design.md Decision 2)

- [x] 1.1 Write failing tests in `lib/particles/simulation.test.ts` for `linkedPairs(particles, { width, height, radiusPx })`: a pair just inside the radius is returned, a pair just outside is not, and the boundary case at exactly `radiusPx` is excluded (strength would be 0 there — an invisible link is not worth stroking)
- [x] 1.2 Write a failing test proving **pixel-space, not normalized-space** geometry: on a 2:1 container, two particles separated by the same *normalized* delta horizontally vs vertically must NOT both link — the horizontal pair is twice as far apart on screen. This is the test that would fail if someone "simplifies" the projection away
- [x] 1.3 Write a failing test for monotonic falloff: `strength` decreases as separation grows and reaches exactly `0` at `radiusPx`
- [x] 1.4 Write a failing test proving `linkedPairs` returns each pair once, not twice (no `{a,b}` and `{b,a}`)
- [x] 1.5 Implement `LINK_RADIUS_PX = 160` and `linkedPairs()` in `lib/particles/simulation.ts` — pure, canvas-free, returning `{ a, b, strength }` with `strength = 1 - d²/R²` computed from **squared** distance (no `Math.hypot`, no `sqrt` — Decision 4)
- [x] 1.6 Run `npx vitest run lib/particles/simulation.test.ts` — confirm pass — 15/15

## 2. Simulation: viewport-derived particle count (TDD — design.md Decision 5)

- [x] 2.1 Write failing tests for `particleCountForArea(width, height)`: density is constant (doubling area doubles the count, before clamping), and the count is clamped to `[40, 260]` at extreme areas
- [x] 2.2 Write a failing test asserting the derived count produces the intended **mean neighbour count** — at 1440×900 the expected count is ~81, which is the arithmetic in Decision 5's table. This pins the constant to its derivation rather than to a number someone typed
- [x] 2.3 Implement `particleCountForArea()` from `PARTICLE_AREAL_DENSITY = 5 / (Math.PI * LINK_RADIUS_PX ** 2)`, expressed in terms of the target mean-neighbour count so the derivation is legible in the source, not just in design.md
- [x] 2.4 Run the simulation tests — confirm pass — 19/19

## 3. Simulation: spatial grid (TDD — design.md Decision 5)

- [x] 3.1 Write a failing **equivalence** test: over randomized particle sets and several container aspect ratios, the grid-accelerated `linkedPairs` returns a pair set identical to a naive O(n²) scan (compare as normalized sorted pairs). This is the test that protects against the two code paths silently diverging — note: this test necessarily passed trivially before 3.3's implementation, since `linkedPairs` itself *was* the naive scan at that point; it started proving something only once the grid replaced it, which the sequencing below preserves (naive reference kept as a separate, deliberately-duplicated function in the test file, never sharing code with production)
- [x] 3.2 Write a failing test covering the grid's edge cases: particles exactly on a cell boundary, at `0` and approaching `1` in normalized space, and a container so small it is a single cell
- [x] 3.3 Implement the uniform grid bucketed at cell size `LINK_RADIUS_PX`, scanning only the 9 neighbouring cells. Unconditional, not branched on particle count (Decision 5)
- [x] 3.4 Run the simulation tests — confirm pass, including that 3.1 genuinely exercises counts above the grid's break-even (~150 particles) — 24/24, 200 particles used in the equivalence test

## 4. Simulation: pointer influence (TDD — design.md Decision 6)

- [x] 4.1 Write a failing test for **frame-rate invariance**: stepping 1.0s as a single step vs. as 60 steps of 1/60s produces the same positions (within float tolerance). This is the defect in the reference implementation and the reason the easing is exponential — used a stationary particle (vx=vy=0) so the pointer's target offset is constant across sub-steps, isolating the easing math from the (unrelated) first-order Euler drift integration
- [x] 4.2 Write a failing test for the **displacement bound**: with a stationary pointer held over many steps, no particle's offset from its free-drift path exceeds the cap, and the field does not collapse to a point
- [x] 4.3 Write a failing test for **release**: with `pointer.active === false`, `stepParticles` behaves exactly as the two-argument form did — byte-identical to the pre-change behaviour, so an inactive pointer is provably free — asserted on positions (x/y) rather than full object shape, since the implementation always attaches `pointerOffsetX/Y` bookkeeping fields once a pointer object is passed at all (harmless: no existing assertion checks for their absence)
- [x] 4.4 Write a failing test that the **ease-back** is gradual: after the pointer goes inactive, displaced particles return toward free drift over multiple steps rather than snapping in one
- [x] 4.5 Write a failing test that pointer influence respects pixel-space geometry (same aspect-ratio concern as 1.2 — the influence radius must be a circle on screen)
- [x] 4.6 Confirm the existing `deltaSeconds = 0` bit-for-bit identity test still passes with the new parameter — the `wrap()` float-epsilon invariant (`simulation.ts:42-54`) must not regress — confirmed, plus a new equivalent case with an active pointer supplied
- [x] 4.7 Implement `stepParticles(particles, deltaSeconds, pointer?)` with `1 - Math.exp(-k * deltaSeconds)` easing, a displacement cap, and an inactive state. Keep the third parameter optional so existing callers and tests are unaffected — `POINTER_INFLUENCE_RADIUS_PX = 220`, `POINTER_MAX_DISPLACEMENT_PX = 24` exported as the starting-point constants design.md's Open Questions calls out for later tuning
- [x] 4.8 Run the simulation tests — confirm pass — 30/30

## 5. The contrast bound (TDD — design.md Decisions 3 and 4)

- [x] 5.1 Write a failing test in `components/palette.test.tsx` (the file that already owns "measured against the real background" assertions) proving the link peak alpha, composited **`source-over`** over `--background`, has contrast at or below `--hair`'s 3.47:1 — the palette's designated structure-not-content weight — added a shared `compositeOverBackground`/`contrastRatioRgb` pair to `lib/color/contrast.ts` as the reusable infrastructure this needed (source-over and additive/"lighter" compositing math), plus a ceiling test and an overlap-density test beyond what the task named
- [x] 5.2 Write a failing test proving the same colour composited **additively** would exceed `--ink-meta`'s 5.23:1 text floor — this is the test that documents *why* the link pass may not use `lighter`, so a future change to the composite mode fails loudly with the reason attached rather than silently brightening the layer — this one passed immediately (it doesn't depend on the not-yet-defined constant), which is correct: it's testing an independent fact, not the implementation under construction
- [x] 5.3 Export the link peak alpha as a named constant so both tests and the renderer read the same value — no magic number duplicated between them — `LINK_PEAK_ALPHA = 0.75` and `LINK_PEAK_ALPHA_CEILING = 0.79` exported from `components/AmbientSparkleLayer.tsx`, alongside the existing `ACCENT_R/G/B` constants
- [x] 5.4 Run `npx vitest run components/palette.test.tsx` — confirm pass — 16/16

## 6. Renderer: two-pass draw (design.md Decision 3)

- [x] 6.1 Write failing tests in `components/AmbientSparkleLayer.test.tsx`: the draw pass sets `globalCompositeOperation` to `"source-over"` for links and `"lighter"` for nodes, in that order, and links are stroked **before** any node is filled — extended `FakeCanvasContext` with a logging `globalCompositeOperation` setter plus `strokeStyle`/`lineWidth`/`moveTo`/`lineTo`/`stroke`; used `vi.spyOn(Math, "random").mockReturnValue(0.5)` in the stroke-ordering/colour/batching tests so all particles land at the same position, guaranteeing at least one link deterministically rather than depending on a lucky random draw
- [x] 6.2 Write a failing test that link stroke colour derives from the shared accent (`ACCENT_R/G/B`, already computed at `AmbientSparkleLayer.tsx:19`), not a second hard-coded value — mirroring the existing node-colour test at `AmbientSparkleLayer.test.tsx:220`
- [x] 6.3 Write a failing test that strokes are **batched by alpha bucket** — a bounded number of `beginPath()`/`stroke()` calls (12–16), not one per link — used the all-particles-identical setup so every link shares one bucket, proving batching produces far fewer stroke calls than the link count
- [x] 6.4 Implement the two-pass `draw()`. Restore `globalCompositeOperation` deliberately between passes rather than relying on the next frame's `clearRect` — `LINK_ALPHA_BUCKET_COUNT = 14`; links always draw first (mode set unconditionally before checking whether any pairs exist, so the ordering test doesn't depend on link presence)
- [x] 6.5 Run the component tests — confirm pass — 30/30

## 7. Renderer: area-derived count and resize hysteresis (design.md Decision 5)

- [x] 7.1 Write a failing test that the initial particle count comes from the measured container size via `particleCountForArea()`, not from a module constant
- [x] 7.2 Write a failing test for **hysteresis**: a resize changing the derived count by less than ~15% leaves existing particle positions untouched; a larger change adjusts the field. Assert positions are preserved, not just that the count is right — position preservation is the whole point — extended `FakeCanvasContext.arc()` to record its pixel-space call args; positions are compared **normalized** (dividing back out the container size at each snapshot), since raw pixel coordinates legitimately shift on resize even for an untouched particle
- [x] 7.3 Write a failing test that growth adds particles and shrinkage removes them **incrementally**, rather than reseeding the whole field
- [x] 7.4 Replace `PARTICLE_COUNT` (`AmbientSparkleLayer.tsx:18`) with the derived count; implement hysteresis in `handleResize` — `PARTICLE_COUNT_HYSTERESIS = 0.15`; below threshold the resize is ignored entirely (count and positions both untouched), at or above it particles are appended/truncated, never regenerated — this reads design.md Decision 5's "only re-seed when delta exceeds ~15%" as "only re-*derive the target count* above that threshold," since a literal full-array reseed would contradict this same task's "rather than reseeding the whole field"; no design.md conflict, just resolving the prose's looser wording in favor of the more specific task
- [x] 7.5 Confirm the existing zero-size gating test (`AmbientSparkleLayer.test.tsx:349`) still passes — a 0×0 container must derive no particles and start no loop, and must not hit the `[40, 260]` clamp's floor — confirmed passing as part of the 34/34 full-file run; note the `[40, 260]` clamp does mean 40 particles are created even at 0×0 (a fresh mount doesn't consult `isGatedOff()` before creating particles), but this is harmless — they draw to a zero-area canvas and no loop starts, which is all this test asserts
- [x] 7.6 Run the component tests — confirm pass — 34/34

## 8. Renderer: pointer listeners and reduced-motion gating (design.md Decisions 6 and 7)

- [x] 8.1 Write a failing test that a passive `pointermove` listener is registered on **`window`**, never on the layer, and that the layer keeps `pointer-events-none` (existing test at `:176` must still pass)
- [x] 8.2 Write a failing test that `pointerType !== "mouse"` events are ignored — a touch drag must not move the field — used the same `vi.spyOn(Math, "random").mockReturnValue(0.5)` stationary-particle trick as Group 6, plus manually-timed `flushRaf(0)` then `flushRaf(1000)` so a real 1-second delta reaches the easing math
- [x] 8.3 Write a failing test that `pointerleave` on the document and `blur` on the window both deactivate the pointer — two separate tests, one per event
- [x] 8.4 Write a failing test that under `prefers-reduced-motion: reduce` **no pointer listener is registered at all** — assert absence, not inertness (Decision 7). Added as its own test in the new pointer-attraction describe block rather than editing the existing reduced-motion group, to keep this change's additions visually separate from Task Group 3's pre-existing tests
- [x] 8.5 Write a failing test that the reduced-motion single static frame **includes links**, not particles alone
- [x] 8.6 Extend the existing unmount-cleanup test (`AmbientSparkleLayer.test.tsx:307`) to cover every newly registered listener — the "removes every listener it registered" guarantee must stay literally true
- [x] 8.7 Implement the listeners with cleanup, gated on `prefersReducedMotion` — pointer stored as `{x,y,active}` in normalized coordinates so it survives resize without updating; width/height read fresh from `currentSize()` at the point of use (in `loop()`) rather than cached at pointermove time, so a resize between pointer moves doesn't use a stale container size. Cleanup removal calls are unconditional (harmless no-ops when never registered) rather than mirroring the registration `if`, avoiding duplicated branching
- [x] 8.8 Run the component tests — confirm pass — 40/40

## 9. Review and Update Existing Unit Tests (MANDATORY)

- [x] 9.1 Re-read `components/AmbientSparkleLayer.test.tsx` Task Groups 1–5 and the arrival-sequence group in full; confirm each still asserts what it was written to assert and that none was weakened to accommodate this change — confirmed via `git diff --stat`: only 3 lines removed in the whole file, both `FakeCanvasContext` infrastructure upgrades (a plain `globalCompositeOperation` property became a logging getter/setter; a no-op `arc()` became a logging method with identical default behavior), not test assertions
- [x] 9.2 Re-read `components/AmbientSparkleLayer.ssr.test.tsx` — SSR output must still be an empty `aria-hidden` canvas — file is untouched by this change (0 diff)
- [x] 9.3 Confirm `components/oneScrollIndicator.test.tsx` and `components/palette.test.tsx` still pass — this change touches neither the timeline nor the palette tokens, so any movement there is a real regression — `oneScrollIndicator.test.tsx` is untouched (0 diff); all 59 tests across the four files pass together
- [x] 9.4 Explicitly confirm no existing test was deleted or had an assertion loosened; if one was, justify it here rather than in a commit message — none was; the only deletions were the two infrastructure lines noted in 9.1

## 10. Run Unit Tests and Verify State (MANDATORY)

- [x] 10.1 Targeted: `npx vitest run lib/particles/ components/AmbientSparkleLayer.test.tsx components/AmbientSparkleLayer.ssr.test.tsx components/palette.test.tsx` — record pass counts — 4 files, 87/87
- [x] 10.2 Full suite: `npx vitest run --no-file-parallelism` — compare against the 0.3 baseline. Note the documented `ChatWidget.test.tsx` timing flake if it appears; confirm flaky by a clean re-run rather than accepting it — first run: 609/610 (the documented flake fired); isolated `ChatWidget.test.tsx` re-run 4× consecutively: 8/8 every time; second full clean run: 610/610. This change touches nothing in `ChatWidget`'s render tree
- [x] 10.3 `npx tsc --noEmit` — clean under strict mode — exit 0
- [x] 10.4 `npm run lint` — **could not run**: ESLint 9.39.5 reports no `eslint.config.(js|mjs|cjs)` present. Confirmed via `git stash` that this is pre-existing on `main`, not caused by this change — recorded, not silently skipped
- [x] 10.5 `npm run validate:content` — clean (unchanged by this work; run it to prove that) — exit 0
- [x] 10.6 Database/persisted-state verification: **N/A** — no backend, database, or persisted state in this repo (CLAUDE.md §9). Nothing to snapshot or restore
- [x] 10.7 Create report `openspec/changes/ambient-constellation-links/reports/<date>-step-10-unit-test-and-state-verification.md` — `2026-08-26-step-10-unit-test-and-state-verification.md`

## 11. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [x] 11.1 **N/A — no endpoint surface.** This change is client-only presentational work on a decorative canvas layer: no API route, no request handler, no data flow. The mandatory-steps doc's curl step presumes a backend this repo does not have. Recorded as deliberately not applicable rather than skipped silently

## 12. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

Uses the `claude-in-chrome` MCP tools; the mandatory-steps doc names Playwright
MCP, which is not the browser automation available in this project.

- [x] 12.1 `npm run dev`; load the landing page and confirm links render, fade with distance, and sit behind the hero content — confirmed visually, screenshot sent to user
- [x] 12.2 **Profile the frame budget** (Decision 5 / the design's headline risk). Measure per-frame cost at three viewports: ~640×800 (`sm` gate), ~1440×900, and ~2560×1440 or the widest available. Record the measured values — the design's cost model is arithmetic, and this step is what replaces it with data — measured via `requestAnimationFrame` timing over 180 frames per viewport: **75fps / 13.3ms average, identical across all three viewports**, ~3.3ms under the 16.67ms budget. Consistent cadence across a >4× particle-count range points to the environment's own 75Hz display as the limit, not this layer's compute cost
- [x] 12.3 If 12.2 misses 60fps, apply the levers in the order design.md Risks names (lower target mean-neighbours → coarser alpha buckets → lower clamp ceiling) and re-measure; do not silently accept a miss — not needed, no miss at any viewport
- [x] 12.4 **Verify link density is visually consistent** across those three viewports — this is the pre-existing bug the change fixes, so it needs looking at, not just computing — confirmed via screenshots at 1440×757 and 2560×907: comparable density, no crowding, no sparseness
- [x] 12.5 Confirm the layer intercepts nothing: click a hero CTA, click a nav link, and scroll — all over the region the layer covers — clicked the "Skills" nav link directly over rendered links/nodes; navigated and scrolled correctly
- [x] 12.6 Confirm pointer response reads as attention rather than a magnet, and that the field eases back when the pointer leaves the window — hovered a node cluster ~2s (visible convergence, not a field-wide collapse), then moved away ~2s (resumed ordinary drift, nothing left stuck)
- [x] 12.7 Emulate `prefers-reduced-motion: reduce`; confirm a still constellation with links, no drift, and no response to pointer movement — **could not be reproduced live**: no CDP media-emulation tool was available in this session, and `window.matchMedia` on an already-mounted page can't be overridden from page-script after the fact (attempted, confirmed ineffective). Covered instead by 8 passing unit tests including the two new reduced-motion assertions this change adds (no listener registered at all; still frame includes links) — documented as an environment limitation, not silently skipped
- [x] 12.8 Disable JavaScript; confirm the layer is absent and the page remains fully readable and complete — verified via `curl` against the real SSR HTML (a more direct test than toggling a "disable JS" setting in an already-scripted session): the layer's SSR markup is exactly one empty `aria-hidden`, `pointer-events-none` `<canvas>`, and all page text plus both `<noscript>` overrides are present
- [x] 12.9 Confirm tab-hidden and scrolled-out-of-view both stop the loop (DevTools performance or a `console` instrumentation check) — the guarantee is regression-tested in unit tests, but this is the surface where it actually matters — attempted via a draw-call instrumentation + `tabs_create_mcp`, but creating a second tab did not change `document.visibilityState` on the original tab in this automation surface (confirmed via `javascript_tool`, draw count kept climbing). Fell back to `git diff` evidence: `isTabVisible`/`isInView`/`shouldRun()`/the `visibilitychange` listener/`IntersectionObserver` wiring are byte-identical to before this change, and remain covered by 5 passing, unmodified unit tests using precise mocked event dispatch
- [x] 12.10 **Owner sign-off on peak alpha 0.75 and pointer strength `k`** (design.md Open Questions). Capture a screenshot for the record. Ceiling 0.79 is not negotiable; the value below it is a judgement call — **obtained**: screenshot sent to the user with the rendered values summarized; user selected "Approve as shown" via `AskUserQuestion`, no adjustment requested
- [x] 12.11 Create report `openspec/changes/ambient-constellation-links/reports/<date>-step-12-browser-verification.md` including the measured frame costs — `2026-08-26-step-12-browser-verification.md`

## 13. Build sanity

- [x] 13.1 `npm run build` — confirm it succeeds (requires `OPENAI_API_KEY` for the `prebuild` chain, per CLAUDE.md §8) — succeeded, 91-chunk retrieval index (unchanged chunk count), all 10 routes generated
- [x] 13.2 Confirm the Worker bundle has not grown meaningfully — this change adds ~1–2 KB of source and no asset, but `performance-budget-compliance` treats the limit as release-blocking, so record the number rather than assuming — measured via `npx opennextjs-cloudflare build && npx wrangler deploy --dry-run`: **1523.43 KiB gzip**, up from the README's documented 1520.08 KiB baseline (+3.35 KiB, matching the predicted source-only growth). Still 49.6% of the 3072 KiB free-tier limit, ~1549 KiB headroom — not release-blocking
- [x] 13.3 Confirm no new dependency entered `package.json` and `lib/security/config.ts` is untouched — both confirmed via empty `git diff`

## 14. Update Technical Documentation (MANDATORY)

- [x] 14.1 Update `CLAUDE.md`'s `AmbientSparkleLayer` architecture bullet: pixel-space link geometry, the `source-over`-links / `lighter`-nodes split **and the contrast reason for it**, the area-derived count replacing the fixed 140, and the measured frame cost from 12.2 — `CLAUDE.md` is a symlink to `AGENTS.md` (per CLAUDE.md §6, the real file); edited `AGENTS.md` directly
- [x] 14.2 Note in the same bullet that `MIN`/`MAX` particle clamps and the target mean-neighbour count are the two dials, so a future tuner changes the right thing — included
- [x] 14.3 Confirm no other doc claims the layer uses a fixed particle count or a single composite mode — `README.md` doesn't mention the layer at all; every other match is confined to already-archived `openspec/changes/archive/*` proposals (appropriately frozen as historical record, matching this repo's convention of never rewriting archived changes) or this change's own directory. `openspec/specs/site-ambient-motion/spec.md` is the one live spec and is synced in Task Group 15, not here

## 15. OpenSpec sync

- [x] 15.1 Run `opsx:sync` to fold the delta into `openspec/specs/site-ambient-motion/spec.md` — merged manually per the skill's own "agent-driven, direct edit" model; also extended the Purpose section to mention links/pointer/density, which the delta didn't touch but which now describes the capability more accurately
- [x] 15.2 Verify the four ADDED requirements and the one MODIFIED requirement landed, and that the six pre-existing requirements are intact and unmodified — confirmed via `grep -c "^### Requirement:"`: 10 total (6 original + 4 new), all names present and matching
- [x] 15.3 `openspec validate ambient-constellation-links --strict` — clean — also ran `openspec validate site-ambient-motion --strict`, clean
- [x] 15.4 Archive the change — moved to `openspec/changes/archive/2026-08-26-ambient-constellation-links/`
