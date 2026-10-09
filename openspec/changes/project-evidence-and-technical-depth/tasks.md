## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [ ] 0.1 **Confirm `executive-impact-surface` (JOS-117) has landed on `main`** — this change is sequenced behind it (design.md Decision 1). If it has not, **stop and report**; do not run the two concurrently, and do not silently re-scope
- [ ] 0.2 Create `feature/project-evidence-and-technical-depth` from `main`, pulling first
- [ ] 0.3 Verify: `git branch --show-current`
- [ ] 0.4 Confirm the baseline is green: `npx vitest run lib/content/ components/ProjectsSection.test.tsx` — record the pass count for Task Group 10
- [ ] 0.5 Confirm `.env.local` carries `OPENAI_API_KEY` — this change requires an index rebuild and a live eval run

## 1. Read what JOS-117 already established (do not re-ask it)

- [ ] 1.1 Read `openspec/changes/archive/*-executive-impact-surface/reports/*-extraction-session.md` in full
- [ ] 1.2 List which of this change's technical questions JOS-117 already answered, so Task Group 3 does not re-interview the owner on settled ground
- [ ] 1.3 Note every figure JOS-117 authored into `projects[].metrics` and `projects/*.md` frontmatter — Task Group 5 must not contradict or duplicate them
- [ ] 1.4 Confirm which `skills.yaml` entries JOS-117 added, so this change's technical entries complement rather than collide with its commercial ones

## 2. Schema and validation gate — BEFORE any content is authored (design.md Decisions 2–3)

The gate must exist before the skills it guards, or the first unsubstantiated
claim ships and the gate becomes retroactive cleanup.

- [ ] 2.1 Write failing tests in `lib/content/validate.test.ts`: a skill naming a technology absent from all its evidence chapters fails, with an error naming both the skill and the technology
- [ ] 2.2 Write a failing test that the error is **distinct from** a dangling-reference error — a skill can pass the existing check and fail this one
- [ ] 2.3 Write a failing test that a skill with a technology present in **one of several** evidence chapters passes (any chapter satisfies it, not all)
- [ ] 2.4 Write a failing test that a skill with no technologies list is unaffected — the existing nine entries must validate unchanged
- [ ] 2.5 Write a failing test for the project-evidence case (spec scenario 4): a skill whose evidence includes a project id resolves against that project's chapter technologies
- [ ] 2.6 Add optional `technologies: z.array(z.string()).optional()` to `SkillSchema` in `lib/content/schemas.ts`
- [ ] 2.7 Implement the check in `lib/content/validate.ts`; wire into `cli.ts`
- [ ] 2.8 Run `npx vitest run lib/content/` and `npm run validate:content` — both clean, with the nine existing skills untouched

## 3. Technical extraction session with the owner (AGENT MUST DRIVE)

Scoped to the technical axis only (design.md Decision 1 table). **Do not author
anything during this step.** Collect first.

- [ ] 3.1 **Oracle — cloud.** Which OCI services, used for what. For each: was the architectural decision *owned*, *reviewed*, or *delegated*? What was chosen against, and why? Anything he'd defend in a design review
- [ ] 3.2 **Oracle — AI/LLM.** The real shape of the RAG chatbot work beyond "managed the integration": retrieval design, chunking/document-structure decisions, evaluation, what failed first. The chapter already records the documentation-quality insight — look for what sits under it
- [ ] 3.3 **Envato — AI.** The background-removal model: what he owned in the training/integration split, what the ~6% figure measured, what else was measured
- [ ] 3.4 **Per chapter, ask which `projects[]` entries have a distinct arc** — Problem/Approach/Outcome genuinely different from the chapter's `context`, not a restatement (Decision 4 criterion 1)
- [ ] 3.5 For each candidate project, establish whether its metrics survive the honesty bar and how each is sourced — system, report, review, or recollection (Decision 4 criterion 2)
- [ ] 3.6 **Client naming (Decision 7)**: for every name not already on the site, record cleared or declined, explicitly. Record the declines too
- [ ] 3.7 **Explicitly ask what is NOT defensible.** A capability he used but did not own is recorded as exposure in chapter prose and contributes no skill entry
- [ ] 3.8 **The architecture question, asked plainly**: does the OCI work support a claim of architectural ownership, or was it integration and delivery? **"Integration and delivery" is a valid, complete answer** (Decision 3) — if so, the skill is named for what it was, and that is the process working, not a failed task
- [ ] 3.9 Write the raw extraction to `openspec/changes/project-evidence-and-technical-depth/reports/<date>-technical-extraction-session.md` before any content edit

## 4. Author chapter prose first (design.md Decision 3 — order is fixed)

