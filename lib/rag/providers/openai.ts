import OpenAI from "openai";
import type { GenerateRequest, GenerateResponse, LlmProvider } from "../adapter.ts";

// Cost-efficient/fast tier, not a flagship reasoning model — matches what
// a real deployment would use to hit PRD §10's <$50/month budget. Confirmed
// against OpenAI's live model list at execution time (see design.md's Open
// Questions in openspec/changes/llm-retrieval-spike): gpt-4.1-mini exists
// but is dated next to the current gpt-5.x lineup; gpt-5.4-mini (released
// 2026-03) is the current mini tier and the fairer comparison against
// Claude's Haiku 4.5.
const MODEL = "gpt-5.4-mini";

export class OpenAiProvider implements LlmProvider {
  readonly name = "gpt";
  readonly model = MODEL;
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate({
    systemPrompt,
    context,
    question,
  }: GenerateRequest): Promise<GenerateResponse> {
    const response = await this.client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 400,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    return {
      answer: response.choices[0]?.message?.content ?? "",
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  }

  async *generateStream({
    systemPrompt,
    context,
    question,
  }: GenerateRequest): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 400,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
