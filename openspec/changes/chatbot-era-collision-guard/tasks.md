## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create `feature/chatbot-era-collision-guard` from `main`, pulling first
- [x] 0.2 Verify: `git branch --show-current` → `feature/chatbot-era-collision-guard`
- [x] 0.3 Confirm `.env.local` carries `OPENAI_API_KEY` — this change requires a full index rebuild (`prebuild`) and a live eval run

## 1. Failing tests first (TDD — AC: chunks are self-describing)

Write these before touching `chunk.ts`, so the framing is driven by a red test.

- [x] 1.1 In `lib/content/chunk.test.ts`, add a failing test: every career-chapter `-technologies` chunk's text contains the chapter's rendered date range
- [x] 1.2 Add a failing test: every `-actions`, `-leadership`, and `-lessons` chunk names its chapter's role and company
- [x] 1.3 Add a failing test: every career-chapter chunk is attributable in isolation — role, company, and date range all resolvable from `chunk.text` alone. **Scope correction**: narrowed to the four framed chunk types (`-technologies`, `-actions`, `-leadership`, `-lessons`) per proposal.md's explicit "What Changes" list — `-context`/`-mission-dates` already carry attribution and `-project-N` is out of scope. Corrected the matching delta-spec scenario in `specs/content-indexing-pipeline/spec.md` to the same scope
- [x] 1.4 Add a failing test: the date form used in a chapter's `-technologies` chunk matches the form used in its `-mission-dates` chunk (one chapter is never described by two date formats — design.md Decision 1)
- [x] 1.5 Run `npx vitest run lib/content/chunk.test.ts` — confirm the new tests fail for the right reason (missing framing), not a typo

## 2. Implement chunk framing (design.md Decisions 1 and 3)

- [x] 2.1 In `lib/content/chunk.ts`, add and export a framing-prefix helper that renders role, company, and date range for a chapter, reusing the existing `renderDateRange()` so the format stays consistent
- [x] 2.2 Apply the prefix to the `-technologies` chunk (replacing the current un-dated "As {role} at {company}, Jose worked with…" opening)
- [x] 2.3 Apply the prefix to the `-actions` chunk (currently a bare `responsibilities.join("\n")`)
- [x] 2.4 Apply the prefix to the `-leadership` chunk (currently bare)
- [x] 2.5 Apply the prefix to the `-lessons` chunk (currently bare)
- [x] 2.6 Leave `-context`, `-mission-dates`, and `-project-N` chunk text unchanged — `-context` and `-mission-dates` already carry attribution, and project chunks are out of scope for this change
- [x] 2.7 Confirm `ContentChunk`'s fields (`id`, `text`, `source`, `chapterId`, `anchor`) are unchanged — no `era` field, per design.md Decision 1
- [x] 2.8 Run `npx vitest run lib/content/chunk.test.ts` — the Task Group 1 tests now pass

## 3. Preserve the thin-content guard (design.md Decision 4)

Its own group deliberately: this guard looks like incidental test maintenance
but is the difference between a real content-quality check and a tautology.

- [x] 3.1 Update `chunk.test.ts`'s "never emits a chunk shorter than MIN_CHUNK_LENGTH" test to strip the exported framing prefix before measuring, so it still measures **authored** content
- [x] 3.2 Add a test proving the guard cannot be masked: a chapter whose authored body is below `MIN_CHUNK_LENGTH` is still reported even though its framed text exceeds the threshold (use `lib/content/test-fixtures.ts`)
- [x] 3.3 Confirm `MIN_CHUNK_LENGTH` itself is unchanged at 60 — the threshold is not being raised to compensate (design.md Decision 4 rejected that option)
- [x] 3.4 Confirm `chunk.ts`'s comment above `MIN_CHUNK_LENGTH` still accurately describes the behaviour; update it to note the measurement excludes generated framing

## 4. Add era-disambiguation eval cases (design.md Decision 6)