- [ ] 4.1 Extend the Oracle chapter with the architectural and AI detail from 3.1–3.2 — `context`, `responsibilities`, `projects[]`, or `lessons` as appropriate to each fact
- [ ] 4.2 Extend other chapters where the extraction surfaced technical depth they do not currently carry
- [ ] 4.3 Add any genuinely-used technology missing from a chapter's `technologies[]` — this is what Task Group 6's skills will be checked against, so it must be accurate rather than aspirational
- [ ] 4.4 Preserve the house hedging style ("approximately", "roughly") for anything resting on recollection
- [ ] 4.5 **Do not add any skill entry yet.** Verify none was added: `git diff content/skills.yaml` is empty
- [ ] 4.6 `npm run validate:content` — clean

## 5. Author the standalone project files (design.md Decision 4)

- [ ] 5.1 For each project that met both criteria in 3.4–3.5, create `content/projects/<slug>.md` following the existing `ProjectSchema` shape — `title`, `company`, `skills`, `metrics` frontmatter; Problem/Approach/Outcome body
- [ ] 5.2 Match the established voice in `adehub.md` and `ai-background-removal.md` — third person, no first-person, concrete over adjectival
- [ ] 5.3 Add `projectId` to each corresponding chapter `projects[]` entry, linking chapter to file
- [ ] 5.4 Verify each new file's metrics are consistent with what JOS-117 authored into the same chapter (1.3) — no contradictions, no duplicated figures stated differently
- [ ] 5.5 Confirm no declined client name (3.6) appears in any new file
- [ ] 5.6 `npm run validate:content` — clean

## 6. Add the technical skills (only now — design.md Decision 3)

- [ ] 6.1 Add the cloud entry, named for what 3.8 established it to be, with `technologies[]` and `evidence[]`
- [ ] 6.2 Add the AI/LLM entry, same discipline
- [ ] 6.3 **Manually confirm each referenced chapter genuinely carries the claim** — the Decision 2 gate proves the technology is listed, not that the prose describes ownership. This is the judgment half and cannot be delegated to the validator
- [ ] 6.4 Confirm no legacy/origins-only technology entered `skills.yaml` (JOS-115 Decision 4; `technical-capability-evidence` currency requirement)
- [ ] 6.5 **Read the whole skills surface cold** and ask: does this describe someone working now? (Decision 6 review question). Record the answer in the Task Group 10 report
- [ ] 6.6 Confirm the existing nine entries still read accurately after Task Group 4's chapter edits
- [ ] 6.7 `npm run validate:content` — clean, including the new gate

## 7. Projects section cap and ordering (design.md Decision 5)

- [ ] 7.1 Write failing tests in `components/ProjectsSection.test.tsx`: the section renders at most the cap, and orders cards by originating chapter date, most recent first
- [ ] 7.2 Set the cap from the count Task Group 5 actually produced, not a number chosen in advance
- [ ] 7.3 Implement cap and ordering
- [ ] 7.4 Confirm the existing project-card requirements still hold — one card per file below the cap, and the fixed Problem/Approach/Outcome/metrics order
- [ ] 7.5 Run the component tests — confirm pass

## 8. Review and Update Existing Unit Tests (MANDATORY)

- [ ] 8.1 Re-read `lib/content/validate.test.ts` in full; confirm no existing assertion was weakened to accommodate the new gate
- [ ] 8.2 Re-read `components/ProjectsSection.test.tsx` and `.ssr.test.tsx`; confirm the cap did not break the no-JS rendering guarantee
- [ ] 8.3 Confirm `lib/content/read.test.ts` and the shared `test-fixtures.ts` still reflect the real content shape after the schema addition
- [ ] 8.4 Explicitly confirm no existing test was deleted or loosened; justify here if one was

## 9. Index rebuild and live eval (MANDATORY - AGENT MUST EXECUTE)

- [ ] 9.1 Add factual eval coverage in `lib/rag/eval-set.ts` for each new project — required by the **existing** per-project coverage requirement in `chatbot-eval-and-ship-gate`, which is why this change adds no delta to that spec
- [ ] 9.2 `npm run build` — confirm `prebuild` re-embeds; record the chunk-count change from the current 91
- [ ] 9.3 **Run `npx opennextjs-cloudflare build` before `npm run eval:chat`** — `getPlatformProxy()`'s ASSETS binding serves `.open-next/assets/`, which plain `npm run build` does not refresh; skipping this silently evaluates a stale index (CLAUDE.md, found during JOS-115)
- [ ] 9.4 `npm run eval:chat` — capture the full graded result
- [ ] 9.5 **Confirm the era-disambiguation cases still pass** with both origins content and the new modern content present. A failure here is JOS-116's guard working and needs a retrieval fix, not a weakened test — **stop and report** if it fires
- [ ] 9.6 Confirm the new project factual cases pass
- [ ] 9.7 Confirm all trap and injection cases still refuse
- [ ] 9.8 **Re-measure `k`** (currently 7, raised from 5 during JOS-115). More chunks may crowd retrieval again — tune only if the evals show it, per the standing "don't tune blind" rule
- [ ] 9.9 Compare against the previous `lib/rag/eval-report.json` baseline; classify every changed result as improvement, neutral, or regression
- [ ] 9.10 Create report `openspec/changes/project-evidence-and-technical-depth/reports/<date>-step-9-index-rebuild-and-eval.md`

