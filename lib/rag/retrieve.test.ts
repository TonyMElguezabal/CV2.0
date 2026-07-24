import { cosineSimilarity, loadIndex, retrieveTopK } from "./retrieve.ts";
import type { IndexedChunk } from "./embed.ts";

function makeChunk(id: string, embedding: number[]): IndexedChunk {
  return {
    id,
    text: `text for ${id}`,
    source: "faq",
    anchor: "#faq",
    embedding,
  };
}

describe("loadIndex", () => {
  it("loads the bundled RAG index via a static import, not a runtime filesystem read", async () => {
    const index = await loadIndex();

    expect(Array.isArray(index)).toBe(true);
    expect(index.length).toBeGreaterThan(0);
    expect(index[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        text: expect.any(String),
        source: expect.any(String),
        anchor: expect.any(String),
        embedding: expect.any(Array),
      }),
    );
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });
});

describe("retrieveTopK", () => {
  const index = [
    makeChunk("close", [1, 0, 0]),
    makeChunk("far", [0, 1, 0]),
    makeChunk("closest", [0.99, 0.01, 0]),
    makeChunk("opposite", [-1, 0, 0]),
  ];

  it("ranks chunks by similarity to the query, most similar first", () => {
    const results = retrieveTopK([1, 0, 0], index, 4);
    expect(results.map((r) => r.id)).toEqual([
      "close",
      "closest",
      "far",
      "opposite",
    ]);
  });

  it("returns only the top k results", () => {
    const results = retrieveTopK([1, 0, 0], index, 2);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(["close", "closest"]);
  });

  it("does not mutate the original index order", () => {
    const originalOrder = index.map((c) => c.id);
    retrieveTopK([0, 1, 0], index, 4);
    expect(index.map((c) => c.id)).toEqual(originalOrder);
  });
});
