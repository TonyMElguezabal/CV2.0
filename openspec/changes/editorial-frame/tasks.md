## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Created `feature/editorial-frame` from `main` (post-JOS-108-merge `main`, commit `00ce6e7`)
- [x] 0.2 Verified: `git branch --show-current` → `feature/editorial-frame`
- [x] 0.3 Confirmed — JOS-108 merged to `main` via PR #44 (`00ce6e7`, "[JOS-108] Add site-wide typography, palette, and motion pace tokens"). Rebased this branch onto post-merge `main`; `--ink`/`--ink-body`/`--ink-meta`/`--hair`/`--accent` tokens and `lib/fonts.ts` confirmed present

## 1. Section anchor targets (prerequisite — AC: "Every navigable section has a stable anchor target")

- [ ] 1.1 Add a failing test asserting every header nav link's `href` fragment resolves to an element that exists in the document
- [ ] 1.2 Add `id` attributes to the Skills, Projects, and career-chapters sections (only `ContactSection` has one today — design.md Decision 5)
- [ ] 1.3 Confirm the per-chapter `<details>` ids the timeline already depends on are untouched

## 2. The header (AC: "A persistent header frames every page view")

- [ ] 2.1 Add failing tests: a `<header>` landmark exists containing brand, nav, and contact action; its `<nav>` has an accessible name distinct from the timeline's `"Career timeline"`
- [ ] 2.2 Build the header component and styles — brand wordmark, section nav, contact pill
- [ ] 2.3 Mount it in `app/(marketing)/layout.tsx` **after** `SkipToContentLink`, so the skip link stays first in the tab order
- [ ] 2.4 Verify with the existing `accessibilityStructure.test.tsx` harness that adding a second `<nav>` and a `<header>` keeps landmark/heading order valid
- [ ] 2.5 Note in code why the contact action duplicates a hero CTA (design.md Decision 7) — hero CTAs scroll away, the header persists

## 3. Anchor clearance — the collision most likely to ship broken (AC: "Fixed chrome does not obscure the targets it navigates to")

- [ ] 3.1 Add failing tests covering **all three** anchor families, not just the header's own: header nav targets, timeline chapter targets, and the skip link's `#main`
- [ ] 3.2 Apply `scroll-margin-top` clearance to every anchor destination
- [ ] 3.3 Verify in a real browser — activate a header link, a timeline node, and the skip link, and confirm each destination lands *below* the header rather than beneath it. This presents as "clicking a chapter feels broken", not as an error, so it will not surface in unit tests alone

## 4. Skip-link visibility — the second collision (AC: "The skip link remains first and remains visible")

- [ ] 4.1 Add a failing test asserting the skip link is the first focusable element with the header mounted
- [ ] 4.2 Resolve the stacking conflict: `SkipToContentLink` renders at `focus:top-4 focus:left-4 focus:z-50` — exactly where the header sits. Ensure the focused skip link renders above the header, not beneath it
- [ ] 4.3 **Verify by focusing it in a real browser.** A DOM-presence test passes even when the link is completely hidden under the header — which would silently break an accepted `accessibility-compliance` requirement

## 5. Grid overlay (AC: "The grid overlay is decorative only")

- [ ] 5.1 Add failing tests: the grid is `aria-hidden`, is not focusable, does not intercept pointer events, and contains no text nodes
- [ ] 5.2 Build the grid — vertical hairlines plus the horizontal rule under the header, using JOS-108's `--hair` token
- [ ] 5.3 Confirm no text is ever placed inside the grid. `--hair` is 3.47:1 — compliant for borders, **non-compliant for normal-size text** (design.md Decision 6)

## 6. Timeline restyled as the editorial rail (AC: the MODIFIED timeline requirement)

- [ ] 6.1 Add failing tests: after restyling, each node still visibly shows company and date range, and its accessible name still includes role + company + dates
- [ ] 6.2 Restyle `CareerTimelineStyles.ts` to read as an editorial rail — hairline spine with a fill/marker for the current chapter
- [ ] 6.3 **Change no behaviour.** The anchors, `IntersectionObserver`, scroll listener, `aria-current="location"`, keyboard operability, and no-JS navigation all stay exactly as shipped. Confirm every existing `CareerTimeline.*.test.tsx` assertion stays green without modification
- [ ] 6.4 Confirm the reduced-motion requirement still holds — indicator changes carry no animated transition under `prefers-reduced-motion`

