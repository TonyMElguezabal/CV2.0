## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-61-50-llm-provider-and-retrieval-approach-spike-spk-2` (Linear-provided branch name for JOS-61) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on DoD: this is `type:spike`, so the standard feature DoD checklist
doesn't apply — this repo's spike DoD is: output documented (findings/
trade-offs/recommendation), ADR if applicable, decision on next steps,
time spent recorded. Tasks below still include real tests for the pure
chunking logic (cheap, no API cost, good practice regardless of artifact
type) but not "1 functional test per AC scenario" in the feature sense.
-->

## 1. Build-time content chunking (pure logic, testable without API calls)

- [x] 1.1 Write failing tests for a chunking function: splits chapters by semantic unit (context, each project, leadership, lessons), splits skills/FAQ into their own chunks, and attaches source/chapter/anchor metadata to each chunk — `lib/content/chunk.test.ts`, confirmed failing first (`Cannot find module './chunk.ts'`)
- [x] 1.2 Implement the chunking function against the real content readers (`getExperiences`, `getSkills`, `getProjects`, and a new `getFaq()` added to `read.ts`) — `lib/content/chunk.ts`
- [x] 1.3 Run the chunker against the real `/content` tree and record the actual chunk count — **66 real chunks** (48 experience, 9 skill, 2 project, 7 FAQ), comfortably within the PRD's ~50–150 estimate, confirming the static-file retrieval approach rather than assuming it

## 2. Embedding index

- [x] 2.1 Add the OpenAI SDK (for `text-embedding-3-small`, per design.md's embeddings decision — independent of which provider wins generation) — also added `@anthropic-ai/sdk` in the same pass for task group 3; both temporary, per design.md's cleanup decision (confirmed the only new `npm audit` findings are pre-existing Next.js transitive vulnerabilities already documented/accepted in `motion-library-decision`, not introduced by these two packages)
- [x] 2.2 Build a script that embeds every chunk and writes a static index file (id, vector, metadata) — `lib/rag/embed.ts` (`buildEmbeddingIndex`, not yet run — needs `OPENAI_API_KEY`)
- [x] 2.3 Build a minimal retrieval function: cosine similarity over the static index, returning top-k chunks for a query embedding — `lib/rag/retrieve.ts`, with real unit tests (`retrieve.test.ts`, 6 tests, no API calls needed) covering ranking correctness and non-mutation

## 3. Thin LLM adapter with two provider implementations

- [x] 3.1 Define one shared adapter interface (`generate({ systemPrompt, context, question }) => { answer, inputTokens, outputTokens }`) — `lib/rag/adapter.ts`
- [x] 3.2 Implement the Claude candidate using the official Anthropic SDK, a cost-efficient/fast model tier — `lib/rag/providers/anthropic.ts` (model name to be confirmed against Anthropic's live model list before the comparative run)
- [x] 3.3 Implement the GPT candidate using the official OpenAI SDK, a comparably cost-efficient/fast model tier — `lib/rag/providers/openai.ts` (model name to be confirmed against OpenAI's live model list before the comparative run)
- [x] 3.4 Confirm both implementations conform to the same interface and the active one is selected by editing exactly one file — `lib/rag/active-provider.ts` is that one file; `adapter.test.ts` confirms both providers construct correctly and conform to `LlmProvider` without making any network call (verified: SDK clients don't call out until `.generate()` is invoked)

## 4. Eval sample and comparative run — REQUIRES SITE OWNER'S API KEYS

- [x] 4.1 Ask the site owner to add `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` to a local `.env.local` (already gitignored) — do not proceed until keys are confirmed present (confirmed present via length checks only — key values never printed; one chat-pasted key flagged for rotation and rotated)
- [x] 4.2 Assemble an ~8–10 question eval sample: 2–3 of the PRD §1 five core questions, 2–3 per-chapter factual questions (verifiable against real chapter content), 1–2 out-of-scope traps, 1–2 prompt-injection attempts — `lib/rag/eval-sample.ts`, 10 questions (3 core, 3 factual w/ `expectedSubstring`, 2 trap, 2 injection)
- [x] 4.3 Run the full sample against both candidate providers, using the same retrieved-chunk context for both, recording each answer, whether it was correctly grounded/refused, and approximate token usage — all 10 questions run against both providers live, results in the spike report

## 5. Decision, cost projection, and cleanup

- [x] 5.1 Compare answer quality, grounding correctness, and refusal behavior between the two candidates — tied on correctness (3/3 factual, 2/2 refusals, 2/2 injection resistance for both); GPT-5.4-mini met the PRD §7 <150-word target consistently, Claude Haiku 4.5 often exceeded it under the same system prompt (see spike report)
- [x] 5.2 Project monthly cost for each candidate using design.md's documented traffic assumption (~500 visitors/month, ~25% open chat, a few messages/session within the 20-message cap) and each provider's real, current per-token pricing — Claude ≈ $0.67/month, GPT ≈ $0.41/month at ~500 messages/month; both comfortably clear the §10 <$50/month budget (see spike report for full arithmetic and sourced pricing)
- [x] 5.3 Select one provider and one retrieval approach, with rationale referencing the eval-sample results and cost projection — **GPT-5.4-mini** + **static-file retrieval**, rationale in spike report
- [x] 5.4 Remove the non-selected provider's SDK dependency and implementation from the codebase — deleted `lib/rag/providers/anthropic.ts`, uninstalled `@anthropic-ai/sdk`, updated `lib/rag/active-provider.ts` to reference only `OpenAiProvider`; also removed `lib/rag/compare.ts` (the two-provider comparison harness, no longer applicable with one provider) and its corresponding test coverage in `adapter.test.ts`
- [x] 5.5 Write the spike report: findings, trade-offs, recommendation, decision on next steps (proceed to 5.1–5.6), and time spent — `openspec/changes/llm-retrieval-spike/reports/2026-07-21-spike-report.md`

## 6. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 6.1 Run `npx vitest run` and confirm the chunking tests pass and no regressions in the existing suite
- [x] 6.2 Run `npx tsc --noEmit` and confirm no type errors
- [x] 6.3 Run `npm run validate:content` and confirm it still passes (unaffected, but part of the standard gate)
- [x] 6.4 Confirm no `/api/chat` route or chat widget component was introduced (out of scope per design.md)

## 7. Documentation and review

- [x] 7.1 Confirm no other technical documentation needs updating
- [x] 7.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents) — PR #16 reviewed and merged by the site owner
