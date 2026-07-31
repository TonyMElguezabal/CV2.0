// Single source of truth for LLM/embedding model identifiers, so no other
// file — including self-describing content chunked from content/meta.md —
// hardcodes a model string that can drift out of sync with what's actually
// configured. See design.md in openspec/changes/chatbot-corpus-coverage.

// Cost-efficient/fast tier, not a flagship reasoning model — matches what
// a real deployment would use to hit PRD §10's <$50/month budget. Confirmed
// against OpenAI's live model list at execution time (see design.md's Open
// Questions in openspec/changes/llm-retrieval-spike): gpt-4.1-mini exists
// but is dated next to the current gpt-5.x lineup; gpt-5.4-mini (released
// 2026-03) is the current mini tier and the fairer comparison against
// Claude's Haiku 4.5.
export const OPENAI_MODEL = "gpt-5.4-mini";

// Embeddings use OpenAI's text-embedding-3-small regardless of which
// provider wins the generation comparison — Anthropic has no first-party
// embeddings API. See design.md in openspec/changes/llm-retrieval-spike.
export const EMBEDDING_MODEL = "text-embedding-3-small";
