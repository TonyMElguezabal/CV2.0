> **Repo adaptation note.** `docs/openspec-tasks-mandatory-steps.md` assumes a
> backend with a database, REST CRUD endpoints, and Playwright MCP. This repo
> has none of those (CLAUDE.md §9): there is no database, no new endpoint, and
> the available browser automation is the Chrome MCP, not Playwright. Every
> mandatory step is therefore kept and mapped to its real equivalent —
> "database state" → the generated corpus and `lib/rag/index.json`; "curl
> endpoint testing" → the existing `POST /api/chat` route, which this change
> alters the behavior of; "E2E with Playwright MCP" → the chat widget driven
> through the Chrome MCP. No mandatory step is skipped, and reports use this
> repo's actual convention (`openspec/changes/<change>/reports/`) rather than
> the doc's generic `specs/<change-name>/reports/` path.

## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `feature/JOS-101-chatbot-corpus-coverage` from `main`
- [x] 0.2 Verify branch creation and clean working tree with `git status`
- [x] 0.3 Capture the pre-change corpus baseline: run `getContentChunks()` and record total chunk count (expected 66), per-source counts, and the count of chunks under 60 characters (expected 4) into the change's `reports/` folder for later comparison

## 1. Model Constants: Single Source of Truth (TDD)

- [x] 1.1 Write a failing test asserting `lib/rag/models.ts` exports `OPENAI_MODEL` and `EMBEDDING_MODEL` as non-empty strings
- [x] 1.2 Create `lib/rag/models.ts` with both constants, moved from `lib/rag/providers/openai.ts` and `lib/rag/embed.ts`
- [x] 1.3 Update `lib/rag/providers/openai.ts` to import `OPENAI_MODEL` instead of declaring its own `MODEL` literal, preserving the existing explanatory comment
- [x] 1.4 Update `lib/rag/embed.ts` to import `EMBEDDING_MODEL` from `models.ts` and re-export it, so existing importers (`lib/rag/generate.ts`) are unaffected
- [x] 1.5 Write a failing test asserting `lib/rag/active-provider.ts` exports `ACTIVE_LLM_MODEL` matching the active provider's `model` property
- [x] 1.6 Add `ACTIVE_LLM_MODEL` to `active-provider.ts` and document in its comment that a provider swap means editing the provider class *and* this constant — both in this one file, preserving PRD §8
- [x] 1.7 Verify no model identifier literal remains anywhere outside `lib/rag/models.ts` (`grep -rn "gpt-5\|text-embedding-3" lib app content`)

## 2. Content Schemas and Readers (TDD)

- [x] 2.1 Write a failing test asserting `SkillSchema` rejects an entry with no `summary`, and rejects an empty or whitespace-only `summary`
- [x] 2.2 Add required `summary: z.string().min(1)` to `SkillSchema` in `lib/content/schemas.ts`
- [x] 2.3 Write a failing test asserting `MetaSchema` parses `title` and `topics` frontmatter and rejects a missing `title`
- [x] 2.4 Add `MetaSchema` to `lib/content/schemas.ts` and the corresponding `Meta` type to `lib/content/types.ts`
- [x] 2.5 Write a failing test asserting `getMeta()` returns parsed frontmatter plus body sections from a fixture content root
- [x] 2.6 Extract `splitProjectSections()` in `lib/content/read.ts` into a generic `splitMarkdownSections(markdown): Record<string, string>`, keeping `getProjects()` behavior byte-identical (design decision 3)
- [x] 2.7 Implement `getMeta(contentRoot?)` in `lib/content/read.ts` using `gray-matter` + `splitMarkdownSections`, following the `getProjects()` pattern
- [x] 2.8 Add the optional `contentRoot` parameter to `getProfile()` so it matches its sibling readers, and update its call sites

## 3. Chunk Emitters (TDD)

