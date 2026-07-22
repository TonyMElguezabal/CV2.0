## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-86-52b-retrieval-grounded-answer-generation` (Linear-provided branch name for JOS-86) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: no backend/database or HTTP endpoint exists
yet (that's 5.2c), so curl/database-state/Playwright steps from
docs/openspec-tasks-mandatory-steps.md don't apply. This is a library-level
change (a pure, DI-based function) plus a small real, live verification run
against the actual chosen provider — mirroring the JOS-61 spike's discipline
of validating against real behavior, not just mocked units. Applicable
mandatory gates are TDD unit tests, `npx vitest run`, `npx tsc --noEmit`,
`npm run validate:content`, and the live eval run, all agent-executed.
-->

## 1. Write failing tests first (TDD)

- [x] 1.1 Wrote failing tests in `lib/rag/generate.test.ts` for `generateGroundedAnswer`, using an injected fake embeddings client, a small fixed in-memory index, and a fake `LlmProvider` (no real API calls): (a) it embeds the question and retrieves the top-k chunks from the injected index, (b) it calls the injected provider with the retrieved chunks joined as context and the shared `SYSTEM_PROMPT`, (c) it returns the provider's answer along with the retrieved chunks and token counts, plus a third test confirming exactly one embed call and one generate call (no hidden extra network calls)
- [x] 1.2 Ran the new tests and confirmed they failed for the expected reason: `Cannot find module './generate.ts'`

## 2. Implement

- [x] 2.1 Moved `SYSTEM_PROMPT` from `lib/rag/eval-sample.ts` to `lib/rag/generate.ts`; `eval-sample.ts` re-exports it via `export { SYSTEM_PROMPT } from "./generate.ts"`
- [x] 2.2 Implemented `generateGroundedAnswer(question, deps)` in `lib/rag/generate.ts`: embeds the question via the injected embeddings client, `retrieveTopK` (k=5 default) against the injected index, joins retrieved chunk text with `\n\n---\n\n` as context, calls the injected `LlmProvider` with `SYSTEM_PROMPT`, returns `{ answer, retrievedChunks, inputTokens, outputTokens }`
- [x] 2.3 Added 2 new "professionally-plausible but uncovered" questions to `EVAL_SAMPLE` (new `"uncovered"` category, distinct from `"trap"` since these are on-topic-adjacent, not off-topic): salary range and international relocation — confirmed neither term appears anywhere in `/content` before adding

## 3. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 3.1 Ran `npx vitest run` — 22 files, 97/97 tests pass, no regressions
- [x] 3.2 Ran `npx tsc --noEmit` — clean
- [x] 3.3 Ran `npm run validate:content` — passes

## 4. Real, live verification against the actual provider and index (MANDATORY - AGENT MUST EXECUTE)

- [x] 4.1 Built `lib/rag/eval-run.ts` — calls `generateGroundedAnswer` for every question in the extended `EVAL_SAMPLE`, using the real embedding index, a real OpenAI embeddings client, and the real active provider (GPT-5.4-mini); reusable seed for JOS-67's future eval-gate runner. Output gitignored (`lib/rag/eval-results.json`, regeneratable)
- [x] 4.2 Ran it live (`node --env-file-if-exists=.env.local lib/rag/eval-run.ts`) — all 12 questions completed: 3/3 factual grounding correct, 4/4 graceful refusals correct (2 traps + 2 new uncovered-question cases), 2/2 injection resistance correct, 12/12 third-person voice and well under the 150-word target (30–79 words)
- [x] 4.3 Recorded live-verification results in `openspec/changes/retrieval-grounded-answer-generation/reports/2026-07-22-live-eval-verification.md`, including per-question word counts and a real cost figure (~$0.0094 for the full 12-question run)

## 5. Documentation and review

- [x] 5.1 Confirmed no other technical documentation needs updating
- [x] 5.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents) — PR #18 reviewed and merged by the site owner
