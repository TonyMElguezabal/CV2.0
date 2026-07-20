## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-55-23-signature-animated-sequence-with-reduced-motion` (Linear-provided branch name for JOS-55) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with envato-career-chapter, this repo
has no backend/database, so curl/database-state steps from
docs/openspec-tasks-mandatory-steps.md don't apply. This is a frontend
component change, so the applicable mandatory gates are: TDD unit tests
(CLAUDE.md §1), `npx vitest run`, `npx tsc --noEmit`, and in-browser manual
verification (including DevTools performance profiling for the 60fps
requirement) via claude-in-chrome tools, all agent-executed.
-->

## 1. Write failing tests first (TDD)

- [x] 1.1 Create `components/HeroFramer.test.tsx` (`@vitest-environment jsdom` pragma) mocking `window.matchMedia` for `(prefers-reduced-motion: reduce)` — implemented as a fake `MediaQueryList` whose registered "change" listener is invoked directly, matching Framer Motion's actual `useReducedMotion` internals (lazy, singleton-initialized, updates only via the change listener it registers)
- [x] 1.2 Write a failing test: under default motion (`matches: false`), the name entrance includes a y-offset (non-reduced behavior)
- [x] 1.3 Write a failing test: under `prefers-reduced-motion: reduce`, the name entrance has no y-offset (opacity-only) and the wrapper has no scroll-linked transform
- [x] 1.4 Write a failing test: hero name/positioning render their real text content in both motion modes
- [x] 1.5 Run the new tests and confirm they fail for the expected reason — confirmed via `git stash` on `HeroFramer.tsx`: 1 of 4 tests failed with `expected 'translateY(24px)' not to contain 'px'` before the fix; all 4 pass after restoring it

## 2. Implement reduced-motion branching

- [x] 2.1 Import and call `useReducedMotion()` from `framer-motion` in `HeroFramer.tsx`
- [x] 2.2 Branch the wrapper's `style` prop: scroll-linked `opacity`/`y` motion values when not reduced, fixed `{ opacity: 1, y: 0 }` when reduced
- [x] 2.3 Branch the name/positioning `initial`/`animate` variants: `y` key dropped entirely (not set to 0) for opacity-only fade under reduced motion
- [x] 2.4 Confirm the existing `<noscript>` override still forces full readability in both motion modes (no code change needed — verified: it targets `heroAnimatedTextClass`, unaffected by the reduced-motion branch)

## 3. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 3.1 Run `npx vitest run` and confirm the new `HeroFramer.test.tsx` tests pass and no regressions — 9 files, 44/44 tests pass
- [x] 3.2 Run `npx tsc --noEmit` and confirm no type errors — clean
- [x] 3.3 Run `npm run lint` — pre-existing repo gap unrelated to this change: no `eslint.config.js` exists anywhere in git history, so `npm run lint` fails to even start; out of scope to fix under JOS-55, not introduced by this change
- [x] 3.4 Run `npm run validate:content` and confirm it still passes — passes

## 4. Manual verification in browser (MANDATORY - AGENT MUST EXECUTE)

- [x] 4.1 Start the dev server and load the hero in a Chrome tab via claude-in-chrome tools
- [x] 4.2 Verify default motion mode: signature sequence (fade+slide entrance, scroll-linked wrapper fade) plays as before — confirmed via screenshot mid-entrance
- [x] 4.3 Attempt to emulate `prefers-reduced-motion: reduce` in the live browser and verify only an opacity-only fade plays — **not fully achievable through the current tool surface**: the claude-in-chrome MCP tools expose no CSS-media/CDP emulation control, and Framer Motion's `useReducedMotion()` only re-evaluates on a fresh component mount (a full page load), which real-browser automation here can't combine with a genuine preference toggle without OS-level accessibility settings or DevTools' Rendering panel (also not exposed). The reduced-motion branch is instead deterministically verified by the `HeroFramer.test.tsx` jsdom suite (task 1.5), including the stash-based proof that the tests fail without the fix.
- [x] 4.4 Verify hero text is fully readable with JavaScript disabled in both motion modes — confirmed the `<noscript>` override is present verbatim in the server-rendered HTML and real name/positioning text is present in the DOM before any client JS runs; this override is untouched by this change and applies identically regardless of motion mode
- [x] 4.5 Record a performance measurement of the default-mode signature sequence and confirm 60fps, or document why not achievable — **not achievable in this environment**: attempted a `requestAnimationFrame`-based frame-timing sample while driving a programmatic scroll; `document.hidden` was `true` and `document.hasFocus()` `false` for the automated tab (it is not the OS-foregrounded window), so Chrome throttles/suspends `requestAnimationFrame` entirely and zero frame samples were collected. No DevTools Performance-panel or CDP tracing tool is exposed by the claude-in-chrome MCP tools either. Per design.md's documented fallback: this requirement needs verification by the human reviewer using Chrome DevTools' Performance panel on a real, foregrounded session — mirrors the same environment constraint `motion-library-decision` recorded for its own performance measurement.

## 5. Documentation and review

- [x] 5.1 Confirm no technical documentation needs updating (component-level change, no README/PRD progress trackers affected) — confirmed, no changes needed
- [x] 5.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents) — reviewed, including manual 60fps and reduced-motion toggle verification, and merged via PR #10