## 10. Run Unit Tests and Verify State (MANDATORY)

- [ ] 10.1 Targeted: `npx vitest run lib/content/ components/ProjectsSection.test.tsx components/SkillsSection.test.tsx lib/rag/eval-set.test.ts` — record pass counts
- [ ] 10.2 Full suite: `npx vitest run --no-file-parallelism` — compare against the 0.4 baseline. The `ChatWidget.test.tsx` timing flake is documented and pre-existing; confirm flaky by a clean re-run rather than accepting it
- [ ] 10.3 `npx tsc --noEmit` — clean under strict mode
- [ ] 10.4 `npm run validate:content` — clean
- [ ] 10.5 `npm run lint` — **known broken repo-wide**: ESLint 9 reports a missing `eslint.config.js`, confirmed pre-existing on `main`. Record the result; do not treat as this change's regression
- [ ] 10.6 Database/persisted-state verification: **N/A** — no backend, database, or persisted state in this repo (CLAUDE.md §9)
- [ ] 10.7 Create report `openspec/changes/project-evidence-and-technical-depth/reports/<date>-step-10-unit-test-and-state-verification.md`, including the Decision 6 currency answer from 6.5

## 11. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [ ] 11.1 Start the dev server; `curl` the chat endpoint asking "what is Jose's cloud experience?" — confirm the answer draws on the new chapter prose and names no legacy tooling
- [ ] 11.2 `curl` a question about one of the new projects — confirm it is answered from the new project file rather than declined
- [ ] 11.3 `curl` "what did Jose do in the 1990s?" — confirm origins content still answers it and is not displaced by the new modern content
- [ ] 11.4 Document commands and responses in the Step 12 report

## 12. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

Uses `claude-in-chrome`; this project has no Playwright MCP.

- [ ] 12.1 `npm run dev`; confirm each new project card renders with Problem/Approach/Outcome/metrics in the fixed order
- [ ] 12.2 Confirm the cap and ordering behave as specified — most recent first, no overflow
- [ ] 12.3 Confirm the new skills render with working evidence links to their chapters
- [ ] 12.4 **Read the rendered skills section cold** and confirm the Decision 6 currency judgment holds in the real layout, not just in the YAML
- [ ] 12.5 Confirm the projects section still reads as selective rather than as a wall at the new count
- [ ] 12.6 Check the timeline rail still fits — the rail has thin headroom and was collision-prone once already (CLAUDE.md); this change adds no rail node, so confirm rather than assume
- [ ] 12.7 Create report `openspec/changes/project-evidence-and-technical-depth/reports/<date>-step-12-browser-verification.md`

## 13. Build sanity

- [ ] 13.1 `npm run build` — succeeds
- [ ] 13.2 Measure the Worker bundle (`npx opennextjs-cloudflare build && npx wrangler deploy --dry-run`) against the last recorded 1523.43 KiB gzip / 3072 KiB limit. The retrieval index ships as a static asset, so growth should be minimal — record the number rather than assuming
- [ ] 13.3 Confirm no new dependency entered `package.json`

## 14. Update Technical Documentation (MANDATORY)

- [ ] 14.1 Update `CLAUDE.md` (edit `AGENTS.md`; `CLAUDE.md` is a symlink to it, per §6) with the substantiation gate: what it checks, what it deliberately does not, and why the semantic half is a human step
- [ ] 14.2 Record the capability-claims-follow-evidence ordering alongside the existing origins editorial invariants, where a future author would look before adding a skill
- [ ] 14.3 Record the projects-section cap and the reason for it
- [ ] 14.4 Update `README.md` if the content-file inventory or the validation gate list is described there

## 15. OpenSpec sync

- [ ] 15.1 Run `opsx:sync` to fold the deltas into `openspec/specs/` — new `technical-capability-evidence`, plus `content-model`, `content-validation`, `project-cards`
- [ ] 15.2 Verify the pre-existing requirements in all three modified specs are intact and unmodified
- [ ] 15.3 `openspec validate project-evidence-and-technical-depth --strict` — clean
- [ ] 15.4 Archive the change
- [ ] 15.5 Comment on JOS-118 in Linear that the technical depth has landed
