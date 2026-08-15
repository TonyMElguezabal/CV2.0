import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { IndexedChunk } from "./embed.ts";

// Fetched via the Workers Static Assets binding, not bundled into the
// Worker's own script — the index is ~30% of the Worker's gzipped size by
// itself (embeddings compress poorly, ~5:1 vs ordinary JS's ~16:1), and
// Static Assets carries no comparable size limit. Not a `node:fs` read
// either way, so this satisfies cloudflare-deployment-compat's
// "no request-time filesystem reads" requirement (amended in
// openspec/changes/reduce-worker-bundle-size to describe this mechanism —
// see design.md Decision 6). `lib/rag/publish-index.ts` (run in `prebuild`)
// is what puts the index at this path as a build-time-generated static
// asset from embed.ts's own canonical output.
const INDEX_ASSET_URL = "https://assets.local/rag-index.json";

// Cached per Worker isolate so a chat request doesn't re-fetch and
// re-parse the index on every call — `loadIndex()` used to get this for
// free from the JS module cache when the index was a build-time import.
let cachedIndex: IndexedChunk[] | null = null;

export async function loadIndex(): Promise<IndexedChunk[]> {
  if (cachedIndex) {
    return cachedIndex;
  }

  const { env } = await getCloudflareContext({ async: true });
  const response = await env.ASSETS.fetch(INDEX_ASSET_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch retrieval index from Assets binding: ${response.status} ${response.statusText}`,
    );
  }

  cachedIndex = (await response.json()) as IndexedChunk[];
  return cachedIndex;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function retrieveTopK(
  queryEmbedding: number[],
  index: IndexedChunk[],
  k: number = 5,
): IndexedChunk[] {
  return [...index]
    .sort(
      (a, b) =>
        cosineSimilarity(queryEmbedding, b.embedding) -
        cosineSimilarity(queryEmbedding, a.embedding),
    )
    .slice(0, k);
}
