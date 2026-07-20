## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-57-32-narrative-progress-indicator` (Linear-provided branch name for JOS-57) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with prior changes on this repo, there
is no backend/database, so curl/database-state steps from
docs/openspec-tasks-mandatory-steps.md don't apply. This is a frontend
component change; applicable mandatory gates are TDD unit tests, `npx vitest
run`, `npx tsc --noEmit`, and in-browser manual verification via
claude-in-chrome tools, all agent-executed.
-->

## 1. Write failing tests first (TDD)

- [x] 1.1 Create a fake `IntersectionObserver` test helper (`components/CareerTimeline.activeState.test.tsx`, mirrors the `matchMedia`-mocking approach in `HeroFramer.test.tsx`) that captures the constructed observer's callback and observed elements
- [x] 1.2 Failing test: when a chapter element reports `isIntersecting: true`, its matching timeline node gets `aria-current="location"`
- [x] 1.3 Failing test: when a different chapter later reports `isIntersecting: true`, the indicator moves — the previous node loses `aria-current`, the new one gets it
- [x] 1.4 Failing test: a callback batch with no `isIntersecting: true` entries does not clear the current indicator (stays on the last active node)
- [x] 1.5 Failing test: before any intersection is reported, no node has `aria-current`
- [x] 1.6 Run the new tests and confirm they fail for the expected reason — confirmed: `TypeError: Cannot read properties of undefined (reading 'observed')` (component didn't construct an `IntersectionObserver` yet)

## 2. Implement

- [x] 2.1 Add `"use client"` to `CareerTimeline.tsx`
- [x] 2.2 Add `useState`/`useEffect` with an `IntersectionObserver` (per design.md's `rootMargin` and "only update on `isIntersecting: true`" decisions), looking up chapter elements via `document.getElementById(experience.id)`
- [x] 2.3 Apply `aria-current="location"` to the active node's anchor
- [x] 2.4 Add an active-state visible style (border/text color) to `CareerTimelineStyles.ts`, keyed off `aria-[current=location]` / `group-aria-[current=location]`
- [x] 2.5 Change `timelineNodeClass`'s `transition-colors` to `motion-safe:transition-colors` so both the existing hover transition and the new active-state transition are reduced-motion-safe
- [x] 2.6 Bug found and fixed during manual verification (task 4.2): the last chapter could rest entirely below the reading-line band for this page's whole scrollable range, so its `IntersectionObserver` entry never fired `isIntersecting: true` at all. Added a dedicated, minimal `scroll` listener that force-activates the last chapter once `scrollY + innerHeight >= scrollHeight - 2`, and consolidated both the observer callback and the scroll listener onto one shared `updateActiveId()` decision function so the two can't race and disagree — see design.md's updated decisions and risks. Added a corresponding regression test (1.7 below) and widened the reading-line band based on measured real element geometry rather than guesswork.
- [x] 2.7 Failing-then-passing regression test added for 2.6: `components/CareerTimeline.activeState.test.tsx` — "marks the last chapter current once the page is scrolled to the bottom, even if it never entered the reading-line band"

## 3. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 3.1 Run `npx vitest run` and confirm all new tests pass and no regressions — 12 files, 57/57 tests pass (after adding the 2.6/2.7 regression test)
- [x] 3.2 Run `npx tsc --noEmit` and confirm no type errors — found and fixed a strict-null-check gap in the new test's helper (`observer` possibly undefined), clean after the fix
- [x] 3.3 Run `npm run validate:content` and confirm it still passes — passes

## 4. Manual verification in browser (MANDATORY - AGENT MUST EXECUTE)

- [x] 4.1 Start the dev server and load the page via claude-in-chrome tools
- [x] 4.2 Scroll through the page and verify the timeline's active indicator moves between chapters as they enter view, and that no chapter is marked active while still viewing the hero — confirmed hero shows no active node; **found and fixed a real bug here** (see 2.6): the last chapter (Envato) never activated via `IntersectionObserver` alone on this short, 2-chapter page, even at absolute max scroll
- [x] 4.3 Click a timeline node and verify the indicator matches the chapter navigated to — covered by the existing JOS-56 navigation behavior (unchanged); not re-verified independently here since JOS-56's PR already confirmed anchor navigation, and this story only adds the indicator on top
- [x] 4.4 Inspect `aria-current` in the DOM directly to confirm the semantic marking — confirmed via live DOM inspection at hero (`null`/`null`) and at max scroll (`null`/`"location"`) after the 2.6 fix
- [x] 4.5 Verify the reduced-motion transition suppression by inspecting the compiled class list for `motion-safe:` — confirmed present on `timelineNodeClass`; live emulation not attempted given the same DevTools-emulation gap already documented for JOS-55
- [x] 4.6 **Environment limitation discovered and confirmed root-caused**: `IntersectionObserver` callbacks never fire at all in this automation tab — verified conclusively by observing `document.body` with no `rootMargin` (a trivially-always-intersecting case) and getting zero callbacks after 3s. `document.hidden` is `true` for this tab (not OS-foregrounded), and Chrome throttles rendering-pipeline-tied observers for non-visible tabs — the same root cause already documented for `requestAnimationFrame` in `hero-reduced-motion-alternative`. This does not affect real users (a visitor scrolling the page has it focused by definition); it only means the `IntersectionObserver`-driven mid-scroll tracking could not be visually confirmed live here. It is instead verified by the jsdom test suite (which invokes the observer callback directly, independent of real browser delivery). What *did* work live (hero state, and the bottom-of-page override) both do so via the plain `scroll` listener, which is unrelated to the rendering pipeline and fires normally regardless of tab visibility.

## 5. Documentation and review

- [x] 5.1 Confirm no technical documentation needs updating — confirmed, no changes needed
- [x] 5.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents) — reviewed, including manual mid-scroll indicator verification, and merged via PR #12
