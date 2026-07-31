import type { LlmProvider } from "./adapter.ts";
import { OpenAiProvider } from "./providers/openai.ts";
import { OPENAI_MODEL } from "./models.ts";

// The adapter-swap constraint (PRD §8): switching the active LLM provider
// requires editing only this one line/file, nothing else in the codebase.
// Selected via the JOS-61 comparative spike (see
// openspec/changes/llm-retrieval-spike/reports/) — GPT-5.4-mini matched
// Claude Haiku 4.5 on grounding/refusal/injection correctness while meeting
// the PRD §7 <150-word target more reliably and at lower per-token cost.
export function createActiveProvider(apiKey: string): LlmProvider {
  return new OpenAiProvider(apiKey);
}

// Mirrors the model used by createActiveProvider() above, so callers that
// only need to *name* the active model (e.g. content chunking describing
// the site's own stack) don't need to construct a provider or import its
// SDK. Swapping the provider means updating both this constant and the
// provider class above — still one file, preserving the PRD §8 guarantee.
export const ACTIVE_LLM_MODEL: string = OPENAI_MODEL;
