import OpenAI from "openai";
import type { GenerateRequest, GenerateResponse, LlmProvider } from "../adapter.ts";
import { OPENAI_MODEL as MODEL } from "../models.ts";

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
