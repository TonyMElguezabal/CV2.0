## Context

JOS-85 made `lib/rag/index.json` a trustworthy, always-current artifact. The JOS-61 spike proved retrieve→generate works end-to-end and selected GPT-5.4-mini + static-file retrieval, but only inside a one-off comparison script (`compare.ts`, deleted after the decision) that called two providers side by side. This story turns that into the real, single-provider production function the rest of the chatbot (5.1 widget, 5.2c streaming, 5.3 guardrails) will call.

PRD §7's architecture names `retrieve → generate → validate` as one pipeline stage. This story owns retrieve and generate fully. "Validate" here means the answer actually follows the system-prompt contract (grounded, third person, refuses gracefully, under ~150 words, offers to go deeper) — which is fundamentally a prompt-following property of the LLM, not something a following code step can mechanically verify for arbitrary free-text answers. Consistent with how this repo already separates concerns (5.3 guardrails/cost controls and 5.4 refusal/injection-resistance hardening are dedicated later stories), this change validates the contract holds through real, live behavioral testing against the actual chosen provider — the same discipline the JOS-61 spike used — rather than inventing runtime output-parsing/enforcement logic that duplicates 5.3/5.4's scope.

## Goals / Non-Goals

**Goals:**
- A single, directly callable function — `generateGroundedAnswer` — that takes a question and returns an answer grounded in retrieved content, using the JOS-61-selected provider and retrieval approach as-is.
- Fully unit-testable without any real API call, via the same dependency-injection pattern already used by `buildEmbeddingIndex` (injected client) and the `LlmProvider` adapter (injected provider).
- Real, live verification that the §7 contract (grounding, refusal, third person, conciseness) actually holds against the real index and real provider — not just asserted by a mocked unit test.

**Non-Goals:**
- No HTTP endpoint or streaming — that's 5.2c.
- No rate limiting, abuse guardrails, or injection-hardening logic — that's 5.3/5.4. This story relies on the system prompt's existing injection-resistance instruction (already present and already verified working in the JOS-61 comparison) but doesn't add new defenses.
- No hard runtime enforcement of the <150-word target (e.g., truncation) — PRD §7 phrases it as a target the generation should hit, not an invariant the system must enforce after the fact; enforcing it mechanically risks cutting an answer mid-thought. Verified via live eval instead.

## Decisions

- **`generateGroundedAnswer(question, deps)` takes its index, embedding client, and LLM provider as injected parameters** — no internal `loadIndex()`/`process.env` reads. Mirrors `buildEmbeddingIndex(chunks, client)`'s existing DI pattern in this codebase. Callers (a future API route in 5.2c) load the index and construct the real clients once and pass them in; tests pass a small fixed index and fake clients, with zero real API calls or cost.
- **`SYSTEM_PROMPT` moves from `eval-sample.ts` to `generate.ts`.** It's no longer spike-only scaffolding — it's the actual prompt driving production answers. `eval-sample.ts` re-exports it so the eval harness keeps working, but its canonical home is now the module that uses it.
- **Retrieval stays `k=5`**, matching the JOS-61 spike's choice — no new tuning in this story; that comparison already validated it against real content and real questions.
- **"Validate" is a live-eval concern, not new runtime logic.** Rather than parsing the LLM's free-text output to mechanically check "did it stay grounded" or "did it use third person," this story adds a couple of realistic "unanswerable from context" questions to `EVAL_SAMPLE` (the JOS-61 sample only had off-topic/injection traps, not a professionally-plausible-but-uncovered question) and runs the extended sample live against the real provider and index, recording the results — the same verification discipline already used for the JOS-61 provider decision itself.
- **Context assembly**: retrieved chunks join with the same `\n\n---\n\n` separator the JOS-61 comparison used — no new formatting logic needed, kept identical since it was already proven to work with GPT-5.4-mini specifically.

## Risks / Trade-offs

- [Risk] Live verification costs a small real amount and depends on a live API key being available in the execution environment → Mitigation: bounded to the eval sample (~10-12 questions), reusing the same low, already-accepted cost profile as JOS-61's comparison (`text-embedding-3-small` + GPT-5.4-mini's cost-efficient tier).
- [Risk] Without mechanical output validation, a regression in generation quality (e.g., a future prompt edit) could silently violate the contract → Mitigation: JOS-67 (full ~40-question eval set run on every prompt/content change) is the dedicated, permanent gate for this; this story's live check is a one-time confirmation the contract holds today, not a substitute for that gate.
- [Risk] `generateGroundedAnswer`'s DI-heavy signature pushes wiring responsibility onto its caller → Mitigation: intentional — keeps this function trivially unit-testable now, and 5.2c's route handler is the natural, single place to do that wiring once (load index, construct real clients) rather than duplicating it inside this function.
