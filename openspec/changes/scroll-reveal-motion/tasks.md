## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Created `feature/scroll-reveal-motion` from `main` (post-JOS-106, commit `d5b1c78`)
- [x] 0.2 Verified: `git branch --show-current` → `feature/scroll-reveal-motion`
- [x] 0.3 Confirmed — JOS-108 merged (PR #44, confirmed earlier this session, `--accent` token present in `app/globals.css`). `components/motionPace.ts` (the shared pace token this change must reuse) confirmed present

## 1. Fail-visible foundation — build this FIRST (AC: "Revealed content is never left permanently hidden")

Deliberately ordered before any visual work. Building the reveal first and adding
the safety net after is how content ends up permanently hidden in an edge case
nobody exercised.

- [ ] 1.1 Add failing tests: with JavaScript disabled every heading and section renders at full opacity and zero offset; and if the reveal trigger never fires, content is still readable
- [ ] 1.2 Choose and implement the fail-visible strategy — content readable unless something actively animates it in, rather than hidden until something actively reveals it (design.md Decision 2)
- [ ] 1.3 Extend the `<noscript>` override pattern already used by `HeroFramer`/`HeroLaptop`/`HeroLaptop`'s light layers to cover every new revealed element
- [ ] 1.4 Verify the reveal is idempotent: once revealed, scrolling away and back does not reset content to hidden

## 2. Heading reveal — cross-fade construction (AC: "Headings reveal with a blur-up treatment that animates only opacity and transform")

- [ ] 2.1 Add failing tests asserting **no element animates a blur radius** — the static blur must be a fixed property, and only `opacity`/`transform` may animate. Assert `filter` is never among the animated properties
- [ ] 2.2 Build the split-heading component: per character, a pre-blurred ghost copy and a sharp copy, stacked
- [ ] 2.3 Animate only the two opacities plus a shared `translateY` rise, with the per-character stagger
- [ ] 2.4 Derive duration and easing from JOS-108's shared pace token
- [ ] 2.5 Apply the per-character treatment **only to short display and section headings.** Longer chapter and project titles reveal as whole blocks — the worst real case is "Senior Software Development Manager at Tata Consultancy Services (Banco de Crédito del Perú account)", where per-character doubling is both costly and worse-looking (design.md Risk 4)

## 3. The two invisible correctness traps (AC: accessible name + selection requirements)

Neither of these is visible on screen. Both would ship silently.

- [ ] 3.1 Add a failing test asserting a revealed heading's accessible name is its full unbroken text, not a character sequence
- [ ] 3.2 Add a failing test asserting the heading's text content appears exactly **once** when extracted — the ghost must not double it
- [ ] 3.3 Implement: full accessible name on the heading, split elements hidden from the accessibility tree
- [ ] 3.4 Implement: the ghost layer is excluded from text selection, so copying yields the text once rather than `JJoossee  MMuuññoozz`
- [ ] 3.5 **Verify by actually selecting and copying a heading in a real browser.** A DOM test can assert the property is set; only a real copy proves the clipboard is right
- [ ] 3.6 Confirm the split introduces no additional headings or landmarks and preserves heading level and order — `accessibilityStructure.test.tsx` already regression-tests this

## 4. Section entrance reveals (AC: "Reveals are scoped to headings and section entrances")

- [ ] 4.1 Add failing tests: a section entrance reveals as a whole; and career chapter body text, dates, and metrics are **not** individually gated
- [ ] 4.2 Implement section entrance reveals using the `IntersectionObserver` pattern `CareerTimeline` already establishes — including its scroll-listener fallback for the case where an observer callback never fires (design.md Decision 6)
- [ ] 4.3 Confirm the scope limit holds: substantive content (chapter body, dates, role descriptions, metrics, skill evidence links) is present and readable without waiting on a reveal. In-page browser search must find text that has not been scrolled to (design.md Decision 3)

## 5. Reduced motion (AC: "Reveals collapse to fade-only under reduced motion")

- [ ] 5.1 Add failing tests: under `prefers-reduced-motion: reduce` there is no rise, no positional change, and no blur-to-sharp cross-fade — opacity only
- [ ] 5.2 Implement using the existing `prefersReducedMotion ? … : …` pattern from `HeroLaptop.tsx`/`HeroFramer.tsx`
- [ ] 5.3 Confirm the reveal is not merely slowed — movement is removed, not stretched
- [ ] 5.4 Confirm all content still reaches its fully visible final state under reduced motion

## 6. Review and Update Existing Unit Tests (MANDATORY)

- [ ] 6.1 Review `accessibilityStructure.test.tsx` — per-character splitting directly affects heading structure, which this file regression-tests
- [ ] 6.2 Review `CareerChapters.*.test.tsx`, `SkillsSection.test.tsx`, `ProjectsSection.test.tsx` and their `.ssr.` variants for assertions on text content that per-character splitting or the ghost copy could disturb
- [ ] 6.3 Review `HeroFramer.test.tsx` if the hero display heading adopts the split treatment
- [ ] 6.4 Confirm no test was weakened to pass — particularly any that asserts on `textContent`

## 7. Run Unit Tests and Verify State (MANDATORY)

- [ ] 7.1 Run targeted tests for the changed modules
- [ ] 7.2 Run the full suite: `npx vitest run`
- [ ] 7.3 Run `npx tsc --noEmit` clean
- [ ] 7.4 Run `npm run validate:content` clean
- [ ] 7.5 Run `npm run lint` (pre-existing repo-wide ESLint config failure — no `eslint.config.js`; skip with the same rationale as prior stories)
- [ ] 7.6 Database state verification: **N/A** — no backend/database in this repo (CLAUDE.md §9). Record the rationale in the report
- [ ] 7.7 Create report `openspec/changes/scroll-reveal-motion/reports/YYYY-MM-DD-step-7-unit-test-and-state-verification.md`

## 8. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [ ] 8.1 **N/A** — no endpoint or API route is touched. Record the rationale in the Step 9 report

## 9. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

- [ ] 9.1 Start the dev server and drive a real browser
- [ ] 9.2 **Copy a revealed heading and paste it.** Confirm the text appears once. This is the defect most likely to reach production, and it is invisible in a screenshot (task 3.5)
- [ ] 9.3 Scroll the full document and confirm every section reveals, and that nothing is left blank
- [ ] 9.4 **Deliberately exercise the fail-visible path** — e.g. scroll rapidly to the bottom before observers settle, and reload deep-linked to a mid-page anchor. Confirm no section is ever left hidden (design.md Decision 2)
- [ ] 9.5 Use the browser's in-page find to search for text in an unscrolled section and confirm it is found — gated content would not be
- [ ] 9.6 Verify with JavaScript disabled: every heading and section fully visible in final state
- [ ] 9.7 Verify the cross-fade actually reads as a blur-up rather than as a crossfade artifact. **If it disappoints, stop and report** rather than silently switching to an animated blur — that would require amending a thrice-affirmed requirement and is the owner's call (design.md Risk 3)
- [ ] 9.8 Verify under `prefers-reduced-motion` if achievable with the available tooling; if not, document the limitation and the substitute unit coverage, per the precedent in JOS-105's Step 11 report
- [ ] 9.9 Profile a reveal and confirm 60fps with only `opacity`/`transform` animating, or document why a representative profiling run was not achievable
- [ ] 9.10 Capture before/after screenshots and, if possible, a short capture — a still image cannot show a reveal
- [ ] 9.11 Create report `openspec/changes/scroll-reveal-motion/reports/YYYY-MM-DD-step-9-browser-verification.md`, including the curl N/A rationale

## 10. Build sanity (NOT a performance gate — owner decision 2026-08-13)

- [ ] 10.1 Run `npm run build` and confirm it succeeds
- [ ] 10.2 Confirm no new dependency (`framer-motion` is already present and lazily loaded; `IntersectionObserver` is built in)
- [ ] 10.3 Confirm nothing was added to the Cloudflare Worker bundle — client code ships as a static asset, but re-measure given JOS-106's tight ceiling

## 11. Update Technical Documentation (MANDATORY)

- [ ] 11.1 Update `CLAUDE.md` §9 if the architecture description needs the reveal system
- [ ] 11.2 Record the "reveals at the seams, never on the substance" scope rule somewhere a future implementer will encounter it before extending reveals into chapter content

## 12. OpenSpec sync

- [ ] 12.1 After merge, sync `specs/site-scroll-reveal/` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
