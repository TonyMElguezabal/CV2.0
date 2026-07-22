import { writeFileSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";
import { loadIndex } from "./retrieve.ts";
import { generateGroundedAnswer } from "./generate.ts";
import { createActiveProvider } from "./active-provider.ts";
import { EVAL_SET, type EvalQuestion } from "./eval-set.ts";
import { summarizeGrades } from "./eval-grade.ts";

export interface EvalRunResult {
  questionId: string;
  category: string;
  question: string;
  answer: string;
  retrievedAnchors: string[];
  inputTokens: number;
  outputTokens: number;
  wordCount: number;
}

export async function runEval(
  embeddingClient: OpenAI,
  provider: ReturnType<typeof createActiveProvider>,
  questions: EvalQuestion[] = EVAL_SET,
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
    });

    console.log(`Done: ${evalQuestion.id}`);
  }

  return results;
}

function printSummary(summary: ReturnType<typeof summarizeGrades>): void {
  console.log("\n--- Eval summary ---");
  for (const [category, counts] of Object.entries(summary.byCategory)) {
    console.log(
      `${category}: ${counts.pass} pass, ${counts.fail} fail, ${counts.manual} manual`,
    );
  }
  if (summary.failures.length > 0) {
    console.log("\nFailures:");
    for (const failure of summary.failures) {
      console.log(`  ${failure.questionId}: ${failure.reason}`);
    }
  }
  console.log(`\nShip ready: ${summary.shipReady ? "YES" : "NO"}`);
  console.log(
    "(core/uncovered results are manual-review, not part of shipReady — read their answers separately)",
  );
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is required to run the eval set.");
    process.exit(1);
  }

  const embeddingClient = new OpenAI({ apiKey });
  const provider = createActiveProvider(apiKey);

  const results = await runEval(embeddingClient, provider);
  const summary = summarizeGrades(results, EVAL_SET);
  printSummary(summary);

  const resultsPath = join(process.cwd(), "lib", "rag", "eval-results.json");
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${results.length} results to ${resultsPath}`);

  const reportPath = join(process.cwd(), "lib", "rag", "eval-report.json");
  writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote graded summary to ${reportPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
