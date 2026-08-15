# Step 7 Report - Unit Tests and State Verification

- Date: 2026-08-14
- Change: ambient-sparkle-layer
- Agent: Claude Code (opsx:apply)

## Commands Executed

- `npx vitest run components/AmbientSparkleLayer.test.tsx components/AmbientSparkleLayer.ssr.test.tsx lib/particles/simulation.test.ts app/admin/layout.test.tsx components/HeroLaptop.test.tsx components/accessibilityStructure.test.tsx components/palette.test.tsx` (targeted, throughout implementation)
- `npx vitest run` (full suite, 3 runs — see Notable Findings)
- `npx tsc --noEmit`
- `npm run validate:content`
- `npm run lint`

## Unit Test Results

- Full suite: **90 files / 463 tests passed** on the cleanest run of this session (see flake note below — later runs, immediately before commit, were less clean for an identified environmental reason)
- Runtime: full suite ≈5s
- **Addendum, immediately before commit**: `components/ChatWidget.test.tsx`'s "returns focus to the trigger after the panel closes" (the same pre-existing, documented `waitFor`-timing test noted in JOS-105/JOS-108/JOS-109's own reports) failed on 6 consecutive full-suite runs — more persistent than previously observed. Investigated rather than dismissed: confirmed still passes in isolation every time (`npx vitest run components/ChatWidget.test.tsx` → 8/8); confirmed it still fails even with the heaviest new test file (`AmbientSparkleLayer.test.tsx`) excluded via `--exclude`, ruling out this change's own mocks as the cause; then checked `uptime` and found the actual cause — **system load average 20.95** at the time, driven by long-running `wrangler dev` / `workerd serve` / `opennextjs-cloudflare preview` processes already running on this machine since before this session started (not started by this session, left running from unrelated prior activity). A real-timer-based `waitFor` test is exactly the kind of assertion heavy CPU contention makes fragile. This is an environmental condition on the host machine, not a regression introduced by this change — `ChatWidget.tsx`/`ChatWidgetStyles.ts`/`ChatWidgetContext.tsx` were never touched (`git status` confirms, same as prior stories' own verification).

## New/Modified Test Files

- `lib/particles/simulation.ts` / `.test.ts` — new (pure particle logic, 9 tests)
- `lib/color/contrast.ts` — added `hexToRgb` export (shared by the particle color derivation and the existing luminance math)
- `components/AmbientSparkleLayer.tsx` / `AmbientSparkleLayerStyles.ts` / `.test.tsx` (22 tests) / `.ssr.test.tsx` — new
- `app/(marketing)/layout.tsx` — mounts `AmbientSparkleLayer` between `HeroLaptop` and `GridOverlay`
- `components/accessibilityStructure.test.tsx` — composed-surfaces test extended with `AmbientSparkleLayer`
- `app/admin/layout.test.tsx` — added an explicit `ambient-sparkle-layer` absence assertion

## TypeScript / Content Validation

- `npx tsc --noEmit`: clean
- `npm run validate:content`: clean

## Lint

- `npm run lint` fails with the same pre-existing, repo-wide condition documented in every prior story on this branch lineage (`hero-laptop-cinematic-lighting`, `site-typography-and-palette`, `editorial-frame`): no `eslint.config.js` exists anywhere in the repository (ESLint 9 requires flat config). Not introduced by this change. Skipped per this change's own `tasks.md` 7.5.

## Database State Verification

- **N/A** — this repository has no backend or database (`AGENTS.md`/`CLAUDE.md` §9). This change touches only a canvas-rendering client component, a pure simulation module, and layout composition. No state to capture, verify, or restore.

## Notable Findings During Implementation (see tasks.md for full per-task-group detail)

- **A real floating-point bug caught by a test, not written after the fact**: `stepParticles`'s boundary-wrap helper used `((value % 1) + 1) % 1` unconditionally. `%` is not an exact identity for already-in-range floats, so a stationary particle (`deltaSeconds = 0`) drifted by a float-epsilon every step — caught by a dedicated no-op test. Fixed by skipping the modulo entirely when the value is already in `[0, 1)`.
- **A genuine framer-motion internal-singleton bug in my own test setup, not the component**: `useReducedMotion()`'s resolved value lives in a `motion-dom` module-level singleton (`hasReducedMotionListener`/`prefersReducedMotion`), initialized exactly once per process and updated only via a change-listener attached on that first initialization. My test file's `beforeEach` was clearing the fake `matchMedia` change-listener array between tests, which — after the first test in the file ever mounted a component using the hook — permanently orphaned framer-motion's own listener, freezing reduced-motion state at whatever the very first test observed. Traced via a direct probe test against `framer-motion`'s exported `useReducedMotion`, then confirmed by reading `node_modules/motion-dom/dist/cjs/index.js`. Fixed by not clearing that array, matching `HeroLaptop.test.tsx`/`HeroFramer.test.tsx`'s own setup (neither clears it either) — documented inline so this isn't reintroduced.
- Two structural tests (nav-link-visibility-style checks in prior stories' equivalent groups; here, the DOM-order/negative-z-index assertions in Task Group 1) passed immediately because the component was built with those constraints in mind from the start — disclosed per-task in `tasks.md` rather than presented as literal red-green.

## Scope of Changes Verified

- New: `lib/particles/simulation.ts`, `components/AmbientSparkleLayer.tsx`, `AmbientSparkleLayerStyles.ts`, plus all associated test files
- Modified: `lib/color/contrast.ts` (new export only, existing exports untouched), `app/(marketing)/layout.tsx`, `components/accessibilityStructure.test.tsx`, `app/admin/layout.test.tsx`

## Outcome

- Step 7 status: **PASS**
- Blocking issues: none
- Remaining work: Steps 8-12 per `tasks.md` (endpoint N/A note, browser verification, build sanity, documentation, OpenSpec sync)
