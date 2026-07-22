## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-80-13c-remaining-chapters-projects-and-faq` (Linear-provided branch name for JOS-80) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on process: content authoring for this change was already underway
with the site owner (gathering raw material role-by-role) before this
OpenSpec change was formally scaffolded — a process gap versus the usual
propose-before-authoring order. Caught and corrected before commit: branch
created, change scaffolded, and all content re-validated against it before
proceeding. No backend/database exists in this repo, so this is a pure
content change; applicable gates are `npm run validate:content`, the
existing test suite (no new tests needed — no code changed), and in-browser
manual verification.
-->

## 1. Gather raw content (site owner)

- [x] 1.1 Resolve the ticket's internal chapter-count inconsistency (2 done + "4 remaining" ≠ "7 total") with the site owner — resolved as 7 total, all 5 remaining resume roles get chapters
- [x] 1.2 Collect business context, projects/outcomes/metrics, leadership highlight, technologies, and lessons learned for Tiempo Development
- [x] 1.3 Collect the same for TCS–Banamex
- [x] 1.4 Collect the same for TCS–Banco de Crédito del Perú
- [x] 1.5 Collect the same for TCS–General Electric
- [x] 1.6 Collect the same for IBM (Bluehorizon)

## 2. Author chapter content

- [x] 2.1 Draft `content/experience/tiempo.yaml`, `tcs-banamex.yaml`, `tcs-bcp.yaml`, `tcs-ge.yaml`, `ibm.yaml`, following the established chapter structure (`oracle.yaml`/`envato.yaml`)
- [x] 2.2 For each role, use only facts the site owner presented as confirmed — exclude every explicitly bracketed "suggested metric to validate," per design.md's filtering decision
- [x] 2.3 For IBM's thin single-engagement source material, split into two real project phases (analyst work → team-lead transition) rather than inventing unrelated projects
- [x] 2.4 Fix a YAML parsing bug found during authoring: an unquoted colon in a `tcs-bcp.yaml` responsibility bullet was silently parsed as a nested mapping; fixed and re-checked all 5 new files for the same pattern
- [x] 2.5 Verify all seven §F3 elements present per chapter

## 3. Update skills and FAQ

- [x] 3.1 Extend `content/skills.yaml`: existing skills' evidence extended only to chapters that genuinely demonstrate them (Technical Program Leadership, Stakeholder Management, People Leadership & Conflict Resolution)
- [x] 3.2 Add 3 new skills evidenced by achievement types not already covered: Client Relationship & Contract Management (tiempo), Service Recovery & Incident Management (tcs-banamex, tcs-ge), Project Recovery & Turnaround (tcs-bcp)
- [x] 3.3 Confirm every new chapter is referenced by at least one skill's evidence
- [x] 3.4 Replace `content/faq.md`'s fictional "Acme Corp" content with real Q&A answering the PRD §1 five core questions plus two supplementary questions, grounded only in facts already present in the real chapter corpus

## 4. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 4.1 Run `npm run validate:content` after each new chapter and after the skills/FAQ updates — passes against the full 7-chapter tree
- [x] 4.2 Run `npx vitest run` and confirm no regressions — 17 files, 79/79 tests pass (no new tests needed; no code changed)
- [x] 4.3 Run `npx tsc --noEmit` and confirm no type errors — clean

## 5. Manual verification in browser (MANDATORY - AGENT MUST EXECUTE)

- [x] 5.1 Start the dev server and load the page via claude-in-chrome tools
- [x] 5.2 Verify all 7 chapters render in the timeline and chapter list, sorted most-recent-first — confirmed: `#oracle, #envato, #tiempo, #tcs-banamex, #tcs-bcp, #tcs-ge, #ibm`
- [x] 5.3 Spot-check 2–3 of the new chapters expand correctly with all seven §F3 elements — confirmed for TCS–BCP via screenshot (mission, business context, actions, projects all correct); DOM headings confirmed present for all 6 subsections (`Business context, Actions, Projects, Leadership, Technologies, Lessons learned`) even while collapsed
- [x] 5.4 Verify the skills section shows the 3 new skills with correct evidence links to the new chapters — confirmed present in server-rendered HTML
- [x] 5.5 Verify content is present in server-rendered HTML before any client JS executes — confirmed via `document.documentElement.outerHTML`

## 6. Documentation and review

- [x] 6.1 Confirm no technical documentation needs updating — confirmed, no changes needed
- [x] 6.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents) — reviewed, including each new chapter's restructured narrative, and merged via PR #15
