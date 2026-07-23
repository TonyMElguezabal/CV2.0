import type { Citation } from "../rag/generate.ts";
import { getSessionId } from "../session.ts";

export type ChatStreamEvent =
  | { type: "token"; value: string }
  | { type: "citations"; value: Citation[] }
  | { type: "done" };

export class ChatRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Chat request failed with status ${status}`);
    this.name = "ChatRequestError";
    this.status = status;
  }
}

function parseSseFrame(frame: string): ChatStreamEvent | null {
  const lines = frame.split("\n");
  const eventLine = lines.find((line) => line.startsWith("event:"));
  const dataLine = lines.find((line) => line.startsWith("data:"));
  if (!eventLine || !dataLine) {
    return null;
  }

  const eventName = eventLine.slice("event:".length).trim();
  const data: unknown = JSON.parse(dataLine.slice("data:".length).trim());

  switch (eventName) {
    case "token":
      return { type: "token", value: data as string };
    case "citations":
      return { type: "citations", value: data as Citation[] };
    case "done":
      return { type: "done" };
    case "error":
      // A mid-stream failure has no real HTTP status — headers were already
      // sent as 200 — so 503 here is a synthetic marker meaning "service
      // unavailable", reused so ChatWidget only needs one unavailable-
      // message branch regardless of when the failure happened.
      throw new ChatRequestError(503);
    default:
      return null;
  }
}

// Client-side inverse of lib/rag/sse.ts's formatSseEvent: decodes the SSE
// frames POST /api/chat streams back. EventSource can't be used here since
// it only supports GET requests.
export async function* streamChat(
  question: string,
): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-chat-session-id": getSessionId(),
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok || !response.body) {
    throw new ChatRequestError(response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const frame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const event = parseSseFrame(frame);
        if (event) {
          yield event;
        }
        separatorIndex = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}
