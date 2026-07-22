## Why

A public chatbot answering questions "about Jose" is a credibility risk if it can be talked off-topic, into adopting another persona, or into following instructions smuggled inside a visitor's message — any of these in front of a recruiter directly damages trust (PRD §12). The system prompt already carries this contract from story 5.2b, and the JOS-61 spike already found the selected model handles it reasonably well, but nothing in the codebase deterministically enforces or verifies it yet.

## What Changes

- Add a deterministic, code-level guard to `generateGroundedAnswer`/`streamGroundedAnswer`: when no retrieved chunk clears a similarity threshold for a question, return the canonical off-topic refusal directly — without ever calling the LLM. This is fully unit-testable (fake embeddings/index), cheaper on clearly off-topic questions, and distinct from the existing "uncovered but plausible" soft-refusal behavior from 5.2b, which still reaches the LLM for borderline questions.
- Persona-adoption refusal and injection resistance (treating embedded instructions as untrusted data) remain governed by the `SYSTEM_PROMPT` contract — a retrieval-relevance guard can't catch these, since an injection or persona-swap attempt can still retrieve genuinely relevant chunks about Jose. This change tightens the prompt wording to the exact acceptance-criteria phrasing where it isn't already there.
- Extend `lib/rag/eval-sample.ts` with more adversarial trap/injection/persona-swap cases (not the full ~40-question set — that remains story 5.6/JOS-67's separate, not-yet-started scope) so this story carries its own live-verification coverage for the behaviors that can only be proven against the real model.
- **Out of scope**: the full ~40-question eval set and ship-gate grading (5.6/JOS-67), and any change to the `POST /api/chat` request/response contract — the deterministic guard reuses the existing single-token-then-citations-then-done SSE shape, so `streamed-chat-answers` is untouched.

## Capabilities

### New Capabilities
- `graceful-refusals-and-injection-resistance`: the persona-refusal and injection-resistance behavioral contract (prompt-enforced, live-verified via the extended eval sample) — covers AC2 and AC3.

### Modified Capabilities
- `retrieval-grounded-generation`: adds a deterministic off-topic decline path to `generateGroundedAnswer`/`streamGroundedAnswer` — covers AC1. The existing "uncovered but plausible" soft-refusal requirement is unchanged; this adds a new, earlier, harder decline for clearly off-topic questions.

## Impact

- **Modified files**: `lib/rag/generate.ts` (relevance-threshold guard in the retrieve-and-generate path; tightened `SYSTEM_PROMPT` wording), `lib/rag/generate.test.ts` (guard unit tests, fake dependencies, no live calls), `lib/rag/eval-sample.ts` (more adversarial cases).
- **No API/contract change**: `POST /api/chat`'s request shape, SSE event contract, and `streamed-chat-answers` spec are all untouched — the guard's refusal flows through the existing single-token stream shape.
- **No new dependencies.**
