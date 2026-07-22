## Why

PRD §8 leaves the chatbot's LLM provider (Claude or GPT, behind a thin adapter) and §7 leaves the retrieval approach (static index file vs lightweight hosted vector store vs structured summary-in-prompt + detail chunks) as open choices, to be resolved by a spike before the chatbot build begins (JOS-61/SPK-2), the same way the motion library was resolved by a spike (JOS-53) before any animated section was built. Every subsequent chatbot story (5.1–5.6) depends on this choice existing first, and §10's success criteria set a hard budget gate (<$50/month) that the provider choice must fit within.

## What Changes

- Build a minimal build-time content-chunking pipeline over the real `/content` corpus (7 chapters, skills, projects, FAQ), producing chunks with source/chapter/anchor metadata per §7's retrieval-metadata requirement — the same real content already used elsewhere, not fixture data.
- Build a static embedding index (in-memory/file-based, no hosted vector DB), matching the corpus's actual size once chunked and consistent with §8's architecture table ("Build-time embedding → static index file — no vector DB to operate").
- Build a thin LLM adapter — one shared interface, two implementations (Claude, GPT) — so the provider is swappable by editing one file, per §8's explicit constraint.
- Assemble a small (~8–10 question) representative eval sample — not the full ~40-question set (that's JOS-67's separate scope) — spanning a few of the PRD §1 core questions, a couple of per-chapter factuals, an out-of-scope trap, and a prompt-injection attempt.
- Run that sample against both providers using the same retrieval approach, capturing grounding correctness, refusal behavior, and approximate token usage per response.
- Project monthly cost for each provider against a documented traffic assumption (derived from §10's "≥25% of visitors open it" success criterion and §7's per-session guardrails), and select one provider and one retrieval approach with recorded rationale.
- Record the decision as a spike report; remove the non-selected provider's implementation from the codebase once chosen, matching the precedent set by `motion-library-decision` (losing candidate not left as dead code).
- **Explicitly out of scope**: the full 40-question eval set and ship gate (JOS-67), the actual `/api/chat` endpoint and chat widget UI (5.1–5.2), rate limiting and cost guardrails as shipped features (5.3) — this spike produces a decision and a working comparative prototype, not the finished chatbot.

## Capabilities

### New Capabilities
- `llm-retrieval-decision`: the evidence-based selection of an LLM provider and retrieval approach for the chatbot, backed by a working comparative prototype run against real content and a recorded cost projection, that all future chatbot stories build on.

## Impact

- **Affected code**: adds a build-time chunking/embedding script, a static index file (generated artifact, not hand-authored content), and a thin LLM adapter module with two provider implementations (one removed after the decision). New dependencies: official Anthropic and OpenAI SDKs (temporarily, for comparison) plus an embeddings client.
- **Affected docs**: a spike report recording the comparison, the decision, the cost projection, and the eval-sample results, per this repo's `type:spike` Definition of Done.
- **Requires real API keys** (Anthropic and/or OpenAI) supplied by the site owner via a local, gitignored `.env.local` — never committed, never pasted into chat.
- **Downstream dependents**: unblocks 5.1–5.6 (chat widget, grounded answers, guardrails, refusals, degradation, eval gate), all of which build on the provider/retrieval decision this spike makes.
