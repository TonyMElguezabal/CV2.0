## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-60-42-project-cards` (Linear-provided branch name for JOS-60) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with prior changes on this repo, there
is no backend/database, so curl/database-state steps from
docs/openspec-tasks-mandatory-steps.md don't apply. This is a content +
content-lib + frontend component change; applicable mandatory gates are TDD
unit tests, `npx vitest run`, `npx tsc --noEmit`, `npm run validate:content`,
and in-browser manual verification via claude-in-chrome tools, all
agent-executed.
-->

## 1. Write failing tests first (TDD)

- [x] 1.1 Failing test in `lib/content/read.test.ts`: `getProjects()` reads and parses `content/projects/*.md` frontmatter via `ProjectSchema`, returning real data with project id from filename
- [x] 1.2 Failing test: `getProjects()` splits the body into `problem`/`approach`/`outcome` from `## Problem` / `## Approach` / `## Outcome` headings
- [x] 1.3 Failing test: `ProjectsSection` renders one card per project, with title/company/skills from frontmatter
- [x] 1.4 Failing test: a card's Problem/Approach/Outcome/Metrics render in that fixed order regardless of source section order (fixture with sections reordered in the source)
- [x] 1.5 Failing test (SSR, `renderToStaticMarkup`): project cards are present in server-rendered HTML
- [x] 1.6 Failing test on `ExperienceProjectSchema`/experience parsing: an embedded project's optional `projectId` round-trips through parsing
- [x] 1.7 Failing test: `CareerChapter` renders a "View full project" link (`href="#{projectId}"`) for an embedded project with a `projectId`, and renders no such link when `projectId` is absent
- [x] 1.8 Run the new tests and confirm they fail for the expected reason — confirmed: `getProjects is not a function`, `Cannot find module './ProjectsSection'`, `projectId` undefined, and the "View full project" link not found

## 2. Author content (real facts only, restructured — see design.md decisions)

- [x] 2.1 Create `content/projects/adehub.md` — frontmatter + Problem/Approach/Outcome sourced verbatim from `oracle.yaml`'s `context`, `lessons`, and ADEHub project `outcome`/`metrics`, per the mapping above
- [x] 2.2 Create `content/projects/ai-background-removal.md` — frontmatter + Problem/Approach/Outcome sourced from `envato.yaml`'s background-removal project `outcome`/`metrics`, per the mapping above
- [x] 2.3 Add `projectId: adehub` to `oracle.yaml`'s ADEHub project entry
- [x] 2.4 Add `projectId: ai-background-removal` to `envato.yaml`'s AI background-removal project entry

## 3. Implement

- [x] 3.1 Add optional `projectId: z.string().optional()` to `ExperienceProjectSchema` in `lib/content/schemas.ts`
- [x] 3.2 Add `getProjects()` to `lib/content/read.ts`: reads `content/projects/*.md` via `gray-matter`, parses frontmatter through `ProjectSchema`, splits body into problem/approach/outcome by `## <Name>` headings, computes id from filename
- [x] 3.3 Create `components/ProjectsSectionStyles.ts` matching existing dark/zinc palette conventions
- [x] 3.4 Create `components/ProjectsSection.tsx`: renders one `<article id={project.id}>` per project — title, company, skill tags, then Problem/Approach/Outcome/Metrics in that fixed order; no `"use client"`
- [x] 3.5 Update `components/CareerChapter.tsx`: when an embedded project has `projectId`, render a "View full project" link to `#{projectId}`
- [x] 3.6 Mount `<ProjectsSection projects={projects} />` in `app/page.tsx`, after `SkillsSection`

## 4. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 4.1 Run `npx vitest run` and confirm all new tests pass and no regressions — 17 files, 79/79 tests pass
- [x] 4.2 Run `npx tsc --noEmit` and confirm no type errors — clean
- [x] 4.3 Run `npm run validate:content` and confirm it still passes against the real `/content` tree, now including the two new project files — passes

## 5. Manual verification in browser (MANDATORY - AGENT MUST EXECUTE)

- [x] 5.1 Start the dev server and load the page via claude-in-chrome tools
- [x] 5.2 Scroll to the projects section and verify both real cards render with Problem/Approach/Outcome/Metrics in order — confirmed via screenshot
- [x] 5.3 In the Oracle and Envato chapters, verify the ADEHub and AI background-removal project entries show a "View full project" link, and that other (unlinked) project entries are unchanged — confirmed: link appears exactly under ADEHub, not under the RAG chatbot or ADE-SCM enhancements entries; exactly 2 real anchors in the DOM total (verified via `querySelectorAll`, ruling out the 4x raw-HTML substring match which was just Next.js's duplicated RSC payload script)
- [x] 5.4 Click a "View full project" link and verify it navigates to the matching card — confirmed: URL updated to `#adehub`
- [x] 5.5 Verify project cards are present in the server-rendered HTML before any client JS executes — confirmed via `document.documentElement.outerHTML`

## 6. Documentation and review

- [x] 6.1 Confirm no technical documentation needs updating — confirmed, no changes needed
- [ ] 6.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents) — cannot be marked complete by the agent; **please specifically confirm the restructured Problem/Approach/Outcome text for both cards accurately reflects the real projects**, since content was reformatted (not newly authored) from `oracle.yaml`/`envato.yaml`
