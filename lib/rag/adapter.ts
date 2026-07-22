// The thin adapter interface both candidate providers implement, per PRD
// §8's constraint: swap the active provider by editing one file. See
// design.md in openspec/changes/llm-retrieval-spike.

export interface GenerateRequest {
  systemPrompt: string;
  context: string;
  question: string;
}

export interface GenerateResponse {
  answer: string;
  inputTokens: number;
  outputTokens: number;
}

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  generateStream(request: GenerateRequest): AsyncIterable<string>;
}
