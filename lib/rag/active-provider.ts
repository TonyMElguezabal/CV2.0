import type { LlmProvider } from "./adapter.ts";
import { OpenAiProvider } from "./providers/openai.ts";

// The adapter-swap constraint (PRD §8): switching the active LLM provider
// requires editing only this one line/file, nothing else in the codebase.
// Selected via the JOS-61 comparative spike (see
// openspec/changes/llm-retrieval-spike/reports/) — GPT-5.4-mini matched
// Claude Haiku 4.5 on grounding/refusal/injection correctness while meeting
// the PRD §7 <150-word target more reliably and at lower per-token cost.
export function createActiveProvider(apiKey: string): LlmProvider {
  return new OpenAiProvider(apiKey);
}
