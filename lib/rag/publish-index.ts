import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_INDEX_PATH } from "./embed.ts";

export const PUBLIC_INDEX_PATH = join(
  process.cwd(),
  "public",
  "rag-index.json",
);

// Copies embed.ts's canonical index output into public/ so Next ships it as
// a static asset instead of it being bundled into the Worker's own script —
// the index is ~30% of the Worker's gzipped size by itself (embeddings
// compress poorly), and Workers Static Assets carries no such size limit.
// retrieve.ts's loadIndex() fetches it at request time via the `ASSETS`
// binding. See openspec/changes/reduce-worker-bundle-size/design.md
// Decision 6.
function main(): void {
  copyFileSync(DEFAULT_INDEX_PATH, PUBLIC_INDEX_PATH);
  console.log(`Published index to ${PUBLIC_INDEX_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
