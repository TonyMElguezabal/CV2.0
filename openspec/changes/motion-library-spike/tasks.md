## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/jos-53-motion-library-spike` from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. Scaffold Next.js + Tailwind

- [x] 1.1 Run `create-next-app` targeting a temp directory (confirmed this repo root can't be targeted directly — npm naming rules reject the `CV2.0` directory name)
- [x] 1.2 Copy `app/`, `next.config.ts`, `postcss.config.mjs`, and needed `public/` assets into the repo root — explicitly excluding the generated `CLAUDE.md`, `AGENTS.md`, `README.md`, `package.json`, and `tsconfig.json` (per design.md Decision 1). Default demo SVGs in `public/` were removed as unused rather than kept.
- [x] 1.3 Rewrite `app/layout.tsx` to use a system font stack instead of `next/font/google` (design.md Decision 4 — avoid the Google Fonts build-time network dependency). Also updated `app/globals.css` to drop the Geist font variable references and set dark as the default background/foreground per PRD §4 principle 7 ("dark theme by default").
- [x] 1.4 Add `.next/` and other Next.js build artifacts to `.gitignore` (based on Next's own generated `.gitignore` for accuracy)

## 2. Merge Configuration

- [x] 2.1 Hand-merge `package.json`: keep `name`/`version`/`description`/existing `test`/`validate:content` scripts; add `dev`/`build`/`start`/`lint`; add `next`/`react`/`react-dom` as dependencies; add `tailwindcss`/`@tailwindcss/postcss`/`@types/react`/`@types/react-dom`/`eslint`/`eslint-config-next` as devDependencies (design.md Decision 2). Installed via `npm install` rather than hand-typed versions, for accurate resolution.
- [x] 2.2 Hand-merge `tsconfig.json`: based on Next's generated shape, added `dom`/`dom.iterable` to `lib` alongside `ES2022`, kept `noUncheckedIndexedAccess`/`forceConsistentCasingInFileNames`/`allowImportingTsExtensions`, expanded `include` to cover `app/**/*.tsx` and `lib/**/*.ts`, dropped the explicit `types` array (design.md Decision 3)
- [x] 2.3 Ran `npm install` — found and documented 2 issues, neither blocking: (a) a moderate XSS advisory in `next`'s bundled transitive `postcss`, whose suggested fix would force-downgrade Next.js 8 major versions (9.3.3) — rejected as disproportionate to a low-exploitability, build-time-only, upstream-owned issue; (b) `typescript-eslint`'s peer range hasn't caught up to TypeScript 7.0.2 yet (ESLint tooling only, doesn't affect `tsc` or Next's SWC-based compiler)

## 3. Verify Existing Tooling Is Undisturbed (regression gate)

- [x] 3.1 Ran `npm test` — all 16 pre-existing tests passed unchanged
- [x] 3.2 Ran `npm run validate:content` — exit 0 against the real content
- [x] 3.3 Run `npx tsc --noEmit` and confirm the merged tsconfig type-checks cleanly across both `lib/` and `app/`. Found and fixed a real regression here: dropping the explicit `types` array (as design.md originally planned) broke `vitest/globals` resolution across all 3 existing test files; a triple-slash-reference fix attempt didn't work in this environment, then a stale `.tsbuildinfo` cache masked the real fix underneath — full debugging trail recorded in design.md's Implementation Notes. Final state: explicit `types` array restored, `incremental` removed entirely.
- [x] 3.4 Investigated whether `"type": "module"` causes any issue with `next dev`/`next build` — **the flagged risk was a red herring**. `next build` did fail, but the real cause (found via systematic bisection across multiple clean test environments, full trail in design.md's Implementation Notes) was `typescript@7.0.2` being incompatible with Next.js 16.2.10's internal TypeScript integration, not `"type": "module"` (explicitly ruled out twice in clean environments). Fixed by pinning `typescript` to `5.9.3`. `next build` now succeeds; full regression suite (`tsc --noEmit`, `npm test`, `npm run validate:content`) confirmed still passing.

## 4. Hero Shell with Real Content

- [x] 4.1 Build a minimal hero component shell that reads `name` and `positioning` from `content/profile.yaml` via the existing `lib/content` reading pattern. New `lib/content/read.ts` (`getProfile()`). Found a real bundler-vs-raw-Node discrepancy here: `import.meta.dirname` (which works for Story 1.2's CLI, run via raw `node`) is `undefined` inside Next's bundled SSR execution context — switched to `process.cwd()`, the standard Next.js pattern for this exact use case, since `read.ts` (unlike `validate.ts`/`cli.ts`) is imported into the Next bundle.
- [x] 4.2 Style the shell with Tailwind, dark theme per PRD default (§4.7) — shared style constants in `components/HeroShellStyles.ts`, reused by both candidates so only the animation logic differs between them

## 5. Candidate A: GSAP ScrollTrigger

- [x] 5.1 Add `gsap` as a dependency
- [x] 5.2 Implement the signature sequence using GSAP ScrollTrigger against the hero shell — an on-load entrance (name/positioning fade + slide up, staggered) plus a scroll-driven exit (fade + move up, scrubbed to scroll position as the hero leaves the viewport) — genuinely exercising ScrollTrigger, matching PRD's specific naming of "GSAP ScrollTrigger," not just an on-load-only effect
- [x] 5.3 Confirmed it runs in the dev server — HTTP 200, verified via curl

## 6. Candidate B: Framer Motion

- [x] 6.1 Add `framer-motion` as a dependency. Found a real version-compatibility bug here: my initially-guessed exact version (`12.23.24`) had drifted out of sync with its own `motion-dom` transitive dependency, which had raced ahead to `12.42.2` and broken an export `framer-motion` needed — a real upstream semver-discipline gap between two packages from the same "Motion" library ecosystem, not a mistake in our config. Fixed by installing `framer-motion@latest`, which resolved both packages to matching `12.42.2`.
- [x] 6.2 Implement the same signature sequence using Framer Motion against the same hero shell — `useScroll`/`useTransform` for the scroll-driven exit (Framer's equivalent to ScrollTrigger's scrub), `initial`/`animate` for the on-load entrance, same shared `HeroShellStyles` as the GSAP candidate
- [x] 6.3 Confirmed it runs in the dev server — HTTP 200, verified via curl, after the version fix above

## 7. Manual Browser Verification (MANDATORY — first UI story, browser-testing step genuinely applies)

- [x] 7.1 Started the dev server and attempted to navigate to each candidate using browser automation (Claude in Chrome) — **the extension was not connected in this environment** (confirmed via two attempts, not transient), so true visual/console browser verification was not available. Documented honestly rather than skipped or faked.
- [x] 7.2 **Fallback verification performed instead**: curl-based inspection of each candidate's rendered HTML (both return HTTP 200; both render the real name "Jose Muñoz" and positioning statement correctly via server-side rendering; each candidate's distinct footer text confirms the correct component is mounted). This confirms both candidates render and serve correctly. **What this does NOT confirm**: that the animations visually run smoothly at 60fps, or appear correct to a human eye — that would require the unavailable browser automation. Recorded as a genuine verification gap, not silently assumed to be fine.
- [x] 7.3 Checked the dev server log for both candidates — zero errors or warnings during either candidate's rendering (beyond the unrelated `npm warn` peer-dependency noise already documented in §2.3)

## 8. Compare Candidates

- [x] 8.1 Ran `next build` with the GSAP candidate active. This Next.js version's default build output no longer prints the classic First Load JS size table, so measured directly: the GSAP-specific chunk (confirmed via `ScrollTrigger`/`gsap` string search) is **112K raw / 43.0K gzipped**.
- [x] 8.2 Ran `next build` with the Framer Motion candidate active. Its chunk (confirmed via the `MotionConfig` export string) is **128K raw / 41.5K gzipped**. Bundle size is effectively a wash between the two — GSAP is smaller raw, Framer Motion is slightly smaller gzipped, both well within the same order of magnitude.
- [x] 8.3 Compared implementation complexity: GSAP candidate is 63 lines, Framer Motion candidate is 55 lines (~13% shorter) for the same visual result. More significant than the line count: Framer Motion's API is declarative — `initial`/`animate` props live directly on the JSX elements, and `useScroll`/`useTransform` handle their own lifecycle. GSAP's API is imperative — requires a `useEffect` + `useRef` per animated element + a manual `gsap.context()`/`ctx.revert()` cleanup dance to avoid leaking ScrollTrigger instances on unmount. For a content-heavy site with many chapter/section components each needing similar entrance animations (Stories 2.3, 3.1–3.3), Framer Motion's declarative model is meaningfully less error-prone to replicate correctly across many components.
- [x] 8.4 **Real Lighthouse audit succeeded** — headless Chrome launched cleanly via `npx lighthouse` against `next start` (production server), using the system's Chrome.app. No fallback needed. Ran against the Framer Motion candidate (the emerging leader per §8.3) on both form factors for full PRD §9 coverage:
  - **Mobile** (Lighthouse CLI default, simulated throttling): Performance 99, SEO 100, Best Practices 100, LCP 2.2s (PRD budget: <4s mobile ✓)
  - **Desktop** (`--preset=desktop`): Performance 100, SEO 100, Best Practices 100, LCP 0.5s (PRD budget: <2.5s desktop ✓)
  - All PRD §9 thresholds (≥90 Lighthouse scores, both LCP budgets) genuinely met, not assumed.

## 9. Decision and Cleanup

- [x] 9.1 **Selected Framer Motion.** Rationale: bundle size is a wash (§8.1/8.2 — GSAP smaller raw, Framer Motion smaller gzipped, both the same order of magnitude); Framer Motion's declarative API (§8.3) is meaningfully less error-prone to replicate correctly across the many similar animated components future stories need (2.3 hero polish, 3.1–3.3 timeline/chapters) — no manual cleanup/lifecycle management required per component, unlike GSAP's `useEffect`+`ctx.revert()` pattern; and Framer Motion has a confirmed-passing real Lighthouse audit (§8.4) against the actual PRD §9 budget on both form factors.
- [x] 9.2 Removed GSAP: `npm uninstall gsap`, deleted `components/HeroGsap.tsx`
- [x] 9.3 Confirmed the winning implementation (Framer Motion) still type-checks and builds cleanly after GSAP's removal

## 10. Spike Report (per this repo's `type:spike` Definition of Done)

- [x] 10.1 Wrote the spike report at `openspec/changes/motion-library-spike/reports/2026-07-18-spike-report.md`: findings, trade-offs, decision (Framer Motion), the real Lighthouse measurement, and time spent (dominated by diagnosing the TypeScript 7/Next.js incompatibility, not by the library comparison itself)
- [x] 10.2 Recorded decision on next steps: **Proceed** — this prototype, the Next.js scaffold, and Framer Motion carry forward into Story 2.2 (hero content) and Story 2.3 (signature animation)

## 11. Review and Update Existing Unit Tests (MANDATORY)

- [x] 11.1 Reviewed against `specs/motion-library-decision/spec.md`. Coverage: Req 1 (both scenarios via §5–7's dev-server + HTTP verification), Req 2 (§9.1 decision recorded, §9.2 losing candidate removed), Req 3 (§8.4 real Lighthouse, both form factors), Req 4 (§3.1/3.2 existing suite green, §1.2 real project files explicitly excluded from the scaffold copy)
- [x] 11.2 Confirmed: all 16 pre-existing tests (Stories 1.1/1.2/1.3a) pass unchanged; none were modified by this change

## 12. Run Unit Tests and Verify State (MANDATORY, adapted for a database-free story)

- [x] 12.1 Ran the full test suite (`npm test`) — 16 passed, 0 failed, 0 skipped
- [x] 12.2 Confirmed all tests pass with zero failures
- [x] 12.3 Created verification report at `openspec/changes/motion-library-spike/reports/2026-07-18-step-12-unit-test-verification.md`, including the real (not fallback) performance-measurement outcome from §8.4. Database state section marked N/A per prior stories' rationale.
- [x] 12.4 Report exists and all tests pass — step complete

## 13. Manual Endpoint Testing with curl — Not Applicable

- [x] 13.1 Recorded in the section-12 report: this story introduces no HTTP API endpoints, so curl testing does not apply

## 14. Browser/E2E Verification — Applicable (first UI story)

- [x] 14.1 Recorded in the section-12 report: performed HTTP + rendered-HTML verification (§7) since the Claude in Chrome extension was not connected in this environment; genuine visual/console verification gap documented honestly as non-blocking but carried forward, not silently treated as complete

## 15. Update Technical Documentation (MANDATORY)

- [x] 15.1 Updated `README.md`: new "Stack" section naming Next.js/Tailwind/Framer Motion, expanded Development section with `dev`/`build`/`start`, and a note on the `typescript@5.9.3` pin
- [x] 15.2 Verified `docs/PRD.md` §8/§9 — §8's Motion row needed a real edit (was "GSAP ScrollTrigger or Framer Motion (pick one in week 1 spike)", now records the actual decision and why); §9's performance budget text itself needed no edit (it states requirements, not measurement results, which live in the spike report)
- [x] 15.3 `design.md` was reconciled incrementally throughout implementation (Implementation Notes sections for the TypeScript-array/tsbuildinfo detour and the TypeScript-7-incompatibility root cause) rather than saved for this final step. Both originally-flagged risks are resolved with real, documented outcomes: `"type": "module"` was a red herring (explicitly ruled out); headless Chrome/Lighthouse worked cleanly, no fallback needed.
