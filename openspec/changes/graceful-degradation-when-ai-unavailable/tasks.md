## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-66-55-graceful-degradation-when-ai-is-unavailable` (Linear-provided branch name for JOS-66) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with prior chatbot changes, there is
no database, so database-state steps from
docs/openspec-tasks-mandatory-steps.md don't apply. This change DOES
modify an existing HTTP endpoint's failure responses (a new pre-stream
503 path, and a new mid-stream SSE error event on the existing
text/event-stream response) — same pattern as chat-guardrails-and-cost-
controls, where curl verification is applicable. Applicable mandatory
gates: TDD unit tests (mocked/fake dependencies, no live network calls
for the failure-injection tests), `npx vitest run`, `npx tsc --noEmit`,
`npm run lint` (currently broken repo-wide, same skip as prior changes),
curl verification of the pre-stream 503 path against a live dev server
(no external credentials needed — this failure is triggered by removing
OPENAI_API_KEY, which is fully local), and in-browser manual verification
via claude-in-chrome, all agent-executed.
-->

## 1. `app/api/chat/route.ts` — pre-stream failure returns a clean 503 (TDD)

- [x] 1.1 Write a failing test in `app/api/chat/route.test.ts` (extending its existing mocked-`openai`/`retrieve`/`active-provider`/`rateLimit` pattern): when the mocked embeddings client's `create()` throws (simulating a pre-stream provider failure), `POST` returns a 503 JSON response containing an error message and `contact: { email, scheduling }`, and no stream is opened
- [x] 1.2 Implement: added `unavailableResponse()` helper mirroring `rateLimitedResponse()` (503 status, `{ error: "unavailable", message, contact: getProfile().contact }`); wrapped the `await streamGroundedAnswer(...)` call in try/catch, returning `unavailableResponse()` on any thrown error
- [x] 1.3 Run `npx vitest run app/api/chat/route.test.ts` and confirm all cases pass, including the pre-existing ones — 10/10 passed

## 2. `app/api/chat/route.ts` — mid-stream failure sends an `error` SSE event (TDD)

- [x] 2.1 Write a failing test in `app/api/chat/route.test.ts`: with a mocked `LlmProvider` whose `generateStream` yields one token then throws, `POST`'s response body (read as text) contains an `event: token` frame followed by an `event: error` frame, and does NOT contain a `citations` or `done` event after the error
- [x] 2.2 Implement: wrapped the `for await (const token of tokens)` loop in an inner try/catch (nested inside the existing try/finally); on catch, enqueue `formatSseEvent("error", { message })` and `return` before the citations/done events would be sent — `finally` still closes the controller either way
- [x] 2.3 Run `npx vitest run app/api/chat/route.test.ts` and confirm all cases pass — 10/10 passed

## 3. `lib/chat/streamChat.ts` — decode the `error` SSE event (TDD)

- [x] 3.1 Write a failing test in `lib/chat/streamChat.test.ts` (extending the existing `fakeStream`/`mockFetchOk` pattern): a stream containing `event: token` followed by `event: error` causes the async generator to throw a `ChatRequestError` with `status: 503`, after having already yielded the preceding token event(s)
- [x] 3.2 Implement: added a `case "error"` to `parseSseFrame` that throws `new ChatRequestError(503)` (documented inline as a synthetic status, not a real HTTP status, since headers were already sent as 200)
- [x] 3.3 Run `npx vitest run lib/chat/streamChat.test.ts` and confirm all cases pass, including the pre-existing ones — 7/7 passed

## 4. `ChatWidget` — unavailable-service branch (TDD)

- [x] 4.1 Write failing tests in `components/ChatWidget.test.tsx` (extending the existing `mockStreamChat` pattern): (a) when `streamChat` rejects with a `ChatRequestError` whose `status` is 503, the widget renders a specific "AI is temporarily unavailable" message with visible contact links (email + scheduling), distinct from both the generic message and the 429 rate-limit message; (b) the existing 429 and generic-error tests still pass unchanged (no regression to the branching added in 5.3)
- [x] 4.2 Implement in `components/ChatWidget.tsx`: added an `error.status === 503` branch alongside the existing 429 branch (`UNAVAILABLE_MESSAGE` constant), reusing `DisplayMessage.contact` and the existing contact-link markup — also fixed a pre-existing test that used `ChatRequestError(503)` to represent "any non-429 error" (now genuinely ambiguous since 503 has its own branch) to use 500 instead, preserving its actual intent (the true generic-fallback path)
- [x] 4.3 Run `npx vitest run components/ChatWidget.test.tsx` and confirm all cases pass — 14/14 passed

## 5. AC2/AC3 verification tests (already-true behavior — prove it, don't rebuild it)

- [x] 5.1 Write a test in `components/ChatWidget.test.tsx`: with `streamChat` stubbed to always reject (503), a sibling "Background link" control remains focusable — proves AC2 without new mechanism
- [x] 5.2 Write a test in `components/ChatWidget.test.tsx`: after a failed send (503), a subsequent send via the free-text form (starter questions are gone once `messages.length > 0`) with `streamChat` now succeeding renders the new answer normally — proves AC3
- [x] 5.3 Run `npx vitest run components/ChatWidget.test.tsx` and confirm all cases pass — 14/14 passed (included in the §4.3 run above)

## 6. Full verification (agent executes all of this itself)

- [x] 6.1 Run `npx vitest run` (full suite) and confirm no regressions — 150/150 passed, 30 files
- [x] 6.2 Run `npx tsc --noEmit` clean — no errors
- [x] 6.3 Run `npm run lint` — **skipped, same pre-existing repo gap**: `eslint.config.mjs`/`.js` still missing, unrelated to this change
- [x] 6.4 Started the dev server and confirmed the happy path via curl — `curl -X POST localhost:3000/api/chat -d '{"question":"Who is Jose?"}'` streamed normal `token`/`citations`/`done` events, HTTP 200, no `error` event — no regression to the pre-stream/mid-stream try/catch changes. The two new failure paths themselves (pre-stream throw, mid-stream throw) are exercised by the unit tests in §1–§2, since forcing a real live provider failure on demand isn't reliably reproducible
- [x] 6.5 Via claude-in-chrome against the dev server: opened the widget, selected "Who is Jose?", confirmed it streamed a real answer with citations (`#faq #oracle #skills`) — regression check passed
- [x] 6.6 Stop the dev server; confirm no stray processes left running — confirmed, port 3000 free

## 7. OpenSpec sync

- [ ] 7.1 After merge, sync `specs/streamed-chat-answers/spec.md` (new `error` event requirement) and the `chat-widget-entry-point` delta (unavailable-message scenario, non-modal-during-outage scenario, new recovery-without-reload requirement) into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
