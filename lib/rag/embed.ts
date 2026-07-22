import { writeFileSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";
import { getContentChunks, type ContentChunk } from "../content/chunk.ts";

export interface IndexedChunk extends ContentChunk {
  embedding: number[];
}

// Embeddings use OpenAI's text-embedding-3-small regardless of which
// provider wins the generation comparison — Anthropic has no first-party
// embeddings API. See design.md in openspec/changes/llm-retrieval-spike.
export const EMBEDDING_MODEL = "text-embedding-3-small";

export const DEFAULT_INDEX_PATH = join(process.cwd(), "lib", "rag", "index.json");

export async function buildEmbeddingIndex(
  chunks: ContentChunk[],
  client: Pick<OpenAI, "embeddings">,
): Promise<IndexedChunk[]> {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: chunks.map((chunk) => chunk.text),
  });

  return chunks.map((chunk, index) => {
    const embedding = response.data[index]?.embedding;
    if (!embedding) {
      throw new Error(`Missing embedding for chunk ${chunk.id}`);
    }
    return { ...chunk, embedding };
  });
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is required to build the embedding index.");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const chunks = getContentChunks();
  console.log(`Embedding ${chunks.length} chunks with ${EMBEDDING_MODEL}...`);
  const indexed = await buildEmbeddingIndex(chunks, client);
  writeFileSync(DEFAULT_INDEX_PATH, JSON.stringify(indexed, null, 2));
  console.log(`Wrote ${indexed.length}-chunk index to ${DEFAULT_INDEX_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
