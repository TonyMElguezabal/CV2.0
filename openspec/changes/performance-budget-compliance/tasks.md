## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-74-81-performance-budget-compliance` (Linear-provided branch name for JOS-74) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: this is a bundling/perf story — no
database, no endpoint, no new validation. The behavioral changes (lazy
motion, code-split panel) are covered by keeping the EXISTING component
tests green (hero-signature-motion entrance state, chat widget open/stream/
close) plus an assertion that the chat panel is dynamically imported. The
measurable ACs (Lighthouse ≥90, LCP, 60fps, First Load JS budget) are
NOT unit-testable in jsdom — they are owner/agent gates via `next build`
(bundle size), `next start` + `npx lighthouse` (scores/LCP), and DevTools
profiling (60fps), documented like the eval:chat/Upstash manual gates.
Applicable gates: `npx vitest run`, `npx tsc --noEmit`, `npm run
validate:content`, `npm run lint` (broken repo-wide, same skip),
`next build` bundle check, and the Lighthouse/profiling pass. The final
Lighthouse SEO sub-score assumes 8.3 (seo-metadata-and-structured-data)
is merged — sequence the final gate accordingly.
-->

## 1. Lazy-load the motion library (AC3, TDD)

- [x] 1.1 Create `components/MotionProvider.tsx` (`"use client"`): wrap children in `LazyMotion` with features loaded lazily (`features={() => import("framer-motion").then((m) => m.domAnimation)}`, `strict` so only `m` is allowed)
- [x] 1.2 Refactor `components/HeroFramer.tsx` and `components/ChatWidget.tsx` from `motion.*` (full API) to `m.*` under `MotionProvider`; keep `AnimatePresence` for the panel; preserve the reduced-motion behavior (from 8.2 if merged, else current)
- [x] 1.3 Keep the motion tests green (design.md Decision 6): `HeroFramer`'s synchronous entrance-state assertions pass unchanged under `LazyMotion` — `m`'s style/transform application from `initial`/`animate` doesn't require the async `domAnimation` feature bundle to resolve first, so no test mitigation was needed
- [x] 1.4 Run `npx vitest run components/HeroFramer.test.tsx components/ChatWidget.test.tsx` and confirm all cases pass

## 2. Code-split the chat panel (AC3, TDD)

- [x] 2.1 Split the heavy chat panel (the `AnimatePresence` panel + `streamChat` + citations) from the lightweight persistent trigger; load the panel via `next/dynamic` (on first open or idle prefetch), keeping the trigger eagerly rendered so `chat-widget-entry-point`'s persistent entry point is unaffected — implemented as `components/ChatPanel.tsx` (all framer-motion/streaming logic, reads `isOpen`/`closeChat` from `useChatWidget()` directly) dynamically imported (`ssr: false`) from the now-thin `components/ChatWidget.tsx` (trigger only, no framer-motion import at all — kept out of the initial bundle), gated behind a `hasOpened` flag so the panel loads once on first open and stays mounted afterward (so its own `AnimatePresence` can exit-animate future closes)
- [x] 2.2 Added a test asserting the panel is not rendered before first open and that it loads and renders after the trigger is clicked (`components/ChatWidget.test.tsx`); moved the full existing behavior suite (open, starter question submit, stream, citations, error fallbacks, close via button/Escape, reduced-motion) to `components/ChatPanel.test.tsx`, testing `<ChatPanel>` directly via a test-only trigger so every assertion stays synchronous — all pass unchanged
- [x] 2.3 Run `npx vitest run components/ChatWidget.test.tsx components/ChatPanel.test.tsx` and confirm all cases pass — 21/21 pass

## 3. Full test/type verification (agent executes all of this itself)

- [x] 3.1 Run `npx vitest run` (full suite) and confirm no regressions — 257 tests pass
- [x] 3.2 Run `npx tsc --noEmit` clean
- [x] 3.3 Run `npm run validate:content` clean
- [x] 3.4 Run `npm run lint` — same pre-existing repo-wide failure (missing `eslint.config.mjs`); skipped with the same rationale

## 4. JS budget measurement (AC3)

- [x] 4.1 Ran `npm run build`; found Next 16's build output no longer prints the classic per-route First Load JS table (confirmed with both Turbopack and `--webpack`) — measured directly from `.next/static/chunks` instead (`gzip -c <chunk> | wc -c`). Confirmed via `.next/react-loadable-manifest.json` that both lazy boundaries are registered as separate chunks: `components/ChatWidget.tsx -> ./ChatPanel` (~20 KB gzip) and `components/MotionProvider.tsx -> framer-motion` (~51 KB gzip) — neither is in the root/always-loaded chunk set
- [x] 4.2 Recorded the measured baseline (~128 KB gzip First Load JS) and a ~160 KB gzip regression ceiling in `README.md`'s new "Performance budget" section, along with the lazy-chunk breakdown and the measurement method (since the build no longer surfaces it directly)

## 5. Lighthouse + LCP + 60fps gate (AC1, AC2, AC4 — owner/agent gate)

- [x] 5.1 Ran real `npx lighthouse` desktop and mobile audits against a production build (`next build --webpack` + `next start`), using the system's installed Chrome via `CHROME_PATH`. **Desktop: 100/100/100/100, LCP 0.6s** — clears every target. **Mobile (throttled): performance 86–87, LCP 4.1s** — a near-miss against the ≥90/<4s targets, root-caused to `framer-motion`'s feature-bundle fetch landing inside the LCP window under simulated mobile throttling. Attempted an in-scope mitigation (deferred the `domAnimation` fetch to `requestIdleCallback` in `MotionProvider.tsx`) — measurably did not close the gap, since the resource still loads within the audited trace regardless of scheduling priority. Removing framer-motion from the hero would close it but reopens the locked `motion-library-decision`; flagged as an owner follow-up rather than blocking this story on an architectural decision outside its scope. SEO scored 100 since 8.3 is already merged
- [x] 5.2 Verified 60fps at the code level: every `initial`/`animate`/`exit` value across `HeroFramer.tsx` and `ChatPanel.tsx` sets only `opacity`/`y`, never a layout-triggering property — compositor-only by construction. A live DevTools recording could not be captured; the automation tab reports `document.visibilityState: "hidden"`, which throttles the animation frame loop entirely — the same environment limitation documented during the accessibility story, not a reflection of real device behavior
- [x] 5.3 Recorded the First Load JS, Lighthouse, LCP, and 60fps results in the README "Performance budget" section; stopped the dev/preview server and confirmed no stray processes

## 6. OpenSpec sync

- [ ] 6.1 After merge, sync `specs/performance-budget-compliance/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
