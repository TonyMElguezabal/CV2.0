## Context

This is the first change touching the future chatbot (Epic 5) and the first to require external paid APIs. `motion-library-decision` set the precedent for how this repo resolves an open architectural choice: build real comparative prototypes against real content, measure honestly, record the decision, remove the losing candidate. This spike follows that same shape for a different kind of decision — provider quality/cost instead of animation smoothness — with a harder constraint (§10: <$50/month) and a real safety concern (API keys, real spend) the motion spike didn't have.

## Goals / Non-Goals

**Goals:**
- Decide exactly one LLM provider (Claude or GPT) and exactly one retrieval approach, both with recorded rationale.
- Prove the decision against real content and a small, real eval sample — not just documentation-based reasoning.
- Keep the spike's actual API spend small and bounded (a handful of eval questions, cost-efficient model tiers, not a full eval run).
- Confirm the thin-adapter constraint (§8: swap providers by editing one file) actually holds, not just in theory.

**Non-Goals:**
- Not building the shipped `/api/chat` endpoint, rate limiting, or chat widget — those are 5.1–5.3.
- Not running the full ~40-question eval set — that's JOS-67, gated on the chatbot actually existing.
- Not deciding session/conversation-memory implementation details — covered by §7's guardrails table already, not this spike's question.

## Decisions

- **Embeddings: OpenAI `text-embedding-3-small`, independent of which provider wins the generation comparison.** Anthropic has no first-party embeddings API; using a single, cheap, well-documented embedding model for both candidate generation providers keeps the retrieval-quality variable constant across the comparison — only the generation provider changes between test runs, isolating what's actually being decided.
- **Model tier: cost-efficient/fast models on both sides, not flagship reasoning models.** §7 targets answers under 150 words on straightforward retrieval-grounded questions, and §10 caps total spend at <$50/month — this is not a task requiring frontier reasoning capability, so the comparison uses each provider's fast/cheap tier (e.g., Claude's Haiku tier vs. OpenAI's mini tier), which is also what any real deployment would use to hit the budget.
- **Retrieval approach is measured, not assumed**, even though §8's architecture table already leans toward "build-time embedding → static index file, no vector DB to operate." The actual chunk count from the real corpus (7 chapters, skills, projects, FAQ) is computed as part of this spike rather than trusting the PRD's ~50–150 estimate blindly — if the real count meaningfully exceeds that range, the static-file approach gets re-evaluated instead of rubber-stamped.
- **Chunking by semantic unit** — chapter section (context/actions/leadership/lessons), individual project, and FAQ pair — per §7's retrieval description, each chunk carrying source entity, chapter, and URL anchor metadata so answers can cite and deep-link.
- **Cost projection uses a documented, explicit traffic assumption**, since the PRD doesn't specify expected monthly visitor volume: ~500 monthly visitors, ~25% open the chat widget (§10's own success threshold) → ~125 sessions/month, averaging a few messages per session within §7's 20-message/session cap. This assumption is stated plainly in the spike report as an assumption, not a fact, so it can be revisited once real traffic data exists.
- **API keys via local `.env.local` only** (already gitignored via `.env*`) — never hardcoded, never pasted into chat, never committed. The site owner supplies keys directly into that file when the comparative test runs.
- **Losing provider's implementation is removed from the codebase after the decision**, matching `motion-library-decision`'s precedent — the adapter *pattern* (one interface, swap by editing one file) is what ships; carrying two live SDK dependencies and implementations forward as dead code would violate that same discipline.

## Risks / Trade-offs

- [Risk] Real API costs are incurred running this spike → Mitigation: bounded to a small (~8–10 question) sample, cost-efficient model tiers, and the site owner is informed of approximate spend before the test run executes.
- [Risk] A traffic assumption that turns out wrong could make the cost projection misleading → Mitigation: assumption stated explicitly and sourced from §10's own success criterion, not invented; easy to revisit once real analytics exist (Epic 7).
- [Risk] Provider API surfaces or pricing may have changed since this repo's/agent's training data → Mitigation: the spike calls the real APIs and reads real, current pricing pages as part of execution, rather than relying on possibly-stale pretrained knowledge of model names or costs.

## Open Questions

- Exact model names/tiers to compare will be confirmed against each provider's current, live model list at execution time (not pinned here, since offerings can change).
