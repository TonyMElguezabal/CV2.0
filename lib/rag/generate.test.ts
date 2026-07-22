import {
  generateGroundedAnswer,
  streamGroundedAnswer,
  dedupeCitations,
  SYSTEM_PROMPT,
  RELEVANCE_THRESHOLD,
  OFF_TOPIC_REFUSAL,
} from "./generate.ts";
import type { IndexedChunk } from "./embed.ts";
import type { GenerateRequest, LlmProvider } from "./adapter.ts";

function makeChunk(overrides: Partial<IndexedChunk> = {}): IndexedChunk {
  return {
    id: "envato-context",
    text: "Led platform modernization at Envato.",
    source: "experience",
    chapterId: "envato",
    anchor: "#envato",
    embedding: [1, 0, 0],
    ...overrides,
  };
}

describe("generateGroundedAnswer", () => {
  it("embeds the question, retrieves the top-k chunks, and calls the provider with the shared system prompt", async () => {
    const index = [
      makeChunk({ id: "a", embedding: [1, 0, 0] }),
      makeChunk({ id: "b", text: "Second chunk.", embedding: [0, 1, 0] }),
    ];
    const embeddingClient = {
      embeddings: {
        create: async () => ({ data: [{ embedding: [1, 0, 0] }] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    let capturedRequest: GenerateRequest | undefined;
    const provider: LlmProvider = {
      name: "fake",
      model: "fake-model",
      generate: async (request) => {
        capturedRequest = request;
        return { answer: "Jose led the effort.", inputTokens: 10, outputTokens: 20 };
      },
      generateStream: async function* () {},
    };

    const result = await generateGroundedAnswer("Who led Envato?", {
      embeddingClient,
      provider,
      index,
      k: 1,
    });

    expect(result.answer).toBe("Jose led the effort.");
    expect(result.retrievedChunks).toEqual([index[0]]);
    expect(result.inputTokens).toBe(10);
    expect(result.outputTokens).toBe(20);
    expect(capturedRequest?.systemPrompt).toBe(SYSTEM_PROMPT);
    expect(capturedRequest?.context).toBe("Led platform modernization at Envato.");
    expect(capturedRequest?.question).toBe("Who led Envato?");
  });

  it("joins multiple retrieved chunks with the shared separator", async () => {
    const index = [
      makeChunk({ id: "a", embedding: [1, 0, 0], text: "First." }),
      makeChunk({ id: "b", embedding: [0.9, 0.1, 0], text: "Second." }),
    ];
    const embeddingClient = {
      embeddings: {
        create: async () => ({ data: [{ embedding: [1, 0, 0] }] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    let capturedContext = "";
    const provider: LlmProvider = {
      name: "fake",
      model: "fake-model",
      generate: async (request) => {
        capturedContext = request.context;
        return { answer: "", inputTokens: 0, outputTokens: 0 };
      },
      generateStream: async function* () {},
    };

    await generateGroundedAnswer("question", {
      embeddingClient,
      provider,
      index,
      k: 2,
    });

    expect(capturedContext).toBe("First.\n\n---\n\nSecond.");
  });

  it("makes no real network calls — only the injected fakes are invoked", async () => {
    const index = [makeChunk()];
    let embedCalls = 0;
    let generateCalls = 0;
    const embeddingClient = {
      embeddings: {
        create: async () => {
          embedCalls += 1;
          return { data: [{ embedding: [1, 0, 0] }] };
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const provider: LlmProvider = {
      name: "fake",
      model: "fake-model",
      generate: async () => {
        generateCalls += 1;
        return { answer: "answer", inputTokens: 1, outputTokens: 1 };
      },
      generateStream: async function* () {},
    };

    await generateGroundedAnswer("question", { embeddingClient, provider, index });

    expect(embedCalls).toBe(1);
    expect(generateCalls).toBe(1);
  });
});

describe("generateGroundedAnswer — off-topic relevance guard", () => {
  it("returns the canonical off-topic refusal without calling the provider when the top chunk is below RELEVANCE_THRESHOLD", async () => {
    const index = [makeChunk({ id: "a", embedding: [1, 0, 0] })];
    const embeddingClient = {
      embeddings: {
        // Orthogonal to the chunk's embedding: cosine similarity is 0.
        create: async () => ({ data: [{ embedding: [0, 1, 0] }] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    let generateCalled = false;
    const provider: LlmProvider = {
      name: "fake",
      model: "fake-model",
      generate: async () => {
        generateCalled = true;
        return { answer: "should not be called", inputTokens: 0, outputTokens: 0 };
      },
      generateStream: async function* () {},
    };

    const result = await generateGroundedAnswer("What's the weather like?", {
      embeddingClient,
      provider,
      index,
    });

    expect(result.answer).toBe(OFF_TOPIC_REFUSAL);
    expect(result.retrievedChunks).toEqual([]);
    expect(generateCalled).toBe(false);
  });

  it("proceeds normally when the top chunk meets RELEVANCE_THRESHOLD", async () => {
    const index = [makeChunk({ id: "a", embedding: [1, 0, 0] })];
    const embeddingClient = {
      embeddings: {
        // Identical to the chunk's embedding: cosine similarity is 1.
        create: async () => ({ data: [{ embedding: [1, 0, 0] }] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const provider: LlmProvider = {
      name: "fake",
      model: "fake-model",
      generate: async () => ({
        answer: "Jose led the effort.",
        inputTokens: 10,
        outputTokens: 20,
      }),
      generateStream: async function* () {},
    };

    const result = await generateGroundedAnswer("Who is Jose?", {
      embeddingClient,
      provider,
      index,
    });

    expect(result.answer).toBe("Jose led the effort.");
    expect(result.retrievedChunks).toEqual([index[0]]);
  });
});

describe("streamGroundedAnswer — off-topic relevance guard", () => {
  it("yields exactly the canonical off-topic refusal, without calling generateStream, when below RELEVANCE_THRESHOLD", async () => {
    const index = [makeChunk({ id: "a", embedding: [1, 0, 0] })];
    const embeddingClient = {
      embeddings: {
        create: async () => ({ data: [{ embedding: [0, 1, 0] }] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    let generateStreamCalled = false;
    const provider: LlmProvider = {
      name: "fake",
      model: "fake-model",
      generate: async () => ({ answer: "", inputTokens: 0, outputTokens: 0 }),
      generateStream: () => {
        generateStreamCalled = true;
        return (async function* () {})();
      },
    };

    const result = await streamGroundedAnswer("What's the weather like?", {
      embeddingClient,
      provider,
      index,
    });

    expect(result.retrievedChunks).toEqual([]);
    const received: string[] = [];
    for await (const token of result.tokens) {
      received.push(token);
    }
    expect(received).toEqual([OFF_TOPIC_REFUSAL]);
    expect(generateStreamCalled).toBe(false);
  });

  it("calls generateStream normally when the top chunk meets RELEVANCE_THRESHOLD", async () => {
    const index = [makeChunk({ id: "a", embedding: [1, 0, 0] })];
    const embeddingClient = {
      embeddings: {
        create: async () => ({ data: [{ embedding: [1, 0, 0] }] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    let generateStreamCalled = false;
    const provider: LlmProvider = {
      name: "fake",
      model: "fake-model",
      generate: async () => ({ answer: "", inputTokens: 0, outputTokens: 0 }),
      generateStream: () => {
        generateStreamCalled = true;
        return (async function* () {
          yield "Hello";
        })();
      },
    };

    const result = await streamGroundedAnswer("Who is Jose?", {
      embeddingClient,
      provider,
      index,
    });

    const received: string[] = [];
    for await (const token of result.tokens) {
      received.push(token);
    }
    expect(received).toEqual(["Hello"]);
    expect(generateStreamCalled).toBe(true);
    expect(result.retrievedChunks).toEqual([index[0]]);
  });

  it("exposes RELEVANCE_THRESHOLD as a positive number", () => {
    expect(RELEVANCE_THRESHOLD).toBeGreaterThan(0);
  });
});

describe("dedupeCitations", () => {
  it("dedupes chunks sharing the same anchor, keeping one entry per anchor", () => {
    const chunks = [
      makeChunk({ id: "a", anchor: "#envato", chapterId: "envato" }),
      makeChunk({ id: "b", anchor: "#envato", chapterId: "envato" }),
      makeChunk({
        id: "c",
        anchor: "#skill-typescript",
        source: "skill",
        chapterId: undefined,
      }),
    ];

    const citations = dedupeCitations(chunks);

    expect(citations).toEqual([
      { source: "experience", chapterId: "envato", anchor: "#envato" },
      { source: "skill", chapterId: undefined, anchor: "#skill-typescript" },
    ]);
  });

  it("returns an empty array for no chunks", () => {
    expect(dedupeCitations([])).toEqual([]);
  });
});

describe("streamGroundedAnswer", () => {
  async function* fakeTokenStream(chunks: string[]): AsyncGenerator<string> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  it("returns retrieved chunks immediately and a token generator yielding the provider's chunks", async () => {
    const index = [makeChunk({ id: "a", embedding: [1, 0, 0] })];
    const embeddingClient = {
      embeddings: {
        create: async () => ({ data: [{ embedding: [1, 0, 0] }] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    let generateStreamCalled = false;
    const provider: LlmProvider = {
      name: "fake",
      model: "fake-model",
      generate: async () => ({ answer: "", inputTokens: 0, outputTokens: 0 }),
      generateStream: (request: GenerateRequest) => {
        generateStreamCalled = true;
        expect(request.systemPrompt).toBe(SYSTEM_PROMPT);
        return fakeTokenStream(["Hello", ", ", "world."]);
      },
    };

    const result = await streamGroundedAnswer("question", {
      embeddingClient,
      provider,
      index,
    });

    expect(result.retrievedChunks).toEqual([index[0]]);
    expect(generateStreamCalled).toBe(true);

    const received: string[] = [];
    for await (const token of result.tokens) {
      received.push(token);
    }
    expect(received).toEqual(["Hello", ", ", "world."]);
  });

  it("makes no real network calls — only the injected fakes are invoked", async () => {
    const index = [makeChunk()];
    let embedCalls = 0;
    const embeddingClient = {
      embeddings: {
        create: async () => {
          embedCalls += 1;
          return { data: [{ embedding: [1, 0, 0] }] };
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const provider: LlmProvider = {
      name: "fake",
      model: "fake-model",
      generate: async () => ({ answer: "", inputTokens: 0, outputTokens: 0 }),
      generateStream: () => fakeTokenStream(["ok"]),
    };

    const result = await streamGroundedAnswer("question", {
      embeddingClient,
      provider,
      index,
    });
    // Drain the generator to exercise the full path.
    for await (const _token of result.tokens) {
      // no-op
    }

    expect(embedCalls).toBe(1);
  });
});
