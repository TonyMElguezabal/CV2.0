import OpenAI from "openai";
import { z } from "zod";
import { loadIndex } from "../../../lib/rag/retrieve.ts";
import { streamGroundedAnswer, dedupeCitations } from "../../../lib/rag/generate.ts";
import { createActiveProvider } from "../../../lib/rag/active-provider.ts";
import { formatSseEvent } from "../../../lib/rag/sse.ts";
import { checkRateLimit, createUpstashRateLimitStore } from "../../../lib/chat/rateLimit.ts";
import { getProfile } from "../../../lib/content/read.ts";

// loadIndex() reads lib/rag/index.json from disk via node:fs, which the
// Edge runtime doesn't support.
export const runtime = "nodejs";

const RequestSchema = z.object({
  question: z.string().trim().min(1).max(500),
});

// PRD §7 guardrails table.
const PER_IP_LIMIT = 10;
const PER_IP_WINDOW_SECONDS = 5 * 60;
const PER_SESSION_LIMIT = 20;
const PER_SESSION_WINDOW_SECONDS = 24 * 60 * 60;

function rateLimitedResponse(): Response {
  const { contact } = getProfile();
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      message:
        "You've reached the usage limit for this chat. Please try again shortly, or reach out directly.",
      contact,
    }),
    { status: 429, headers: { "Content-Type": "application/json" } },
  );
}

function unavailableResponse(): Response {
  const { contact } = getProfile();
  return new Response(
    JSON.stringify({
      error: "unavailable",
      message:
        "The AI assistant is temporarily unavailable. Please try again shortly, or reach out directly.",
      contact,
    }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}

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

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const store = createUpstashRateLimitStore();

  const ipResult = await checkRateLimit(
    store,
    `ip:${ip}`,
    PER_IP_LIMIT,
    PER_IP_WINDOW_SECONDS,
  );
  if (!ipResult.allowed) {
    return rateLimitedResponse();
  }

  const sessionId = request.headers.get("x-chat-session-id");
  if (sessionId) {
    const sessionResult = await checkRateLimit(
      store,
      `session:${sessionId}`,
      PER_SESSION_LIMIT,
      PER_SESSION_WINDOW_SECONDS,
    );
    if (!sessionResult.allowed) {
      return rateLimitedResponse();
    }
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

  let retrievedChunks;
  let tokens;
  try {
    ({ retrievedChunks, tokens } = await streamGroundedAnswer(
      parsed.data.question,
      { embeddingClient, provider, index },
    ));
  } catch {
    return unavailableResponse();
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        try {
          for await (const token of tokens) {
            controller.enqueue(encoder.encode(formatSseEvent("token", token)));
          }
        } catch {
          controller.enqueue(
            encoder.encode(
              formatSseEvent("error", {
                message: "The AI assistant is temporarily unavailable.",
              }),
            ),
          );
          return;
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
