# JOS-61 Spike Report: LLM Provider and Retrieval Approach

**Date:** 2026-07-21
**Type:** spike (SPK-2)

## Question

Decide exactly one LLM provider (Claude vs. GPT) and exactly one retrieval
approach for the future chatbot (Epic 5), validated against real content and
a real comparative eval — not desk research — and check the projected
monthly cost against PRD §10's <$50/month budget.

## What was built

A minimal, real RAG prototype against this repo's actual `/content`:

- **Chunking** (`lib/content/chunk.ts`): splits each career chapter by
  semantic unit (context, actions, one chunk per project, leadership,
  lessons), one chunk per skill, one chunk per standalone project card, one
  chunk per FAQ Q&A pair. Each chunk carries `source`/`chapterId`/`anchor`
  metadata per PRD §7.
- **Embedding index** (`lib/rag/embed.ts`): embeds every chunk with OpenAI's
  `text-embedding-3-small` and writes a static JSON index — no vector
  database.
- **Retrieval** (`lib/rag/retrieve.ts`): cosine similarity over the static
  index, top-k lookup.
- **Thin LLM adapter** (`lib/rag/adapter.ts` + `lib/rag/providers/`): one
  shared `LlmProvider` interface, with `AnthropicProvider` (Claude) and
  `OpenAiProvider` (GPT) implementations built side by side, swappable by
  editing a single file (`lib/rag/active-provider.ts`).
- **Eval sample** (`lib/rag/eval-sample.ts`): 10 real questions — 3 of the
  PRD §1 core questions, 3 chapter-factual questions with an
  `expectedSubstring` to verify against, 2 out-of-scope traps, 2
  prompt-injection attempts — plus a system prompt grounded in PRD §7's
  Generation rules (third person, answer only from context, refuse
  out-of-scope/persona/injection attempts, target <150 words).

## Findings

### Retrieval approach

The real corpus chunked to **66 chunks** (48 experience, 9 skill, 2 project,
7 FAQ) — comfortably inside PRD §7's ~50–150 estimate. This confirms, rather
than assumes, that a build-time static-file index is the right fit: no
vector database is needed to operate this corpus size, and a full
embed-and-search pass over 66 chunks is trivially fast and cheap.

**Decision: static-file retrieval**, per PRD §8's architecture table.

### Provider comparison

Ran all 10 eval questions against both providers, using identical retrieved
context and the same system prompt for both, live against each provider's
real API (not simulated).

**Correctness — tied.**
- Factual grounding: 3/3 for both providers, verified against each
  question's `expectedSubstring` ("General Availability" for ADEHub launch
  status, "6%" for adoption growth, "97%" for P1 reduction).
- Out-of-scope traps: 2/2 correctly refused by both.
- Prompt-injection attempts: 2/2 correctly resisted by both.

**Conciseness — GPT-5.4-mini wins.** PRD §7 explicitly targets answers under
150 words. With the identical system prompt:
- GPT-5.4-mini: 28–85 words per answer across all 10 questions, consistently
  under the target.
- Claude Haiku 4.5: 100–180 words per answer, driven by heavier default
  markdown formatting (bold headers, nested bullet sub-sections); several
  answers landed at or past the 150-word target.

This is a default-behavior difference, not a hard capability gap — Claude's
verbosity is plausibly fixable with a more explicit formatting constraint in
the system prompt. But under the same prompt, in this run, GPT met the
PRD's own quality bar more reliably out of the box.

**Token usage (10 questions, raw totals):**

| Provider | Input tokens | Output tokens |
|---|---|---|
| Claude Haiku 4.5 | 6,565 | 1,371 |
| GPT-5.4-mini | 5,923 | 839 |

### Real, current pricing (verified live, not from training data)

| Item | Price |
|---|---|
| Claude Haiku 4.5 | $1 / MTok input, $5 / MTok output |
| GPT-5.4-mini | $0.75 / MTok input, $4.50 / MTok output |
| `text-embedding-3-small` | $0.02 / MTok |

### Cost projection

Traffic assumption (documented in design.md, sourced from PRD §10's own
25%-chat-open success threshold, not invented): ~500 monthly visitors, ~25%
open the chat → ~125 sessions/month, averaging ~4 messages/session (well
within §7's 20-message/session cap) → **~500 messages/month**.

Per-message cost, using this spike's measured average tokens/message:

- Claude: (656.5 in × $1 + 137.1 out × $5) / 1,000,000 ≈ **$0.00134/message**
- GPT: (592.3 in × $0.75 + 83.9 out × $4.50) / 1,000,000 ≈ **$0.00082/message**

Projected monthly generation cost at ~500 messages/month:

- Claude: **≈ $0.67/month**
- GPT: **≈ $0.41/month**

Embedding cost is effectively negligible at this scale: the one-time
66-chunk index build and per-query embeddings at this traffic volume total
well under $0.01/month.

Both providers clear PRD §10's <$50/month budget with over 98% margin —
even at 10x this traffic assumption, both stay under $7/month. **Cost is not
the deciding factor in practice**; it's a secondary point in GPT's favor,
not the reason for the decision.

## Decision

**Selected provider: GPT-5.4-mini.**
**Selected retrieval approach: build-time embedding → static index file (no
vector database).**

Rationale: both providers tied on the correctness dimensions that matter
most (grounding, refusal, injection resistance). The genuine differentiator
in this run was PRD §7's explicit <150-word conciseness target, which
GPT-5.4-mini met consistently under a shared system prompt while Claude
Haiku 4.5 did not. GPT-5.4-mini is also meaningfully cheaper per message,
though both are negligible against the §10 budget at this traffic level.

Per this repo's precedent (`motion-library-decision`), the losing
candidate's implementation and dependency were removed after the decision:
`lib/rag/providers/anthropic.ts` deleted, `@anthropic-ai/sdk` uninstalled,
`lib/rag/active-provider.ts` updated to reference only `OpenAiProvider`.
`lib/rag/compare.ts` (the two-provider comparison harness) was also removed
— its purpose was the side-by-side run this report documents, and it has no
role once only one provider remains. `lib/rag/eval-sample.ts` (the 10
eval questions and system prompt) was kept as a real, reusable seed for
Story 5.2b's generation work and JOS-67's full eval set.

## Decision on next steps

**Proceed.** This prototype's chunking (`lib/content/chunk.ts`), embedding
index (`lib/rag/embed.ts`), retrieval (`lib/rag/retrieve.ts`), adapter
pattern (`lib/rag/adapter.ts`, `lib/rag/active-provider.ts`), and the
GPT-5.4-mini provider implementation (`lib/rag/providers/openai.ts`) carry
forward into Stories 5.2a (build-time content indexing pipeline) and 5.2b
(retrieval-grounded answer generation). The eval sample and system prompt
seed both 5.2b and JOS-67 (full ~40-question eval set).

## Time spent

Dominated by two rounds of live-API debugging discovered only by actually
calling the real APIs (per design.md's stated principle of not trusting
possibly-stale pretrained knowledge): confirming `gpt-5.4-mini` as the
current model over the initially-guessed dated `gpt-4.1-mini`, and fixing
the `max_tokens` → `max_completion_tokens` parameter rename for GPT-5.4-mini.
Secondary time cost: several rounds of API-key verification and rotation
after a key was inadvertently pasted into chat (flagged and rotated) and a
transcription error on my part (also caught and corrected without ever
reconstructing or exposing a partial secret). The provider comparison itself
— once both providers were correctly wired — took a single ~10-question
run.
