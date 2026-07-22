## Context

JOS-86 delivered `generateGroundedAnswer`, a directly-callable, non-streaming, fully dependency-injected function. This story exposes that capability over HTTP for the first time in this repo — the first real API route, and the first streaming implementation — per PRD §7's architecture diagram, which names "streamed response with source references" as a distinct pipeline stage after generate/validate.

The user was asked directly (via AskUserQuestion) whether the transport should be Server-Sent Events with typed events, or plain streamed text with a trailing JSON blob for citations. They chose SSE.

## Goals / Non-Goals

**Goals:**
- `POST /api/chat` streams the answer token-by-token as it's generated, then sends deduplicated, anchor-linked citations once the answer completes, then a `done` event.
- The `LlmProvider` thin-adapter interface (§8's swap-by-one-file constraint) gains streaming as a first-class capability, not a one-off bolted onto the route.
- The retrieval/streaming orchestration logic (`streamGroundedAnswer`) stays fully unit-testable via injected fakes, exactly like `generateGroundedAnswer` — matching this codebase's established DI pattern.
- Basic request validation at the API boundary (non-empty, length-capped question) — a boundary concern, not a guardrail.

**Non-Goals:**
- No rate limiting, per-session message caps, or abuse guardrails — that's JOS-64 (5.3).
- No injection-hardening beyond what the existing system prompt already does — that's JOS-65 (5.4), already verified working in JOS-86's live eval.
- No widget/UI — that's JOS-62 (5.1), built separately against this endpoint.
- No conversation memory/session history — out of scope per JOS-61's design.md non-goals; each request is independent.
- No token-usage/cost tracking on the streaming path — JOS-86's non-streaming `generateGroundedAnswer` (still used by `eval-run.ts`) already returns usage; adding it to the stream is deferred to whichever guardrail/cost story needs it (5.3), not invented speculatively here.

## Decisions

- **`LlmProvider` gains `generateStream(request): AsyncIterable<string>`.** Implemented in `OpenAiProvider` via the OpenAI SDK's native `stream: true` chat completions, yielding each chunk's `delta.content`. Keeps the adapter pattern's swap-by-one-file guarantee intact for streaming, not just the non-streaming path.
- **Citations are computed before generation even starts, but emitted after the token stream.** Retrieval happens synchronously before generation begins either way (streaming or not) — `streamGroundedAnswer` returns `{ retrievedChunks, tokens }` immediately, where `retrievedChunks` is already resolved and `tokens` is the async generator of text chunks. The route holds onto `retrievedChunks` and only emits the `citations` SSE event after the `tokens` generator is exhausted, matching the event order the user approved (tokens, then citations, then done) — even though the data itself was available earlier.
- **Citation dedup**: `dedupeCitations(chunks)` is a small pure function (unit-tested directly) that reduces retrieved chunks to unique `{ source, chapterId, anchor }` entries, since multiple chunks can share the same anchor (e.g. two chunks from the same chapter section).
- **SSE formatting extracted as a pure helper** (`formatSseEvent(event, data)`) rather than inlined string-building in the route — trivially unit-testable in isolation from the route's real-dependency wiring.
- **The route uses plain, web-standard `Request`/`Response`/`ReadableStream`, not `next/server`'s `NextRequest`.** Nothing in this route needs Next-specific request features (cookies, geo, etc.), and Node 26's native fetch-API globals are enough — this also means the route's exported `POST` function is directly callable in a vitest test with a plain `Request`, no Next test harness needed.
- **`export const runtime = "nodejs"`** on the route — `loadIndex()` uses `node:fs`'s `readFileSync`, which isn't available on the Edge runtime.
- **Route validation is the only part of `route.ts` that's realistically unit-testable without live API calls** (bad JSON / empty / over-length question → 400, before any client is constructed or network call made). The success path — real streaming behavior, real SSE event framing, real citations — is verified via a live `npm run dev` + curl run (this repo's first real endpoint, so the previously-inapplicable "Manual Endpoint Testing" mandatory step now genuinely applies), not mocked. This mirrors the same "verify against real behavior, not just mocks" discipline used for JOS-61's provider comparison and JOS-86's live eval.
- **Request body validation via Zod** (`z.object({ question: z.string().trim().min(1).max(500) })`), matching this repo's existing content-schema validation convention (`lib/content/schemas.ts`) and the DoD's "Input and output validation (Zod or equivalent)" requirement. 500 chars is a generous cap for a chat question, not a guardrail-grade abuse limit (that's 5.3's job).

## Risks / Trade-offs

- [Risk] A dropped connection mid-stream leaves the `ReadableStream` controller in an inconsistent state → Mitigation: token enqueueing wrapped in `try/finally` so `controller.close()` always runs.
- [Risk] Streaming makes error handling harder — once headers are sent (`200 text/event-stream`), a downstream failure can't change the status code → Mitigation: all fallible work (parsing/validating the request, constructing clients, retrieval) happens before the `ReadableStream` is returned; only the token-generation loop itself runs inside the stream, where a failure can at worst truncate the stream (visible to the client as an incomplete answer), not silently corrupt it.
- [Risk] Live curl verification incurs a small real cost per test run → Mitigation: a single real question is enough to verify the transport and citation wiring work end-to-end; bulk correctness (grounding/refusal/conciseness) was already verified for the underlying generation logic in JOS-86 and isn't re-verified here.
