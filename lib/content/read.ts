import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { ProfileSchema } from "./schemas.ts";
import type { Profile } from "./types.ts";

// process.cwd(), not import.meta.dirname: this module is imported into
// Next.js's bundle (unlike validate.ts/cli.ts, which only run via raw
// `node`), and bundlers don't reliably populate import.meta.dirname.
// process.cwd() is the standard Next.js pattern for reading local content
// at request/build time — Next always runs with cwd set to the project root.
const contentRoot = join(process.cwd(), "content");

export function getProfile(): Profile {
  const raw = readFileSync(join(contentRoot, "profile.yaml"), "utf-8");
  return ProfileSchema.parse(parseYaml(raw));
}
