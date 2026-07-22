## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-87-52c-streamed-responses-with-source-citations` (Linear-provided branch name for JOS-87) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: this is this repo's first real HTTP
endpoint, so the "Manual Endpoint Testing with curl (MANDATORY)" step from
docs/openspec-tasks-mandatory-steps.md now genuinely applies (previous
stories correctly noted it didn't, since no endpoint existed yet). No
database exists, so no DB-state restoration is needed. No frontend/widget
exists yet (that's 5.1), so Playwright E2E doesn't apply. Applicable
mandatory gates: TDD unit tests for testable logic, `npx vitest run`,
`npx tsc --noEmit`, `npm run validate:content`, and a real live curl-based
verification of the streaming endpoint, all agent-executed.
-->

## 1. Write failing tests first (TDD)

- [x] 1.1 Wrote failing tests for `dedupeCitations` in `lib/rag/generate.test.ts`: dedupes chunks sharing the same anchor, preserves `source`/`chapterId`/`anchor` per unique entry, empty-input case
- [x] 1.2 Wrote failing tests for `streamGroundedAnswer`: injected fake embeddings client, fixed in-memory index, fake `LlmProvider` whose `generateStream` yields fixed chunks — returns `retrievedChunks` immediately and an async generator yielding those exact chunks; a second test confirms exactly one embed call, no real API calls
- [x] 1.3 Wrote failing tests for `formatSseEvent` in `lib/rag/sse.test.ts`: string payload, object/array payload, empty-object `done` payload
- [x] 1.4 Wrote failing tests for the `POST /api/chat` route's validation path in `app/api/chat/route.test.ts`: malformed JSON body → 400, missing question → 400, empty/whitespace-only question → 400, over-length (501 chars) question → 400 — all before any client construction, no `OPENAI_API_KEY` needed
- [x] 1.5 Ran all new tests and confirmed they failed for the expected reason: `dedupeCitations`/`streamGroundedAnswer` not a function, `Cannot find module './sse.ts'`, `Cannot find module './route.ts'`. Also discovered `vitest.config.ts`'s `include` didn't cover `app/**/*.test.ts` at all (only `lib/**` and `components/**`) — added it, since this is the first `app/`-level test in the repo

## 2. Implement

- [x] 2.1 Added `generateStream(request): AsyncIterable<string>` to the `LlmProvider` interface in `lib/rag/adapter.ts`
- [x] 2.2 Implemented `generateStream` in `lib/rag/providers/openai.ts` using the OpenAI SDK's `stream: true` chat completions, yielding each chunk's `delta.content`
- [x] 2.3 Extracted the shared retrieve-and-build-context logic in `lib/rag/generate.ts` into a private `retrieveContext` helper, reused by both `generateGroundedAnswer` (unchanged behavior, confirmed via passing pre-existing tests) and the new `streamGroundedAnswer`
- [x] 2.4 Implemented `streamGroundedAnswer(question, deps)`: returns `{ retrievedChunks, tokens }`
- [x] 2.5 Implemented `dedupeCitations(chunks)` in `lib/rag/generate.ts`
- [x] 2.6 Implemented `formatSseEvent(event, data)` in `lib/rag/sse.ts`
- [x] 2.7 Implemented `app/api/chat/route.ts`: `export const runtime = "nodejs"`; Zod-validates the request body (JSON parse failure and schema failure both → 400 before any client construction); missing `OPENAI_API_KEY` → 503; constructs real `OpenAI` client, real `createActiveProvider`, real `loadIndex()`; calls `streamGroundedAnswer`; returns a `ReadableStream` response emitting `token` events, then one `citations` event, then `done`, `Content-Type: text/event-stream`. Uses relative imports (`../../../lib/rag/...`), not the `@/` alias — discovered vitest doesn't resolve the `@/` tsconfig path alias for value imports (only works for existing `import type` usages elsewhere, which erase at compile time and never hit the resolver)

## 3. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 3.1 Ran `npx vitest run` — 24 files, 108/108 tests pass, no regressions
- [x] 3.2 Ran `npx tsc --noEmit` — clean (after adding `generateStream` stubs to the 3 pre-existing JOS-86 fake providers in `generate.test.ts`, now required by the extended `LlmProvider` interface)
- [x] 3.3 Ran `npm run validate:content` — passes

## 4. Manual Endpoint Testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [x] 4.1 Started the dev server (`npm run dev`) and confirmed it was up (`GET /` → 200)
- [x] 4.2 `curl`'d a real question against `POST /api/chat` with `-N` — confirmed real SSE output: ~90 separate `token` events arriving progressively (not one buffered response), followed by exactly one `citations` event with real anchors (`#adehub`, `#oracle`, `#oracle-projects`), followed by `done`. Answer correctly stated "General Availability", matching JOS-86's `expectedSubstring` for the same question
- [x] 4.3 `curl`'d an empty (`"   "`) and a missing `question` — both returned real HTTP 400
- [x] 4.4 `curl`'d a malformed (non-JSON) body — returned real HTTP 400
- [x] 4.5 Recorded the real curl commands and observed output in `openspec/changes/streamed-responses-with-citations/reports/2026-07-22-curl-verification.md`; stopped the dev server afterward

## 5. Documentation and review

- [x] 5.1 Confirmed no other technical documentation needs updating
- [ ] 5.2 Request human review from the site owner (DoD requires review by at least one human, not only AI agents)
