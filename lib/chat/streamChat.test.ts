import { streamChat, ChatRequestError } from "./streamChat.ts";

function fakeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index += 1;
      } else {
        controller.close();
      }
    },
  });
}

function mockFetchOk(chunks: string[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: fakeStream(chunks),
    }),
  );
}

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iterable) {
    results.push(item);
  }
  return results;
}

const CITATIONS = [{ source: "faq", chapterId: "faq", anchor: "#faq" }];

describe("streamChat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("yields token, citations, and done events in order", async () => {
    mockFetchOk([
      'event: token\ndata: "Hel"\n\n' +
        'event: token\ndata: "lo"\n\n' +
        `event: citations\ndata: ${JSON.stringify(CITATIONS)}\n\n` +
        "event: done\ndata: {}\n\n",
    ]);

    const events = await collect(streamChat("Who is Jose?"));

    expect(events).toEqual([
      { type: "token", value: "Hel" },
      { type: "token", value: "lo" },
      { type: "citations", value: CITATIONS },
      { type: "done" },
    ]);
  });

  it("sends the question as a POST body to /api/chat", async () => {
    mockFetchOk(["event: done\ndata: {}\n\n"]);

    await collect(streamChat("Who is Jose?"));

    expect(fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ question: "Who is Jose?" }),
      }),
    );
  });

  it("reassembles a frame whose bytes are split across two separate stream reads", async () => {
    const frame = 'event: token\ndata: "Hello"\n\n';
    const splitPoint = 15;
    mockFetchOk([frame.slice(0, splitPoint), frame.slice(splitPoint)]);

    const events = await collect(streamChat("Who is Jose?"));

    expect(events).toEqual([{ type: "token", value: "Hello" }]);
  });

  it("throws a ChatRequestError carrying the HTTP status when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, body: null }),
    );

    await expect(collect(streamChat("Who is Jose?"))).rejects.toMatchObject({
      status: 503,
    });
    await expect(
      collect(streamChat("Who is Jose?")),
    ).rejects.toBeInstanceOf(ChatRequestError);
  });

  it("carries a 429 status distinctly for a rate-limited response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, body: null }),
    );

    await expect(collect(streamChat("Who is Jose?"))).rejects.toMatchObject({
      status: 429,
    });
  });

  it("throws a ChatRequestError with a synthetic 503 status on a mid-stream error event, after yielding preceding tokens", async () => {
    mockFetchOk([
      'event: token\ndata: "partial"\n\n' + 'event: error\ndata: {"message":"boom"}\n\n',
    ]);

    const iterator = streamChat("Who is Jose?");
    const first = await iterator.next();
    expect(first.value).toEqual({ type: "token", value: "partial" });

    let caught: unknown;
    try {
      await iterator.next();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ChatRequestError);
    expect((caught as ChatRequestError).status).toBe(503);
  });

  it("sends a stable session id header across calls", async () => {
    mockFetchOk(["event: done\ndata: {}\n\n"]);
    await collect(streamChat("Who is Jose?"));
    const firstHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1]
      .headers;

    mockFetchOk(["event: done\ndata: {}\n\n"]);
    await collect(streamChat("What problems has he solved?"));
    const secondHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1]
      .headers;

    expect(firstHeaders["x-chat-session-id"]).toBeTruthy();
    expect(firstHeaders["x-chat-session-id"]).toBe(
      secondHeaders["x-chat-session-id"],
    );
  });
});
