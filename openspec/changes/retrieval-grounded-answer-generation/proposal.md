## Why

JOS-85 built the build-time retrieval index; nothing yet turns a visitor's question into a grounded answer. This is the core, highest-uncertainty slice of the original bundled JOS-63 story: retrieve relevant content for a question and generate an answer that stays strictly within it, per PRD §7's Generation rules — the piece the rest of the chatbot (widget, streaming, guardrails) is built around.

## What Changes

- Add `generateGroundedAnswer(question)`: embeds the question, retrieves the top-k chunks from `lib/rag/index.json`, and calls the active LLM provider (currently GPT-5.4-mini, per the JOS-61 decision) with a system prompt enforcing the §7 contract — third person, answer only from context, refuse gracefully with alternatives when unanswerable, target under 150 words, offer to go deeper.
- Promote `SYSTEM_PROMPT` from spike-only scaffolding (`lib/rag/eval-sample.ts`) to a production artifact (`lib/rag/generate.ts`), since it now drives real generated answers, not just the JOS-61 comparison. `eval-sample.ts` keeps `EVAL_SAMPLE` and re-exports the prompt from its new home.
- Extend `EVAL_SAMPLE` with a couple of realistic "not answerable from context" questions (a real profile-adjacent question the content simply doesn't cover) to directly exercise AC2's refusal behavior, which the JOS-61 sample didn't specifically target.
- Real, live verification against the actual chosen provider and index (small, bounded question set — same discipline as JOS-61's spike run) demonstrating grounding, refusal, third-person voice, and the word-count target actually hold in production, not just in unit tests with fakes.

## Capabilities

### New Capabilities
- `retrieval-grounded-generation`: given a question, retrieves matching content and generates an answer that stays within it, refuses gracefully when it can't, and follows the §7 voice/length/depth-offer contract.

### Modified Capabilities
(none — `llm-retrieval-decision` and `content-indexing-pipeline` are unchanged; this change consumes both as-is)

## Impact

- New `lib/rag/generate.ts` (+ `lib/rag/generate.test.ts`).
- `lib/rag/eval-sample.ts`: `SYSTEM_PROMPT` moves to `generate.ts` and is re-exported; `EVAL_SAMPLE` gains 1-2 new questions.
- No HTTP endpoint yet — that's 5.2c's scope (streaming + citations). This story's output is a directly callable function, not a route.
