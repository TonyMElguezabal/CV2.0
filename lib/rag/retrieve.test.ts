import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cosineSimilarity, retrieveTopK } from "./retrieve.ts";
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

// retrieve.ts fetches the index via the Workers Static Assets binding
// (getCloudflareContext().env.ASSETS.fetch), not a build-time import —
// design.md Decision 6 in openspec/changes/reduce-worker-bundle-size. Mocked
// here rather than relying on next.config.ts's dev-mode Cloudflare shim,
// which Vitest doesn't run under.
const fetchMock = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({
    env: { ASSETS: { fetch: fetchMock } },
  }),
}));

function realIndexFixture(): IndexedChunk[] {
  const raw = readFileSync(
    join(process.cwd(), "lib", "rag", "index.json"),
    "utf-8",
  );
  return JSON.parse(raw) as IndexedChunk[];
}

describe("loadIndex", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
  });

  it("loads the RAG index via the Assets binding, not a runtime filesystem read", async () => {
    const realIndex = realIndexFixture();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(realIndex), { status: 200 }),
    );
    const { loadIndex } = await import("./retrieve.ts");

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

  it("fetches the asset URL and caches the result — a second call does not fetch again", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([makeChunk("a", [1, 0])]), { status: 200 }),
    );
    const { loadIndex } = await import("./retrieve.ts");

    await loadIndex();
    await loadIndex();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error when the Assets fetch fails", async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 404, statusText: "Not Found" }),
    );
    const { loadIndex } = await import("./retrieve.ts");

    await expect(loadIndex()).rejects.toThrow(/404/);
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
