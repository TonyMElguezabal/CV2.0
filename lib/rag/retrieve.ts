import { readFileSync } from "node:fs";
import { DEFAULT_INDEX_PATH, type IndexedChunk } from "./embed.ts";

export function loadIndex(path: string = DEFAULT_INDEX_PATH): IndexedChunk[] {
  return JSON.parse(readFileSync(path, "utf-8"));
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
