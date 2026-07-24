import type { IndexedChunk } from "./embed.ts";

// A dynamic import (not `node:fs`) so the index is bundled at build time as
// a module reference rather than read from disk at request time — the
// Cloudflare Workers runtime (via the OpenNext adapter) does not support
// request-time `readFileSync` for this — see
// openspec/changes/cloudflare-deployment-readiness. Kept dynamic (not a
// static top-level import) so merely importing this module doesn't require
// lib/rag/index.json to already exist — only calling loadIndex() does,
// preserving the previous lazy-read behavior for tests that never call it.
export async function loadIndex(): Promise<IndexedChunk[]> {
  const module = await import("./index.json", { with: { type: "json" } });
  return module.default as IndexedChunk[];
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