- [x] 3.1 Write a failing test asserting `getContentChunks()` accepts an options object `{ contentRoot?, models: { llm, embedding } }` and that omitting `models` is a type error (design decision 1)
- [x] 3.2 Change the `getContentChunks` signature to the options object and update `lib/rag/embed.ts` to pass `ACTIVE_LLM_MODEL` and `EMBEDDING_MODEL`
- [x] 3.3 Write a failing test asserting a `source: "profile"` chunk exists containing the profile's `positioning` and `summary`
- [x] 3.4 Add the profile emitter to `lib/content/chunk.ts` and extend the `ContentChunk["source"]` union with `"profile"`
- [x] 3.5 Write a failing test asserting each chapter emits a mission/dates chunk containing role, company, mission, the raw `YYYY-MM` values, and a rendered range (`"March 2019 – November 2021"`)
- [x] 3.6 Implement the mission/dates emitter, including the `"– present"` rendering for a chapter with no `end` date (design decision 7)
- [x] 3.7 Write a failing test asserting each chapter with a non-empty `technologies` list emits a technologies chunk naming those technologies plus the chapter's role and company (assert `"Datadog"` is now present in the corpus)
- [x] 3.8 Implement the technologies emitter
- [x] 3.9 Write a failing test asserting skill chunks contain their `summary` prose alongside name and evidence
- [x] 3.10 Update the skill emitter to `${name}\n${summary}\nEvidenced by: ${evidence}`
- [x] 3.11 Write a failing test asserting 2–3 `source: "meta"` chunks are emitted, each naming the injected `llm` and `embedding` model ids, and that changing the injected ids changes the chunk text (design decisions 1 and 4)
- [x] 3.12 Implement the meta emitter, extending the `source` union with `"meta"` and anchoring meta chunks at `#chat`
- [x] 3.13 Write a failing test asserting no emitted chunk falls below a `MIN_CHUNK_LENGTH` constant, and export that constant (design decision 5 — assert, never filter)
- [x] 3.14 Verify the emitters bring the corpus to roughly 90 chunks and that `"Datadog"`, `"2019"`, and the Envato mission string are all now present (86 chunks; 0 under 60 chars, was 4; all three gaps closed)

## 4. Content Validator (TDD)

- [x] 4.1 Write a failing test asserting validation reports an error for a skill with a missing, empty, or whitespace-only `summary`, distinct from the empty-evidence error
- [x] 4.2 Write a failing test asserting validation reports an error when `content/meta.md` is absent, and when its frontmatter is missing a required field
- [x] 4.3 Write a failing test asserting validation rejects `content/meta.md` containing the active LLM or embedding model identifier as a literal string
- [x] 4.4 Implement all three checks in `lib/content/validate.ts`, accumulating into the existing single-pass result
- [x] 4.5 Confirm the CLI exit-code contract still holds for both valid and invalid trees

## 5. Author Content

- [x] 5.1 Author `content/meta.md`: frontmatter (`title`, `topics`) plus body sections for what the site is, how content is authored and indexed, and how the chatbot retrieves and generates — third person, no model literals, no guardrail values, keys, or endpoint internals (design decisions 3 and 4; Risks)
- [x] 5.2 Author a `summary` for all 9 entries in `content/skills.yaml`, third person, naming concrete tools, contexts, or outcomes
- [x] 5.3 Add FAQ pairs to `content/faq.md` for "What AI tools does Jose use?" and "How was this site built?"
- [x] 5.4 Review each chapter's `technologies` list against open question 3 — enrich any list too thin to clear `MIN_CHUNK_LENGTH` rather than lowering the threshold (all 7 chapters already clear it; no enrichment needed)
- [x] 5.5 Run `npm run validate:content` and resolve every reported error
- [x] 5.6 Confirm all authored content is in English per CLAUDE.md §2 (only proper nouns retain diacritics, matching existing repo convention)

## 6. Citation Anchor

- [x] 6.1 Resolve design open question 1: check whether the chat widget container in `components/ChatWidget.tsx` already carries an `id` usable as the `#chat` anchor (it did not)
- [x] 6.2 Add `id="chat"` to that container if absent, with a test asserting the rendered markup exposes it, so meta-chunk citations deep-link to a real element

## 7. Eval Set Extension (TDD)

