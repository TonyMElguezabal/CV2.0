import { streamChat } from "./streamChat.ts";

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

  it("throws without leaving the reader open when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, body: null }),
    );

    await expect(collect(streamChat("Who is Jose?"))).rejects.toThrow(/503/);
  });
});
