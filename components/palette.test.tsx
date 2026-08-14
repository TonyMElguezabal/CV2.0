// @vitest-environment node
//
// Source-content checks on app/globals.css's :root block, matching the same
// approach used for the font tokens (lib/fonts.test.ts) and for the same
// reason: these are CSS custom properties, not JS values, so there's
// nothing to import — and jsdom has no CSS engine to resolve them against
// real rendering anyway.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contrastRatio } from "@/lib/color/contrast.ts";
import { heroLaptopAccentHex } from "./HeroShellStyles.ts";

const PAGE_BACKGROUND = "#0a0a0a";

function readGlobalsCss(): string {
  return readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
}

function extractToken(css: string, name: string): string {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  const hex = match?.[1];
  if (!hex) throw new Error(`Token ${name} not found in globals.css`);
  return hex;
}

describe("palette tokens (site-typography-and-palette design.md Decision 5)", () => {
  const css = readGlobalsCss();

  it.each([
    ["--ink", "#ece7dd"],
    ["--ink-body", "#b9b2a6"],
    ["--ink-meta", "#8b8275"],
  ])("%s (%s) meets 4.5:1 against the page background", (token, expectedHex) => {
    const hex = extractToken(css, token);
    expect(hex.toLowerCase()).toBe(expectedHex);
    expect(contrastRatio(hex, PAGE_BACKGROUND)).toBeGreaterThanOrEqual(4.5);
  });

  it("--hair is deliberately below the normal-text threshold (borders only, by design)", () => {
    const hex = extractToken(css, "--hair");
    expect(hex.toLowerCase()).toBe("#6f6558");
    const ratio = contrastRatio(hex, PAGE_BACKGROUND);
    // Documents the known-failing value so a future accidental "fix" that
    // brightens --hair doesn't silently change what task 4.4 depends on.
    expect(ratio).toBeLessThan(4.5);
    expect(ratio).toBeGreaterThanOrEqual(3.0); // still fine for borders
  });

  it("--accent matches heroLaptopAccentHex exactly — one accent, not two", () => {
    // globals.css can't `var()`-reference a JS constant, and Tailwind's JIT
    // can't compile an arbitrary-value class built from one either (JOS-105
    // hit this exact bug), so the hex is necessarily duplicated between
    // HeroShellStyles.ts and globals.css. This guards against the two
    // drifting apart.
    const hex = extractToken(css, "--accent");
    expect(hex.toLowerCase()).toBe(heroLaptopAccentHex.toLowerCase());
    expect(contrastRatio(hex, PAGE_BACKGROUND)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("the hairline tint never carries text", () => {
  const styleFiles = [
    "HeroShellStyles.ts",
    "CareerChaptersStyles.ts",
    "SkillsSectionStyles.ts",
    "ProjectsSectionStyles.ts",
    "ContactSectionStyles.ts",
    "CareerTimelineStyles.ts",
    "SiteFooterStyles.ts",
  ];

  it.each(styleFiles)("%s: no text-color utility resolves to --hair", (file) => {
    const source = readFileSync(
      join(process.cwd(), "components", file),
      "utf8"
    );
    // A hairline used as a border/divide colour is fine (e.g. `border-hair`
    // or `divide-[color:var(--hair)]`); the failure mode this guards is a
    // `text-*` utility resolving to it — checked in both forms Tailwind
    // makes available: the short utility (`text-hair`, real because
    // `@theme inline` maps `--color-hair: var(--hair)`) and the arbitrary-
    // value form (`text-[color:var(--hair)]`).
    expect(source).not.toMatch(/\btext-hair\b/);
    expect(source).not.toMatch(/text-\[(?:color:)?var\(--hair\)\]/);
  });
});
