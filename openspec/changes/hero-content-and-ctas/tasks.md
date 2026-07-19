## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Confirm JOS-53 (`feature/jos-53-motion-library-spike`) is merged to `main`; if not yet merged, branch from that feature branch instead and flag it explicitly
- [x] 0.2 Create feature branch `feature/jos-54-hero-content-and-ctas` from up-to-date `main` (or the JOS-53 branch per 0.1)
- [x] 0.3 Verify branch creation and current branch status

## 1. Test Tooling Setup

- [x] 1.1 Add `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` as devDependencies — first story with real component logic (mailto construction, disabled state, conditional rendering) worth testing beyond content-schema tests
- [x] 1.2 Configure a `jsdom` test environment for component specs — `environmentMatchGlobs` is not available in the installed Vitest 4.1.10 (option removed from this major); used the `// @vitest-environment jsdom` per-file pragma instead (already named as the fallback option), added `vitest.setup.ts` importing `@testing-library/jest-dom/vitest` and wired it via `setupFiles`, and added `components/**/*.test.tsx` to `vitest.config.ts`'s `include` — existing content-model tests remain on the default `node` environment, unaffected
- [x] 1.3 Verify the new tooling runs with a throwaway smoke test, then remove the smoke test

## 2. TDD: HeroCtas Component Tests (write first, expect failing)

- [x] 2.1 Write failing test: renders four CTAs — Scroll (primary), Ask AI, Download résumé, Contact
- [x] 2.2 Write failing test: "Download résumé" is an anchor with `href="/resume.pdf"` and a `download` attribute
- [x] 2.3 Write failing test: "Contact" is an anchor with `href="mailto:<profile.contact.email>"`, driven by a passed-in profile prop (not hardcoded)
- [x] 2.4 Write failing test: "Ask AI" renders as a `<button>` with `disabled` set and a label indicating it is not yet available
- [x] 2.5 Write failing test: primary CTA is an anchor with `href="#hero-next"`
- [x] 2.6 Confirm all new tests fail (component does not exist yet) — confirmed via unresolved import error, `HeroCtas.tsx` does not exist yet

## 3. Implementation

- [x] 3.1 Copy `/Users/josemunoz/Downloads/2026Jose_Munoz_Elguezabal_Manager.pdf` to `public/resume.pdf`
- [x] 3.2 Add CTA-row style constants to `components/HeroShellStyles.ts` (e.g. `ctaRowClass`, `ctaPrimaryClass`, `ctaSecondaryClass`, `ctaDisabledClass`, `heroAnimatedTextClass`)
- [x] 3.3 Create `components/HeroCtas.tsx`: accepts a `profile: Pick<Profile, "contact">` prop, renders the primary scroll anchor and the three secondary CTAs per design.md decisions 3-6
- [x] 3.4 Add `id="hero-next"` to the existing spacer div in `HeroFramer.tsx` as the primary CTA's real anchor target — also updated the spacer's stale spike-era copy ("Scroll to explore (Framer Motion candidate)") to "More below", since this is now the real merged page, not a two-candidate comparison
- [x] 3.5 Add `heroAnimatedTextClass` to the two `motion` text elements in `HeroFramer.tsx` and render a `<noscript>` block with a `<style>` tag forcing `opacity: 1 !important; transform: none !important` on that class, per design.md decision 1
- [x] 3.6 Render `<HeroCtas profile={profile} />` inside `HeroFramer.tsx`, passing the profile already loaded by `app/page.tsx` — `HeroFramer` now takes a `profile` prop, `app/page.tsx` updated to pass it
- [x] 3.7 Run the Step 2 test suite and confirm all tests now pass — 6/6 passed

## 4. Review and Update Existing Unit Tests (MANDATORY)

