## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Created `feature/editorial-frame` from `main` (post-JOS-108-merge `main`, commit `00ce6e7`)
- [x] 0.2 Verified: `git branch --show-current` → `feature/editorial-frame`
- [x] 0.3 Confirmed — JOS-108 merged to `main` via PR #44 (`00ce6e7`, "[JOS-108] Add site-wide typography, palette, and motion pace tokens"). Rebased this branch onto post-merge `main`; `--ink`/`--ink-body`/`--ink-meta`/`--hair`/`--accent` tokens and `lib/fonts.ts` confirmed present

## 1. Section anchor targets (prerequisite — AC: "Every navigable section has a stable anchor target")

- [x] 1.1 Added `components/siteNavigation.ts` (shared `siteNavItems` array — single source for both this test and the header built in Task 2) and a failing test `components/siteNavigation.test.tsx` asserting every `href` fragment resolves via `container.querySelector`. Confirmed it failed first (`expected null not to be null`) before adding ids
- [x] 1.2 Added `id="career"` (`CareerChapters.tsx`), `id="skills"` (`SkillsSection.tsx`), `id="projects"` (`ProjectsSection.tsx`). `ContactSection` already had `id="contact"`. Test now passes; existing `SkillsSection`/`ProjectsSection`/`CareerChapters` (+ `.ssr`) suites all still green — 22/22 tests across all 7 files
- [x] 1.3 Confirmed via read of `CareerChapter.tsx:25` — `<details id={experience.id}>` is per-chapter, untouched by the section-level `id` additions above (different DOM nodes)

## 2. The header (AC: "A persistent header frames every page view")

- [x] 2.1 Added `components/SiteHeader.test.tsx` (failing first — `SiteHeader` module didn't exist): header landmark (`role=banner`), brand text, one nav link per `siteNavItems` entry, nav accessible name distinct from `"Career timeline"`, contact action → `#contact`. Caught a real design issue mid-TDD: an initial `siteNavItems` including a "Contact" entry produced **two** identically-named "Contact" links inside one header (nav item + dedicated pill) — `getByRole("link", {name:"Contact"})` failed with "multiple elements found". Fixed by removing Contact from `siteNavItems` (nav = Career/Skills/Projects only; the header's own pill is the sole contact action, documented in `siteNavigation.ts`)
- [x] 2.2 Built `components/SiteHeader.tsx` + `SiteHeaderStyles.ts` — brand wordmark (letterspaced, links to `#main`), section nav (`aria-label="Site sections"`), contact pill (`#contact`). Two-row layout at every width (utility row + horizontally-scrollable nav row, same-DOM principle as `CareerTimelineStyles.ts`) rather than hiding nav under a breakpoint — pre-empts Task Group 8's requirement that nav stay in the tab order at every width
- [x] 2.3 Mounted `<SiteHeader brandName={name} />` in `app/(marketing)/layout.tsx` directly after `<SkipToContentLink />` (added `name` to the existing `getProfile()` destructure)
- [x] 2.4 Extended `accessibilityStructure.test.tsx`'s composed-surfaces test to render `SiteHeader` + `CareerTimeline` together (both `<nav>`s + the new `<header>`) — `axe` reports no violations, confirming landmark-unique and heading order hold with two navs present. Required adding a no-op `IntersectionObserver` stub to this file (jsdom has none — same documented gap as `CareerTimeline.activeState.test.tsx`); all 5 tests in the file pass
- [x] 2.5 Documented in `SiteHeader.tsx` inline (design.md Decision 7 cited directly): "hero CTAs scroll away, the header persists"

## 3. Anchor clearance — the collision most likely to ship broken (AC: "Fixed chrome does not obscure the targets it navigates to")

- [x] 3.1 Added `components/anchorClearance.test.tsx` (failing first — no `[id]` rule existed), reading `app/globals.css`'s raw source (same technique as `palette.test.tsx`, since jsdom has no CSS engine to resolve `scroll-margin-top` against real layout). Deliberately a **universal `[id]` selector test**, not three separate per-family assertions — a single rule covering all id'd elements structurally covers header nav targets, the timeline's per-chapter dynamic ids, and `#main` at once, which is the direct fix for design.md's own named risk ("easy to under-apply... forgetting the timeline's is the likely failure")
- [x] 3.2 Added `[id] { scroll-margin-top: 7rem; }` (112px) to `app/globals.css`, sized to clear the header's real 96px height (`SiteHeaderStyles.ts`: `h-14` + `h-10`) with margin
- [x] 3.3 Completed in Task Group 12 (Step 12 report, Scenario 2): header nav link and timeline node both confirmed to land clear of the header in a real browser. The skip link's `#main` target has a nuanced, honestly-documented finding — see report Scenario 4 (not a defect: no real content is ever obscured)