## 7. One indicator only (AC: "The frame introduces no second scroll-position indicator")

- [ ] 7.1 Add a test asserting no second progress/position indicator component exists
- [ ] 7.2 Confirm no separate progress rail was introduced anywhere in the frame — this is the whole point of the owner's IA decision, and the failure mode is someone adding one later because "the frame should have one" (design.md Decision 2)

## 8. Small viewports (AC: "The frame adapts on small viewports without trapping content")

- [ ] 8.1 Add failing tests for the small-viewport adaptation and for section nav remaining in the document and tab order at every width
- [ ] 8.2 Implement the adaptation — fixed chrome must not overlap content or eat a disproportionate share of a short viewport
- [ ] 8.3 Verify the grid does not reduce legibility on small screens

## 9. Review and Update Existing Unit Tests (MANDATORY)

- [ ] 9.1 Review `CareerTimeline.test.tsx`, `CareerTimeline.activeState.test.tsx`, `CareerTimeline.ssr.test.tsx` for coupling to the old visual classes
- [ ] 9.2 Review `accessibilityStructure.test.tsx` and `focusVisibility.test.tsx` — both are directly affected by a new landmark and new focusable elements
- [ ] 9.3 Review `app/admin/layout.test.tsx`, which asserts the *absence* of marketing chrome — the header must not leak into `/admin`
- [ ] 9.4 Confirm no test was weakened to pass

## 10. Run Unit Tests and Verify State (MANDATORY)

- [ ] 10.1 Run targeted tests for the changed modules
- [ ] 10.2 Run the full suite: `npx vitest run`
- [ ] 10.3 Run `npx tsc --noEmit` clean
- [ ] 10.4 Run `npm run validate:content` clean
- [ ] 10.5 Run `npm run lint` (pre-existing repo-wide ESLint config failure — no `eslint.config.js`; skip with the same rationale as prior stories)
- [ ] 10.6 Database state verification: **N/A** — no backend/database in this repo (CLAUDE.md §9). Record the rationale in the report
- [ ] 10.7 Create report `openspec/changes/editorial-frame/reports/YYYY-MM-DD-step-10-unit-test-and-state-verification.md`

## 11. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [ ] 11.1 **N/A** — no endpoint or API route is touched. Record the rationale in the Step 12 report

## 12. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

- [ ] 12.1 Start the dev server and drive a real browser
- [ ] 12.2 **Verify the collision risk explicitly**: measure the header, the timeline rail, the chat widget, and the hero copy with `getBoundingClientRect()` at 1280 / 1440 / 1920 px and confirm no overlap. JOS-105 shipped a 112px hero/timeline overlap that only surfaced this way
- [ ] 12.3 Activate a header nav link, a timeline node, and the skip link; confirm each destination lands below the header (task 3.3)
- [ ] 12.4 Focus the skip link and confirm it is visible above the header (task 4.3)
- [ ] 12.5 Verify at a small viewport and in landscape on a short viewport
- [ ] 12.6 Verify with JavaScript disabled: header nav and timeline nodes still navigate via native anchors
- [ ] 12.7 Verify under `prefers-reduced-motion` if achievable in the available tooling; if not, document the limitation and the substitute verification, per the precedent set in JOS-105's Step 11 report
- [ ] 12.8 Capture before/after screenshots for owner visual sign-off
- [ ] 12.9 Create report `openspec/changes/editorial-frame/reports/YYYY-MM-DD-step-12-browser-verification.md`

## 13. Update Technical Documentation (MANDATORY)

- [ ] 13.1 Update `CLAUDE.md` §9 if the component architecture description needs the header/grid
- [ ] 13.2 Record the "one position indicator" decision somewhere a future implementer will encounter it

## 14. OpenSpec sync

- [ ] 14.1 After merge, sync `specs/site-editorial-frame/` and `specs/career-timeline-navigation/` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
