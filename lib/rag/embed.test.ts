import { buildEmbeddingIndex } from "./embed.ts";
import type { ContentChunk } from "../content/chunk.ts";

function makeChunk(overrides: Partial<ContentChunk> = {}): ContentChunk {
  return {
    id: "envato-context",
    text: "Led platform modernization at Envato.",
    source: "experience",
    chapterId: "envato",
    anchor: "#envato",
    ...overrides,
  };
}

describe("buildEmbeddingIndex", () => {
  it("carries each chunk's source/chapterId/anchor metadata alongside its embedding", async () => {
    const chunks = [
      makeChunk({ id: "envato-context", anchor: "#envato" }),
      makeChunk({
        id: "skill-typescript",
        source: "skill",
        chapterId: undefined,
        anchor: "#skill-typescript",
      }),
    ];
    const fakeClient = {
      embeddings: {
        create: async () => ({
          data: chunks.map((_, index) => ({ embedding: [index, index + 1] })),
        }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const indexed = await buildEmbeddingIndex(chunks, fakeClient);

    expect(indexed).toHaveLength(2);
    expect(indexed[0]).toMatchObject({
      id: "envato-context",
      source: "experience",
      chapterId: "envato",
      anchor: "#envato",
      embedding: [0, 1],
    });
    expect(indexed[1]).toMatchObject({
      id: "skill-typescript",
      source: "skill",
      chapterId: undefined,
      anchor: "#skill-typescript",
      embedding: [1, 2],
    });
  });

  it("throws identifying the chunk id when the API response is missing an embedding", async () => {
    const chunks = [makeChunk({ id: "envato-context" })];
    const fakeClient = {
      embeddings: {
        create: async () => ({ data: [{}] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    await expect(buildEmbeddingIndex(chunks, fakeClient)).rejects.toThrow(
      "envato-context",
    );
  });
});