- [x] 4.1 In `lib/rag/eval-set.ts`, add a factual case: "What is Jose's cloud experience?" with `forbiddenSubstrings` covering unambiguously legacy markers (`Novell`, `HP-UX`, `Windows 95`, `Clipper`)
- [x] 4.2 Add a case: "Is Jose up to date technically?" with the same forbidden markers
- [x] 4.3 Add a case covering database experience (`factual-16`, "What databases has Jose worked with?", expects `DB2`) — will gain a temporal-qualification assertion once JOS-115 adds Oracle 8i to the corpus; nothing to blend yet
- [x] 4.4 **Verify no forbidden list contains an ambiguous term** — confirmed `Oracle` appears in no `forbiddenSubstrings` array
- [x] 4.5 Give every new case a unique id consistent with the file's existing `factual-N` convention (`factual-14`/`15`/`16`), and confirm `eval-set.test.ts`'s no-duplicate-ids test still passes
- [x] 4.6 Record in the change that these cases pass trivially today because the legacy content does not exist yet — that is the regression gate working as designed (design.md Decision 6)

## 5. Derive the eval coverage gate from content (design.md Decision 7)

- [x] 5.1 In `lib/rag/eval-set.test.ts`, replace the hardcoded `CHAPTER_AND_PROJECT_IDS` array with ids derived from `getExperiences()` and `getProjects()`
- [x] 5.2 Confirm the derived check still passes against current content (all 7 chapters + 2 projects already have factual coverage)
- [x] 5.3 Confirm the test makes no network call — it reads content from disk only, preserving `chatbot-eval-and-ship-gate`'s "Grading requires no live network calls" requirement
- [x] 5.4 Verify the failure mode is useful: temporarily added a fixture chapter (`zzz-fixture-uncovered.yaml`) with no eval coverage — failure message read `"uncovered chapter/project ids: zzz-fixture-uncovered"`, clearly identifying the gap. Reverted; `git status --short content/` confirmed clean

## 6. Review and Update Existing Unit Tests (MANDATORY)

- [x] 6.1 Run the full suite and identify every test that asserts on chunk text — chunk text changes for four chunk types, so some assertions may need updating
- [x] 6.2 Checked `lib/rag/embed.test.ts` and `lib/rag/generate.test.ts` — both use synthetic `makeChunk()` fixtures with hardcoded text, entirely independent of `getContentChunks()`'s real generated text. Unaffected
- [x] 6.3 Confirmed `content.test.ts` and `read.test.ts` have no reference to chunking at all. Unaffected
- [x] 6.4 Confirm no test was weakened to pass — every assertion about attribution, date framing, and thin-content detection must be strictly stronger than before this change (verified: the thin-content test now measures authored content instead of full text, which is strictly stricter, not weaker)

## 7. Run Unit Tests and Verify State (MANDATORY)

- [x] 7.1 Run targeted tests: `npx vitest run lib/content/chunk.test.ts lib/rag/eval-set.test.ts`
- [x] 7.2 Run the full suite: `npx vitest run --no-file-parallelism` — confirm no regressions (537/537 passed, no flakes this run)
- [x] 7.3 `npx tsc --noEmit` — confirm clean
- [x] 7.4 `npm run validate:content` — confirm clean
- [x] 7.5 Database state verification: **N/A** — no backend/database in this repo (CLAUDE.md §9)
- [x] 7.6 Create report `openspec/changes/chatbot-era-collision-guard/reports/<date>-step-7-unit-test-and-state-verification.md`

## 8. Rebuild the index and run the live eval (MANDATORY - AGENT MUST EXECUTE)

Chunk text changed, so every embedding changes — the index must be rebuilt and
the eval re-baselined (design.md Risks).