- [x] 7.1 Write a failing `eval-set.test.ts` assertion that the set contains a tooling question whose `expectedSubstrings` come from a chapter's `technologies` list
- [x] 7.2 Write a failing assertion that the set contains a tenure question whose `expectedSubstrings` come from a chapter's date range
- [x] 7.3 Write a failing assertion that the set contains a site-meta question whose `expectedSubstrings` include `ACTIVE_LLM_MODEL` resolved from code, not a hardcoded string
- [x] 7.4 Add the tooling, tenure, and site-meta questions to `lib/rag/eval-set.ts` with appropriate `sourceId` values
- [x] 7.5 Confirm the existing trap and injection questions remain unchanged and their assertions still pass (pure insertion diff — confirmed via `git diff --stat`)

## 8. Review and Update Existing Unit Tests (MANDATORY)

- [x] 8.1 Update every existing test constructing a `Skill` fixture to include the now-required `summary`
- [x] 8.2 Update every existing call site of `getContentChunks()` in tests for the new options-object signature (all done during Group 3)
- [x] 8.3 Update `lib/rag/embed.test.ts` and `lib/content/chunk` tests for the expanded chunk set and new `source` values (embed.test.ts unaffected — it exercises `buildEmbeddingIndex` directly)
- [x] 8.4 Confirm `lib/rag/generate.test.ts` and the `RELEVANCE_THRESHOLD` guard tests are untouched and still pass — this change must not alter generation behavior (zero diff on `generate.ts`; 12/12 tests pass)
- [x] 8.5 Run `npx tsc --noEmit` and resolve all strict-mode errors across content consumers (`components/StructuredData.tsx`, `app/(marketing)/page.tsx`, `app/(marketing)/layout.tsx`, `app/opengraph-image.tsx`, `lib/site-config/build.ts`) — clean, only `SkillsSection` test fixtures needed the `summary` field

## 9. Run Unit Tests and Verify Corpus/Index State (MANDATORY)

- [x] 9.1 Capture the pre-test corpus baseline (chunk count, per-source counts, min chunk length) — the no-database equivalent of the doc's pre-test DB snapshot
- [x] 9.2 Run targeted tests for the changed modules: `npx vitest run lib/content lib/rag` (120/120 passed, extended to affected components)
- [x] 9.3 Run the full suite: `npm test` (362/363 passed; 1 pre-existing flake confirmed unrelated via baseline stash comparison)
- [x] 9.4 Run `npm run validate:content` and `npx tsc --noEmit` (both exit 0)
- [x] 9.5 Verify post-test corpus state matches the baseline and that no test wrote to `lib/rag/index.json` or mutated any file under `/content`; restore and document if it did (MD5 unchanged; no unintended mutation)
- [x] 9.6 Create the report at `openspec/changes/chatbot-corpus-coverage/reports/YYYY-MM-DD-step-9-unit-test-and-corpus-verification.md` using the template in `docs/openspec-tasks-mandatory-steps.md`, with the DB section recording corpus/index state instead
- [x] 9.7 Mark this step complete only after tests pass and the report file exists

## 10. Manual `/api/chat` Testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [x] 10.1 Run `npm run build` to regenerate `lib/rag/index.json` from the expanded corpus, then start the server with `npm run start` (agent starts it — never delegate to the user)
- [x] 10.2 curl `POST /api/chat` with the ticket's original question ("What AI tools are you using at work or outside of work?"); verify a 200, a streamed grounded answer naming real tools, and that it is no longer a refusal
- [x] 10.3 curl `POST /api/chat` with "How was this site built?"; verify the answer names the model id matching `ACTIVE_LLM_MODEL` and describes the indexing pipeline
- [x] 10.4 curl `POST /api/chat` with "When did Jose work at Envato?"; verify the answer states March 2019 – November 2021
- [x] 10.5 curl `POST /api/chat` with a clearly off-topic question; verify the canonical refusal still fires and no citations are returned
- [x] 10.6 curl `POST /api/chat` with a prompt-injection attempt; verify refusal and no system-prompt leak
- [x] 10.7 curl error cases: an over-length message (>500 chars) and a malformed body; verify the documented error responses are unchanged
- [x] 10.8 Confirm no server-side state was persisted by these calls (this route persists nothing by design — see `app/api/chat/route.noPersistence.test.ts`), so no state restoration is required; document that verification
- [x] 10.9 Record every command and response in `openspec/changes/chatbot-corpus-coverage/reports/YYYY-MM-DD-step-10-api-chat-manual-testing.md`

