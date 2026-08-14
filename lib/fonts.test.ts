import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// next/font/local (like next/font/google) requires Next's own SWC/webpack
// compiler transform to run — calling it directly under Vitest throws
// "default is not a function" (verified empirically before writing this
// test). Mocked here so the module's own wiring (which font file, which
// weight, which CSS variable name) can be tested without Next's build.
const localFontCalls: Array<Record<string, unknown>> = [];
vi.mock("next/font/local", () => ({
  default: (options: Record<string, unknown>) => {
    localFontCalls.push(options);
    const variable = options.variable as string;
    return {
      variable: `mock-var__${variable.replace(/^--/, "")}`,
      className: `mock-class__${variable.replace(/^--/, "")}`,
      style: { fontFamily: "mock" },
    };
  },
}));

describe("lib/fonts", () => {
  it("loads exactly two static instances, not a variable-axis font", async () => {
    // A variable-axis request (`axes: ['wdth']`) measured 73-90 KB combined
    // — over the ~60 KB budget — because next/font/local's typed API has
    // no way to pin a single width value; only two static instances can.
    const { archivoDisplay, archivoBody } = await import("./fonts.ts");
    expect(localFontCalls).toHaveLength(2);
    expect(archivoDisplay).toBeTruthy();
    expect(archivoBody).toBeTruthy();
  });

  it("wires the display instance to the pinned Expanded/700 file", async () => {
    await import("./fonts.ts");
    const displayCall = localFontCalls.find(
      (c) => c.variable === "--font-archivo-display"
    );
    expect(displayCall).toBeDefined();
    expect(displayCall?.src).toContain("archivo-expanded-700.woff2");
    expect(displayCall?.weight).toBe("700");
    // No `axes` option — a static single-instance file, not a variable range.
    expect(displayCall?.axes).toBeUndefined();
  });

  it("wires the body instance to the pinned Regular/400 file", async () => {
    await import("./fonts.ts");
    const bodyCall = localFontCalls.find(
      (c) => c.variable === "--font-archivo-body"
    );
    expect(bodyCall).toBeDefined();
    expect(bodyCall?.src).toContain("archivo-regular-400.woff2");
    expect(bodyCall?.weight).toBe("400");
    expect(bodyCall?.axes).toBeUndefined();
  });

  it("exposes one shared class combining both font variables", async () => {
    const { archivoDisplay, archivoBody, fontVariablesClassName } =
      await import("./fonts.ts");
    expect(fontVariablesClassName).toContain(archivoDisplay.variable);
    expect(fontVariablesClassName).toContain(archivoBody.variable);
  });
});

describe("app/globals.css font wiring", () => {
  // Source-content check: jsdom has no CSS engine, so this can't confirm
  // real browser rendering (task 9.2 does that with getComputedStyle).
  // This confirms the *source* no longer hardcodes system-ui and does
  // reference the shared module's variable names.
  const cssPath = fileURLToPath(
    new URL("../app/globals.css", import.meta.url)
  );
  const css = readFileSync(cssPath, "utf8");

  it("--font-sans no longer resolves to system-ui as its primary face", () => {
    const match = css.match(/--font-sans:\s*([^;]+);/);
    expect(match).not.toBeNull();
    const value = match?.[1] ?? "";
    expect(value.trim().startsWith("system-ui")).toBe(false);
    expect(value).toContain("var(--font-archivo-body)");
  });

  it("--font-display is defined and references the display font variable", () => {
    const match = css.match(/--font-display:\s*([^;]+);/);
    expect(match).not.toBeNull();
    expect(match?.[1]).toContain("var(--font-archivo-display)");
  });
});

describe("font module is shared, not duplicated per layout", () => {
  // Structural source check rather than a full render: both root layouts
  // import from lib/fonts and apply the same shared class to <html>. The
  // marketing layout has a heavy dependency tree (HeroLaptop, ChatWidget,
  // AnalyticsTracker); the admin layout's real render-based wiring test
  // below, plus task 9's real-browser verification, cover the rest.
  function readSource(relativePath: string): string {
    return readFileSync(
      fileURLToPath(new URL(relativePath, import.meta.url)),
      "utf8"
    );
  }

  it("the marketing layout imports the shared font module", () => {
    const source = readSource("../app/(marketing)/layout.tsx");
    expect(source).toMatch(/from ["']@\/lib\/fonts(\.ts)?["']/);
    expect(source).toContain("fontVariablesClassName");
  });

  it("the admin layout imports the same shared font module", () => {
    const source = readSource("../app/admin/layout.tsx");
    expect(source).toMatch(/from ["']@\/lib\/fonts(\.ts)?["']/);
    expect(source).toContain("fontVariablesClassName");
  });
});
