// @vitest-environment node
//
// Source-content check on app/globals.css, same technique as palette.test.tsx
// and for the same reason: jsdom has no CSS engine to resolve scroll-margin
// against real layout anyway (design.md Decision 3 / Risk "scroll-margin-top
// is easy to under-apply"). A universal `[id]` rule is used deliberately
// instead of per-target overrides, so it covers all three anchor families in
// one place — header nav targets (#career/#skills/#projects), the timeline's
// per-chapter targets (dynamic ids from content, can't be enumerated here),
// and the skip link's #main — without relying on remembering to add it to
// each one individually.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readGlobalsCss(): string {
  return readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
}

describe("anchor scroll clearance (editorial-frame Task Group 3)", () => {
  it("applies scroll-margin-top to every id'd element via a universal [id] rule", () => {
    const css = readGlobalsCss();
    const match = css.match(
      /\[id\]\s*{[^}]*scroll-margin-top:\s*([\d.]+)(rem|px)[^}]*}/
    );
    expect(match).not.toBeNull();

    const [, value, unit] = match as unknown as [string, string, string];
    const pixels = unit === "rem" ? parseFloat(value) * 16 : parseFloat(value);

    // Must clear the header's real rendered height (SiteHeaderStyles.ts:
    // h-14 utility row + h-10 nav row = 96px) with room to spare.
    expect(pixels).toBeGreaterThanOrEqual(96);
  });
});
