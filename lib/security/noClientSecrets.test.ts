import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SECRET_NAMES = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "DATABASE_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const SOURCE_ROOTS = ["app", "components", "lib"];
const SCAN_EXTENSIONS = [".ts", ".tsx"];
const projectRoot = process.cwd();

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (SCAN_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function isClientFile(content: string): boolean {
  const firstStatement = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return firstStatement === '"use client";' || firstStatement === "'use client';" ||
    firstStatement === '"use client"' || firstStatement === "'use client'";
}

const clientFiles = SOURCE_ROOTS.flatMap((root) =>
  collectSourceFiles(join(projectRoot, root))
).filter((path) => !path.includes(".test."));

describe("no secret env names in client-bundled code", () => {
  it("finds at least one \"use client\" file to scan (sanity check the scan itself works)", () => {
    const clientFileCount = clientFiles.filter((path) =>
      isClientFile(readFileSync(path, "utf8"))
    ).length;
    expect(clientFileCount).toBeGreaterThan(0);
  });

  it("no \"use client\" file references a secret environment variable name", () => {
    const violations: Array<{ file: string; secret: string }> = [];

    for (const path of clientFiles) {
      const content = readFileSync(path, "utf8");
      if (!isClientFile(content)) continue;

      for (const secret of SECRET_NAMES) {
        if (content.includes(secret)) {
          violations.push({ file: path, secret });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("no NEXT_PUBLIC_ variable name itself contains a secret-sounding suffix", () => {
    const violations: Array<{ file: string; match: string }> = [];
    const suspiciousPattern = /NEXT_PUBLIC_\w*(API_KEY|SECRET|TOKEN|PASSWORD)\w*/gi;

    for (const path of collectSourceFiles(projectRoot).filter(
      (p) => !p.includes("node_modules") && !p.includes(".test.")
    )) {
      const content = readFileSync(path, "utf8");
      const matches = content.match(suspiciousPattern);
      if (matches) {
        for (const match of matches) {
          violations.push({ file: path, match });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