- [x] 8.1 Run `npm run build` — confirm `prebuild` re-embeds all chunks and reports the chunk count (86 → 86, unchanged as expected)
- [x] 8.2 Run `npm run eval:chat` — capture the full graded result. **Blocked, then fixed**: the script was broken by JOS-106 (unrelated pre-existing bug); fixed `lib/rag/eval-run.ts` with user confirmation (see Step 8 report)
- [x] 8.3 Confirm the new era-disambiguation cases pass — `factual-14`/`15`/`16` all pass
- [x] 8.4 Compare against the previous eval baseline (`lib/rag/eval-report.json`) — no category regressed; see Step 8 report
- [x] 8.5 Confirm all trap and injection cases still refuse — 6/6 trap, 7/7 injection pass
- [x] 8.6 **Stop and report**: found `injection-6` failing on pre-existing grader punctuation-brittleness (unrelated to this change, confirmed via empty `git diff` on `generate.ts`/`eval-grade.ts`/`adapter.ts`). Stopped, reported, fixed with user confirmation rather than weakening the case — see Step 8 report
- [x] 8.7 Create report `openspec/changes/chatbot-era-collision-guard/reports/<date>-step-8-index-rebuild-and-eval.md` with before/after eval comparison

## 9. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [x] 9.1 Start the dev server and `curl` the chat endpoint with a cloud-capability question; confirm a grounded, era-appropriate answer streams back — answer correctly named OCI/OCI AI-LLM services, no legacy markers
- [x] 9.2 `curl` an off-topic question; confirm the canonical refusal is still returned — exact match: "I can only answer questions about Jose's professional background."
- [x] 9.3 Document commands and responses in the Step 10 report

## 10. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

- [x] 10.1 Start the dev server and drive a real browser via Claude in Chrome
- [x] 10.2 Open the chat widget and ask a current-capability question; confirm the answer reads naturally and cites appropriately
- [x] 10.3 Ask a question that should retrieve a previously-bare chunk (a lessons or leadership question); confirm the answer correctly attributes it to the right company — near-verbatim IBM `lessons` content returned, cited `#ibm`
- [x] 10.4 Screenshot captured and saved to disk (3 screenshots, paths in the report)
- [x] 10.5 Create report `openspec/changes/chatbot-era-collision-guard/reports/<date>-step-10-browser-verification.md`, including the curl results from Task Group 9

## 11. Build sanity

- [x] 11.1 `npm run build` succeeds
- [x] 11.2 Confirm no dependency change: `git diff main --stat -- package.json package-lock.json` is empty (`wrangler` already a devDependency, no new package needed for the `getPlatformProxy` import)
- [x] 11.3 Re-measure Worker size via `npx wrangler deploy --dry-run` — **1521.75 KiB gzip**, exactly flat against baseline. Confirms chunk-text growth has zero Worker bundle impact

## 12. Update Technical Documentation (MANDATORY)

- [x] 12.1 Update `AGENTS.md` §9's RAG section to record that career-chapter chunks are self-describing in time and attribution, and why (era collision + orphaned chunks)
- [x] 12.2 Record the `MIN_CHUNK_LENGTH`-measures-authored-body decision where a future implementer would look before "simplifying" the test back
- [x] 12.3 Record that `k` was deliberately left at 5, with the rationale, so the omission is not mistaken for an oversight. Also documented `eval-run.ts`'s `initCloudflareContextForScript()` fix as a required prerequisite, not incidental scaffolding

## 13. OpenSpec sync

- [ ] 13.1 **After merge**, sync `specs/content-indexing-pipeline/spec.md` and `specs/chatbot-eval-and-ship-gate/spec.md` into `openspec/specs/` — verify the modified "index covers every retrievable content facet" requirement carries the authored-content wording, and both new requirements are present
- [ ] 13.2 Archive this change (per CLAUDE.md §10 / `opsx:archive`)
- [ ] 13.3 Comment on JOS-116 in Linear that the guard has landed, and note for JOS-115 that adding chapters now requires eval coverage (Task Group 5)
