import { writeFileSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";
import { loadIndex } from "./retrieve.ts";
import { generateGroundedAnswer } from "./generate.ts";
import { createActiveProvider } from "./active-provider.ts";
import { EVAL_SAMPLE, type EvalQuestion } from "./eval-sample.ts";

export interface EvalRunResult {
  questionId: string;
  category: string;
  question: string;
  answer: string;
  retrievedAnchors: string[];
  inputTokens: number;
  outputTokens: number;
  wordCount: number;
  expectedSubstring?: string;
  containsExpectedSubstring?: boolean;
}

export async function runEval(
  embeddingClient: OpenAI,
  provider: ReturnType<typeof createActiveProvider>,
  questions: EvalQuestion[] = EVAL_SAMPLE,
): Promise<EvalRunResult[]> {
  const index = loadIndex();
  const results: EvalRunResult[] = [];

  for (const evalQuestion of questions) {
    const { answer, retrievedChunks, inputTokens, outputTokens } =
      await generateGroundedAnswer(evalQuestion.question, {
        embeddingClient,
        provider,
        index,
      });

    results.push({
      questionId: evalQuestion.id,
      category: evalQuestion.category,
      question: evalQuestion.question,
      answer,
      retrievedAnchors: retrievedChunks.map((chunk) => chunk.anchor),
      inputTokens,
      outputTokens,
      wordCount: answer.trim().split(/\s+/).filter(Boolean).length,
      expectedSubstring: evalQuestion.expectedSubstring,
      containsExpectedSubstring: evalQuestion.expectedSubstring
        ? answer.includes(evalQuestion.expectedSubstring)
        : undefined,
    });

    console.log(`Done: ${evalQuestion.id}`);
  }

  return results;
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is required to run the eval sample.");
    process.exit(1);
  }

  const embeddingClient = new OpenAI({ apiKey });
  const provider = createActiveProvider(apiKey);

  const results = await runEval(embeddingClient, provider);

  const outputPath = join(process.cwd(), "lib", "rag", "eval-results.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Wrote ${results.length} results to ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
