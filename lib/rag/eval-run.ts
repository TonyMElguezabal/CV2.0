import { writeFileSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";
import { getPlatformProxy } from "wrangler";
import { loadIndex } from "./retrieve.ts";

// Pre-existing bug fix, unrelated to this change's actual scope
// (chatbot-era-collision-guard / JOS-116): `loadIndex()` fetches the
// retrieval index via `getCloudflareContext()`, which since JOS-106
// (reduce-worker-bundle-size) reads the Workers Static Assets binding
// rather than a build-time import. That context is normally supplied by
// `initOpenNextCloudflareForDev()` in next.config.ts — but that function
// silently no-ops outside Next's own dev-server process (it gates on
// `globalThis.AsyncLocalStorage`, which only Next's boot sequence sets),
// so it cannot be called from this standalone script. No change since
// JOS-106 merged had actually run this script end-to-end.
//
// This replicates what `initOpenNextCloudflareForDev` itself does when
// the gate passes: get real local bindings from wrangler's public
// `getPlatformProxy()` API, then store them under the same well-known
// global symbol `getCloudflareContext()` reads from — see
// `initOpenNextCloudflareForDevErrorMsg`'s own note that the context is
// "set on the global state by either the worker entrypoint (in prod) or
// by `initOpenNextCloudflareForDev` (in dev)" in
// @opennextjs/cloudflare/dist/api/cloudflare-context.js. Scoped entirely
// to this script — `retrieve.ts` and the production `/api/chat` route are
// unchanged.
async function initCloudflareContextForScript(): Promise<void> {
  const { env, cf, ctx } = await getPlatformProxy();
  const contextSymbol = Symbol.for("__cloudflare-context__");
  (globalThis as Record<symbol, unknown>)[contextSymbol] = { env, cf, ctx };
}
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
  const index = await loadIndex();
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
  await initCloudflareContextForScript();

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