## 4. Skip-link visibility — the second collision (AC: "The skip link remains first and remains visible")

- [x] 4.1 Added `components/skipLinkVisibility.test.tsx`: first-focusable-element check, plus a z-index comparison (`siteHeaderClass`'s `z-30` vs `skipLinkClass`'s `focus:z-50`, exported for this purpose). **Honestly disclosed deviation from strict red-green**: both assertions passed immediately on first run rather than failing — Task 2.2 had already deliberately built the header at `z-30`, explicitly anticipating this exact requirement (see `SiteHeaderStyles.ts`'s own comment, written during Task 2, citing design.md Decision 3 by name). Not retrofitted after the fact; the test formalizes and locks in a decision made ahead of this task group, mirroring the same class of disclosed deviation as JOS-108's task 11.2
- [x] 4.2 Already resolved as part of Task 2.2's header build — `siteHeaderClass`'s `z-30` is deliberately below `SkipToContentLink`'s `focus:z-50`, so DOM order (skip link renders first, before the header) plus the lower z-index together guarantee the focused skip link stacks above the header, not beneath it
- [x] 4.3 Completed in Task Group 12 (Step 12 report, Scenario 3): skip link focused in a real browser, confirmed rendering in front of the header (its outline overlapping the brand text behind it)

## 5. Grid overlay (AC: "The grid overlay is decorative only")

- [x] 5.1 Added `components/GridOverlay.test.tsx` (failing first — module didn't exist): `aria-hidden="true"`, no focusable descendants, `pointer-events-none` present, `container.textContent === ""`
- [x] 5.2 Built `components/GridOverlay.tsx` + `GridOverlayStyles.ts` — a horizontal rule at `top-24` (the header's real 96px height) plus a `max-w-3xl` column's vertical hairlines (matching every section's own content width), both `border-hair`. Mounted in `app/(marketing)/layout.tsx` right after `HeroLaptop`, sharing its `-z-10` stacking approach so both fixed layers stay behind all normal-flow content
- [x] 5.3 The component renders exactly two empty `<div>`s (rule + column) — no text node exists to place, by construction. `GridOverlay.test.tsx`'s `textContent === ""` assertion guards this permanently, not just at time of writing

## 6. Timeline restyled as the editorial rail (AC: the MODIFIED timeline requirement)

- [x] 6.1 **No new test needed, and disclosed as such**: `CareerTimeline.test.tsx`'s existing "shows the company and formatted date range as visible text" and "gives each node an accessible name including role, company, and date range" tests already assert exactly this. Since the restyle only ever touches `CareerTimelineStyles.ts` (a stylesheet, no component-prop/DOM-role changes), this pre-existing coverage is the correct gate for 6.1, and is exactly what 6.3 requires stay green unmodified
- [x] 6.2 Restyled `CareerTimelineStyles.ts` — replaced the previous per-node `border-l-2` segments with a continuous hairline spine (`timelineSpineClass`, a `<span>` sibling of the `<ol>` inside `<nav>`, `md:` only — mobile keeps a per-node marker without a connecting line since that layout scrolls horizontally) plus a per-node marker dot (`timelineMarkerClass`: resting = `--hair`, hover = `--ink-meta`, current chapter = `--ink` and filled slightly larger) — closer to design.md's literal "hairline spine with a fill/marker" than disconnected border segments. `CareerTimeline.tsx` updated only to render the two new `aria-hidden` decorative spans; no prop, anchor, or ARIA attribute touched
- [x] 6.3 Confirmed — `CareerTimeline.test.tsx`, `.activeState.test.tsx`, `.ssr.test.tsx` (17 tests) all pass **unmodified**. Ran alongside `accessibilityStructure.test.tsx`'s composed-surfaces test too (still passing) to catch any cross-component regression
- [x] 6.4 Added `components/CareerTimelineStyles.test.tsx` (new — no `CareerTimelineStyles.test.tsx` existed before): confirms `timelineMarkerClass`'s only transition is `motion-safe:transition-colors` (no unconditional `transition`/`transition-*` utility), and that the marker's active-state size change (`h-2 w-2` → `h-2.5 w-2.5`) has no `transition-[...]`/`transition-all` pairing — a plain, un-animated property jump at every motion preference, by construction, not just under `prefers-reduced-motion`

## 7. One indicator only (AC: "The frame introduces no second scroll-position indicator")

- [x] 7.1 Added `components/oneScrollIndicator.test.tsx`: renders the composed frame (`SiteHeader` + `GridOverlay` + `CareerTimeline`) and asserts every `[aria-current]` element found traces back to `nav[aria-label="Career timeline"]`; separately asserts `SiteHeader` and `GridOverlay` each render zero `aria-current`-capable elements on their own — a structural guarantee, not just "happens not to today"
- [x] 7.2 Confirmed by the same test: neither `SiteHeader` (Task Group 2) nor `GridOverlay` (Task Group 5) introduces any element capable of indicating scroll position — the site's only such mechanism remains `CareerTimeline`'s `aria-current="location"`, matching the owner's IA decision (design.md Decision 2)

## 8. Small viewports (AC: "The frame adapts on small viewports without trapping content")

- [x] 8.1 Added `components/smallViewport.test.tsx`. First assertion (nav never `hidden`, every nav link `toBeVisible()`) passed immediately — Task 2.2 already built the header's two-row same-DOM layout anticipating this. Second assertion (a short-viewport height adaptation exists) genuinely failed first, confirming real work was needed
- [x] 8.2 Added a `[@media(max-height:480px)]:` compact mode to `SiteHeaderStyles.ts` — both header rows shrink (`h-14`→`h-10`, `h-10`→`h-8`) on short viewports (e.g. a landscape phone) rather than persisting at full height (design.md Risk). Height-only change, nothing hidden — every nav link stays in the document and tab order at every viewport. Also updated `GridOverlayStyles.ts`'s header-rule position with a matching `[@media(max-height:480px)]:top-[72px]` override, since the rule is pinned to the header's real height and would otherwise leave a gap once the header itself shrinks
- [x] 8.3 Completed in Task Group 12 (Step 12 report, Scenario 5): verified at ~500px width — grid legible, one minor non-blocking observation noted (vertical hairlines coincide with viewport edges at narrow widths, doesn't affect legibility since no text sits near them)

## 9. Review and Update Existing Unit Tests (MANDATORY)

- [x] 9.1 Reviewed (done inline during Task 6.3) — none of the three files assert on className/style, only roles/text/attributes, so the restyle needed zero modification to any of them; all 17 tests still pass
- [x] 9.2 `accessibilityStructure.test.tsx` — already extended in Task 2.4 (composed test now renders `SiteHeader` + `CareerTimeline` together). `focusVisibility.test.tsx` — added a new case asserting `siteHeaderBrandClass`/`siteHeaderContactLinkClass`/`siteHeaderNavLinkClass` all carry the shared `focus-visible:outline` ring, following the file's own existing per-surface pattern
- [x] 9.3 Confirmed by reading `app/admin/layout.tsx` — a fully independent root layout that never imports `SiteHeader`/`GridOverlay` (both mount only in `app/(marketing)/layout.tsx`). Added an explicit `expect(screen.queryByRole("banner")).not.toBeInTheDocument()` assertion to `app/admin/layout.test.tsx`'s existing "no public marketing chrome" test, so the non-leak guarantee is locked in by a test rather than left implicit
- [x] 9.4 Confirmed — every change in this task group either added a new assertion or fixed a genuine issue found by a test (the header's duplicate "Contact" link, Task 2.1); nothing was loosened, removed, or skipped to force a pass

## 10. Run Unit Tests and Verify State (MANDATORY)

- [x] 10.1 Ran targeted tests for every changed module throughout implementation (per task group), not only at the end
- [x] 10.2 Full suite: `npx vitest run` — **87 files / 431 tests passed**
- [x] 10.3 `npx tsc --noEmit` — clean
- [x] 10.4 `npm run validate:content` — clean
- [x] 10.5 `npm run lint` — same pre-existing repo-wide `eslint.config.js` gap as prior stories; not introduced by this change, skipped with the same rationale
- [x] 10.6 Database state verification: **N/A** — no backend/database in this repo (`AGENTS.md`/`CLAUDE.md` §9). Rationale recorded in the report
- [x] 10.7 Report created: `openspec/changes/editorial-frame/reports/2026-08-14-step-10-unit-test-and-state-verification.md`

## 11. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [x] 11.1 **N/A** — no endpoint or API route is touched (header, grid overlay, and timeline restyle are all static DOM/CSS). Rationale recorded in `reports/2026-08-14-step-12-browser-verification.md`

## 12. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

- [x] 12.1 Started `npm run dev` and drove real Chrome via `mcp__claude-in-chrome`
- [x] 12.2 Measured header/timeline/hero/chat-trigger via `getBoundingClientRect()`. Widths actually achieved (see report's Known Limitation — `resize_window` only worked reliably once per fresh tab): ~1546px and ~500px, not the exact requested 1280/1440/1920. No overlap at either: timeline starts 51.75px below the header's bottom edge; hero `<h1>` is 100px+ clear at both widths
- [x] 12.3 Activated a header nav link ("Skills") and a timeline node ("Tiempo Development") — both landed clear of the header (~112–116px vs. header's 96px bottom). Activated the skip link too; see 12.9's report Scenario 4 for a nuanced, honestly-documented finding on `#main` specifically
- [x] 12.4 Focused the skip link via direct `.focus()` (literal Tab-key simulation proved unreliable in this sandbox, documented as a limitation) — screenshot confirms it renders in front of the header, its outline overlapping the brand text behind it, not hidden beneath it
- [x] 12.5 Verified at ~500×729 (requested 400×850 — same `resize_window` imprecision as 12.2): header stays full-height (above the 480px compact-mode threshold), all three nav links visible with no clipping/scrolling needed, timeline correctly drops out of fixed positioning below `md:` and renders in normal flow with no overlap. One minor, non-blocking observation: the grid's vertical hairlines coincide with the viewport edges at this width (nothing to constrain the `max-w-3xl` column against) — barely visible, doesn't affect legibility
- [x] 12.6 Verified via source review (no JS-disabled toggle exposed by available tooling, documented as a limitation): `grep -n "onClick"` across `SiteHeader.tsx`/`CareerTimeline.tsx`/`SkipToContentLink.tsx` returns no matches — every link is a plain native anchor
- [x] 12.7 Not achievable with available tooling (no `prefers-reduced-motion` emulation exposed, same class of gap as JOS-105/108). Substitute verification: `CareerTimelineStyles.test.tsx` (Task 6.4)
- [x] 12.8 Captured and saved a desktop screenshot plus in-conversation screenshots for mobile, skip-link-focused state, and each anchor destination
- [x] 12.9 Report created: `openspec/changes/editorial-frame/reports/2026-08-14-step-12-browser-verification.md`

## 13. Update Technical Documentation (MANDATORY)

- [x] 13.1 `CLAUDE.md` is a symlink to `AGENTS.md` (per §6) — edited the canonical `AGENTS.md` directly. Added a bullet documenting `SiteHeader.tsx`/`siteNavigation.ts`, `GridOverlay`, and the "CareerTimeline is the site's one and only scroll-position indicator" rule; extended the existing `app/globals.css` bullet with the new `[id] { scroll-margin-top }` rule. Verified via `grep -c "SiteHeader.tsx" CLAUDE.md` that the symlink correctly reflects the change
- [x] 13.2 Already satisfied without further action needed: the "one indicator" rule is recorded in both `openspec/changes/editorial-frame/specs/site-editorial-frame/spec.md` ("The frame introduces no second scroll-position indicator") and the amended `career-timeline-navigation` requirement — exactly matching design.md Decision 2's stated intent ("written into both capabilities... requirements get checked"). Also cross-referenced from `AGENTS.md` §9 (13.1) and enforced by `components/oneScrollIndicator.test.tsx`

## 14. OpenSpec sync

- [ ] 14.1 After merge, sync `specs/site-editorial-frame/` and `specs/career-timeline-navigation/` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