## 11. E2E Chat Widget Testing via Chrome MCP (MANDATORY - AGENT MUST EXECUTE)

- [x] 11.1 With the production build still running, open the site in a new tab via the Chrome MCP (agent executes — never delegate to the user)
- [x] 11.2 Open the chat widget and verify the greeting renders
- [x] 11.3 Ask the ticket's original question through the UI; verify the streamed answer is substantive, third person, and not a refusal
- [x] 11.4 Ask "How was this site built?"; verify the answer stays in third person and does not adopt a first-person persona (spec scenario in `chatbot-eval-and-ship-gate`)
- [x] 11.5 Verify citations render and that a meta-chunk citation's `#chat` deep-link resolves to a real element on the page (URL updated to `/#chat`, confirmed)
- [x] 11.6 Check the browser console for errors via the Chrome MCP (none found on fresh load)
- [x] 11.7 Close the tab, stop the server, and record scenarios and outcomes in `openspec/changes/chatbot-corpus-coverage/reports/YYYY-MM-DD-step-11-e2e-chat-widget.md`

## 12. Live Eval Ship Gate

- [x] 12.1 Run `npm run eval:chat` against the live model with `OPENAI_API_KEY` set (run 3x across 2 fix iterations)
- [x] 12.2 Verify overall ship-readiness is `true`: every factual, trap, and injection case passes, including the new tooling, tenure, and site-meta questions (13/13, 6/6, 7/7 — shipReady: true)
- [x] 12.3 Review the core and uncovered results flagged for manual review and record the judgement (all 9 accurate, grounded, no hallucination)
- [x] 12.4 If a tooling or site-meta case fails on retrieval dilution, do not widen `k` or lower the threshold — record it and open a follow-up change for source-diversity retrieval (design Risks) (both failures were eval-wording mismatches, not retrieval dilution — no follow-up needed)
- [x] 12.5 Commit the graded summary to `openspec/changes/chatbot-corpus-coverage/reports/YYYY-MM-DD-step-12-eval-ship-gate.md`

## 13. Update Technical Documentation (MANDATORY)

- [x] 13.1 Update `docs/data-model.md` with the new `meta` content source and the required `skills[].summary` field (N/A — this doc is scoped entirely to the analytics/DB model and explicitly excludes profile content; the content inventory lives in PRD §6 instead, updated in 13.2)
- [x] 13.2 Update `docs/PRD.md` §6 if it enumerates the content inventory (added `meta.md` to the tree, noted `skills.yaml`'s new `summary` field)
- [x] 13.3 Update `CLAUDE.md` §9's architecture notes to mention `lib/rag/models.ts` as the single home for model identifiers (edited via the real target `AGENTS.md` — `CLAUDE.md` is a symlink to it; confirmed the symlink reflects the change)
- [x] 13.4 Update `README.md` if it documents the content layout (added `meta.md` and `skills.yaml`'s `summary` to the tree)
- [x] 13.5 Verify no stale reference to `MODEL` in `providers/openai.ts` remains in any doc (none found)

## 14. Verification and Close-Out

- [x] 14.1 Run the full gate one final time: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run validate:content`, `npm run build` (363/363 tests, tsc/validate/build all clean; `npm run lint` has a pre-existing, unrelated missing `eslint.config.js` — predates this branch)
- [x] 14.2 Re-read the four delta specs and confirm every scenario has a corresponding test or documented verification (all 21 scenarios cross-checked — see below)
- [x] 14.3 Confirm no broken symlinks or stale targets were introduced (CLAUDE.md §6) (`CLAUDE.md`/`codex.md`/`GEMINI.md` → `AGENTS.md`, all resolve; `AGENTS.md` edit propagated correctly)
- [x] 14.4 Open the PR referencing JOS-101 with the eval ship-gate summary attached (https://github.com/TonyMElguezabal/CV2.0/pull/42, merged)
- [x] 14.5 Run `/opsx:archive` after review and verification
