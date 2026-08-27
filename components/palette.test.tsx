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
import {
  contrastRatio,
  compositeOverBackground,
  contrastRatioRgb,
  hexToRgb,
} from "@/lib/color/contrast.ts";
import { heroLaptopAccentHex } from "./HeroShellStyles.ts";
import {
  LINK_PEAK_ALPHA,
  LINK_PEAK_ALPHA_CEILING,
} from "./AmbientSparkleLayer.tsx";

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

describe("ambient link contrast bound (ambient-constellation-links design.md Decisions 3–4)", () => {
  const HAIR_HEX = "#6f6558";
  const INK_META_HEX = "#8b8275";

  it("stays within the hard ceiling of --hair parity", () => {
    // Not negotiable — design.md Decision 4. The rendered value (0.75) sits
    // below this with margin; the ceiling is what a unit test can enforce.
    expect(LINK_PEAK_ALPHA).toBeLessThanOrEqual(LINK_PEAK_ALPHA_CEILING);
    const ceilingContrast = contrastRatioRgb(
      compositeOverBackground(
        heroLaptopAccentHex,
        PAGE_BACKGROUND,
        LINK_PEAK_ALPHA_CEILING,
        "source-over"
      ),
      hexToRgb(PAGE_BACKGROUND)
    );
    const hairContrast = contrastRatio(HAIR_HEX, PAGE_BACKGROUND);
    expect(ceilingContrast).toBeLessThanOrEqual(hairContrast + 0.01);
  });

  it("peak-alpha links, composited source-over, stay at or below --hair's contrast — the palette's structure-not-content weight", () => {
    const linkContrast = contrastRatioRgb(
      compositeOverBackground(
        heroLaptopAccentHex,
        PAGE_BACKGROUND,
        LINK_PEAK_ALPHA,
        "source-over"
      ),
      hexToRgb(PAGE_BACKGROUND)
    );
    const hairContrast = contrastRatio(HAIR_HEX, PAGE_BACKGROUND);
    expect(linkContrast).toBeLessThanOrEqual(hairContrast + 0.01);
  });

  it("the same colour composited additively (\"lighter\") would exceed --ink-meta's text floor — this is why the link pass may not use it", () => {
    // Documents the rejected alternative (Decision 3): if a future change
    // switches the link pass to additive compositing, this fails loudly
    // with the reason attached, rather than the layer silently brightening
    // past the site's text-contrast floor.
    const additiveContrast = contrastRatioRgb(
      compositeOverBackground(heroLaptopAccentHex, PAGE_BACKGROUND, 1, "lighter"),
      hexToRgb(PAGE_BACKGROUND)
    );
    const inkMetaContrast = contrastRatio(INK_META_HEX, PAGE_BACKGROUND);
    expect(additiveContrast).toBeGreaterThan(inkMetaContrast);
  });

  it("the bound holds regardless of link overlap density — source-over cannot accumulate past a single link's own colour", () => {
    // Overlapping source-over strokes at the same alpha never exceed what a
    // single stroke at that alpha would measure, because normal alpha
    // compositing converges toward (never past) the source colour. Modeled
    // here by compositing the peak-alpha colour over itself, simulating an
    // arbitrarily dense crossing.
    const singleLink = compositeOverBackground(
      heroLaptopAccentHex,
      PAGE_BACKGROUND,
      LINK_PEAK_ALPHA,
      "source-over"
    );
    const singleLinkHex = `#${singleLink
      .map((c) => Math.round(c).toString(16).padStart(2, "0"))
      .join("")}`;
    const doublyOverlapped = compositeOverBackground(
      heroLaptopAccentHex,
      singleLinkHex,
      LINK_PEAK_ALPHA,
      "source-over"
    );
    const singleContrast = contrastRatioRgb(singleLink, hexToRgb(PAGE_BACKGROUND));
    const overlappedContrast = contrastRatioRgb(
      doublyOverlapped,
      hexToRgb(PAGE_BACKGROUND)
    );
    // A second overlapping stroke moves the result closer to the accent's
    // own colour, not past it — bounded by the accent-over-background
    // contrast at alpha 1, which is itself below --ink-meta's floor.
    const fullAccentContrast = contrastRatio(heroLaptopAccentHex, PAGE_BACKGROUND);
    expect(overlappedContrast).toBeGreaterThanOrEqual(singleContrast);
    expect(overlappedContrast).toBeLessThanOrEqual(fullAccentContrast + 0.01);
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
