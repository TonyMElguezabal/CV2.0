## Why

JOS-86 built `generateGroundedAnswer` as a directly-callable, non-streaming function — nothing yet exposes it over HTTP, and nothing streams. This is the final slice of the original bundled JOS-63 story and the piece the future widget (5.1) needs to actually call: a real `/api/chat` endpoint that streams the answer token-by-token and surfaces which chunks it drew from as citable, deep-linkable sources, per PRD §7's architecture diagram ("streamed response with source references").

## What Changes

- Add `generateStream(request)` to the `LlmProvider` interface and implement it in `OpenAiProvider` using the OpenAI SDK's native streaming (`stream: true`), so the thin-adapter swap-by-one-file constraint (§8) still holds for any future provider change.
- Extract the shared retrieve-and-build-context logic out of `generateGroundedAnswer` into a reusable helper, and add `streamGroundedAnswer(question, deps)`: same retrieval as 5.2b, but yields answer text chunks as they arrive instead of awaiting a complete response.
- Add `app/api/chat/route.ts`: a Next.js Route Handler, `POST` with a JSON `{ question: string }` body, validated (non-empty, length-capped) with Zod. Streams the response as Server-Sent Events: `token` events as the answer streams in, a final `citations` event with the deduplicated `{ source, chapterId, anchor }` list from the retrieved chunks, then `done`.
- The route is a thin wrapper over `streamGroundedAnswer` (real index/client/provider constructed once per request) — the streaming/citation logic itself stays in `lib/rag/`, injectable and unit-testable with zero real API calls, matching the existing DI pattern.

## Capabilities

### New Capabilities
- `streamed-chat-answers`: an HTTP endpoint that streams a grounded answer token-by-token and includes deduplicated, anchor-linked source citations once the answer completes.

### Modified Capabilities
- `llm-retrieval-decision`: the thin-adapter `LlmProvider` interface gains a streaming method (`generateStream`), extending — not replacing — the existing swap-by-one-file constraint recorded in that spec.

## Impact

- `lib/rag/adapter.ts`: `LlmProvider` interface gains `generateStream`.
- `lib/rag/providers/openai.ts`: implements `generateStream`.
- `lib/rag/generate.ts`: retrieval/context-building logic extracted into a shared helper; new `streamGroundedAnswer` added alongside the existing `generateGroundedAnswer` (unchanged, still used by `eval-run.ts`).
- New `app/api/chat/route.ts` (+ its own test).
- No widget/UI yet — that's 5.1, built against this endpoint separately.
