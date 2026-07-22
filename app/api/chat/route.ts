import OpenAI from "openai";
import { z } from "zod";
import { loadIndex } from "../../../lib/rag/retrieve.ts";
import { streamGroundedAnswer, dedupeCitations } from "../../../lib/rag/generate.ts";
import { createActiveProvider } from "../../../lib/rag/active-provider.ts";
import { formatSseEvent } from "../../../lib/rag/sse.ts";

// loadIndex() reads lib/rag/index.json from disk via node:fs, which the
// Edge runtime doesn't support.
export const runtime = "nodejs";

const RequestSchema = z.object({
  question: z.string().trim().min(1).max(500),
});

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const embeddingClient = new OpenAI({ apiKey });
  const provider = createActiveProvider(apiKey);
  const index = loadIndex();

  const { retrievedChunks, tokens } = await streamGroundedAnswer(
    parsed.data.question,
    { embeddingClient, provider, index },
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of tokens) {
          controller.enqueue(encoder.encode(formatSseEvent("token", token)));
        }
        const citations = dedupeCitations(retrievedChunks);
        controller.enqueue(encoder.encode(formatSseEvent("citations", citations)));
        controller.enqueue(encoder.encode(formatSseEvent("done", {})));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
