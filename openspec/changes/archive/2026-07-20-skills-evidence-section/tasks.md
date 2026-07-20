## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-59-41-skills-section-with-evidence-links` (Linear-provided branch name for JOS-59) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with prior changes on this repo, there
is no backend/database, so curl/database-state steps from
docs/openspec-tasks-mandatory-steps.md don't apply. This is a content-lib +
frontend component change; applicable mandatory gates are TDD unit tests,
`npx vitest run`, `npx tsc --noEmit`, `npm run validate:content`, and
in-browser manual verification via claude-in-chrome tools, all
agent-executed.
-->

## 1. Write failing tests first (TDD)

- [x] 1.2 Failing test in `lib/content/validate.test.ts` (alongside its existing dangling-reference tests): `validateContent()` reports an error for a skill with an empty `evidence` array, distinct from the existing dangling-reference error
- [x] 1.3 Failing test in `lib/content/read.test.ts`: `getSkills()` reads and parses `content/skills.yaml` via `SkillSchema`, returning real data
- [x] 1.4 Failing test: `SkillsSection` renders one entry per skill, using real `skills.yaml`-shaped content (not a fixed/hardcoded list)
- [x] 1.5 Failing test: a skill's evidence link(s) point at `#{evidenceId}-projects`, one link per evidence id
- [x] 1.6 Failing test: an evidence link's accessible name includes both the skill name and the linked chapter
- [x] 1.7 Failing test (SSR, `renderToStaticMarkup`, `components/SkillsSection.ssr.test.tsx`): skills and evidence links are present in server-rendered HTML with real `href`s
- [x] 1.8 Run the new tests and confirm they fail for the expected reason — confirmed: `getSkills is not a function`, `Cannot find module './SkillsSection'`, and the empty-evidence validation test failing (schema didn't reject it yet)

## 2. Implement

- [x] 2.1 Add `.min(1)` to `SkillSchema.evidence` in `lib/content/schemas.ts`
- [x] 2.2 Add `getSkills()` to `lib/content/read.ts`, parallel to `getExperiences()`/`getProfile()`
- [x] 2.3 Create `components/SkillsSectionStyles.ts` matching existing dark/zinc palette conventions
- [x] 2.4 Create `components/SkillsSection.tsx`: joins `getSkills()` output against `getExperiences()` to resolve each evidence id to a company/role label; renders one evidence link per id at `#{evidenceId}-projects`; no `"use client"` (server component)
- [x] 2.5 Mount `<SkillsSection skills={skills} experiences={experiences} />` in `app/page.tsx`, after `CareerChapters`

## 3. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 3.1 Run `npx vitest run` and confirm all new tests pass and no regressions — 14 files, 66/66 tests pass
- [x] 3.2 Run `npx tsc --noEmit` and confirm no type errors — clean
- [x] 3.3 Run `npm run validate:content` and confirm it still passes against the real `/content` tree — passes; confirmed the `.min(1)` tightening didn't break the real `skills.yaml` (all 6 entries already have ≥1 evidence id)

## 4. Manual verification in browser (MANDATORY - AGENT MUST EXECUTE)

- [x] 4.1 Start the dev server and load the page via claude-in-chrome tools
- [x] 4.2 Scroll to the skills section and verify all 6 real skills render with their real evidence links (Oracle/Envato as applicable) — confirmed via screenshot
- [x] 4.3 Click an evidence link and verify it navigates to the matching chapter's Projects section — confirmed: URL updated to `#envato-projects`
- [x] 4.4 Inspect an evidence link's accessible name directly in the DOM (not just visually) to confirm it names both the skill and the chapter — confirmed for all 6 skills' evidence links via direct DOM inspection
- [x] 4.5 Verify skills and evidence links are present in the server-rendered HTML (via page source/text inspection) before any client JS executes — confirmed present in `document.documentElement.outerHTML`

## 5. Documentation and review

- [x] 5.1 Confirm no technical documentation needs updating — confirmed, no changes needed
- [x] 5.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents) — reviewed and merged via PR #13