- [x] 4.1 Run the full existing suite (`npm test`) to confirm no prior test (content-model, validate, cli) was broken by the new devDependencies or vitest config change — 22/22 passed (16 pre-existing + 6 new `HeroCtas` tests), 4 test files
- [x] 4.2 Reviewed: `lib/content/read.ts` has no dedicated unit test (true before this story too, and this story makes no code change to `read.ts`). No real gap found — `contact.email`'s shape is already covered by `content.test.ts`'s `ProfileSchema` validation, `HeroCtas.test.tsx` covers the component's consumption of a `contact` prop via fixture data, and Step 7's browser verification exercises the real `getProfile()` → `contact.email` → rendered `mailto:` link path end-to-end against actual `content/profile.yaml`. No new test added.

## 5. Run Unit Tests and Verify State (MANDATORY)

- [x] 5.1 Run `npx tsc --noEmit` (strict-mode type check) — clean; also fixed a real pre-existing gap: `components/**` and `vitest.setup.ts` were missing from `tsconfig.json`'s `include`, so they were never actually type-checked
- [x] 5.2 Run `npm test` (full suite, including new HeroCtas component tests) — 22/22 passed
- [x] 5.3 Run `npm run validate:content` — exit 0
- [x] 5.4 Run `npm run build` (production build, confirms `public/resume.pdf` is included in output) — succeeds; `public/resume.pdf` confirmed present (Next.js serves `public/` directly, no build-time copy step)
- [x] 5.5 Create report `openspec/changes/hero-content-and-ctas/reports/2026-07-18-step-5-unit-test-verification.md` with commands executed and results
- [x] 5.6 Mark this step complete only after all checks pass and the report exists

## 6. Manual Endpoint Testing with curl — Not Applicable

- [x] 6.1 Documented in the Step 5 report that this story introduces no HTTP API endpoints (static asset + client-rendered content only) — curl testing does not apply

## 7. Browser/E2E Verification (MANDATORY — real user-facing feature, Claude in Chrome confirmed connected)

- [x] 7.1 Start `next dev` (or reuse a running instance) and navigate to the hero page using `mcp__claude-in-chrome` — restarted the dev server fresh (killed a stale instance from the prior session, cleared `.next`) to guarantee a clean run
- [x] 7.2 Screenshot/verify: name, positioning, and all four CTA labels are visible within the first viewport without scrolling — confirmed
- [x] 7.3 Click "Download résumé" and verify a real PDF download is triggered — verified via `href`/`download` attribute inspection plus independent confirmation `/resume.pdf` is a valid file, rather than driving the OS-level save dialog (not observable by the extension)
- [x] 7.4 Inspect the "Contact" CTA's resolved `href` and confirm it matches `content/profile.yaml`'s `contact.email` — confirmed exact match
- [x] 7.5 Verify the "Ask AI" CTA is rendered disabled and that clicking it produces no navigation or state change — confirmed `disabled: true` and a dispatched click produced no `click` event
- [x] 7.6 Click the primary CTA and verify the page scrolls to the `#hero-next` spacer section — confirmed via URL hash change + screenshot
- [x] 7.7 Disable JavaScript for the tab (via Chrome settings/devtools) and reload; verify name, positioning, and all CTA labels remain visible and readable — **the extension blocked navigation to `chrome://settings`, so real per-tab JS-disable could not be exercised**; fell back to inspecting the rendered SSR HTML for the `<noscript>` override (confirmed present, targets both animated text elements, uses `!important` which structurally beats the non-important inline `opacity:0`) — documented as the actual method used, not silently claimed as a full live test
- [x] 7.8 Re-enable JavaScript and confirm the JOS-53 entrance/scroll-exit animation still runs correctly (no regression) — confirmed, CTA row addition did not break `useScroll`/`scrollYProgress`
- [x] 7.9 Document outcomes (with screenshots where useful) in `openspec/changes/hero-content-and-ctas/reports/2026-07-18-step-7-browser-verification.md`

## 8. Update Technical Documentation (MANDATORY)

- [x] 8.1 Updated `README.md`: new "Component tests" note (RTL + jsdom pragma, why `environmentMatchGlobs` wasn't used) and a new "Static assets" section documenting `public/resume.pdf`
- [x] 8.2 Confirmed no other documentation (content-authoring-guide, PRD decisions log) needs updating — this story consumes existing content fields without changing the content model
