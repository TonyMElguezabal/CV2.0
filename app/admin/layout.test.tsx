// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AdminLayout from "./layout.tsx";

// next/font/local requires Next's own compiler transform; mocked here so
// the layout can be rendered under Vitest — see lib/fonts.test.ts.
vi.mock("next/font/local", () => ({
  default: (options: { variable: string }) => ({
    variable: `mock-var__${options.variable.replace(/^--/, "")}`,
    className: `mock-class__${options.variable.replace(/^--/, "")}`,
    style: { fontFamily: "mock" },
  }),
}));

afterEach(() => {
  cleanup();
});

describe("AdminLayout", () => {
  it("renders no public marketing chrome (hero, chat widget, or footer)", () => {
    render(
      <AdminLayout>
        <div>Admin content</div>
      </AdminLayout>,
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ask about jose/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("hero-laptop-layer"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    // The site header/grid overlay (editorial-frame) mount only in
    // app/(marketing)/layout.tsx — /admin has its own independent root
    // layout and must never inherit them.
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    // Same for the ambient sparkle layer (ambient-sparkle-layer) — a
    // continuously-running canvas loop has no reason to exist on an
    // owner-only internal dashboard.
    expect(
      screen.queryByTestId("ambient-sparkle-layer"),
    ).not.toBeInTheDocument();
  });

  it("applies the shared font-variable classes from lib/fonts to <html>, proving real end-to-end wiring", async () => {
    render(
      <AdminLayout>
        <div>Admin content</div>
      </AdminLayout>,
    );

    const { fontVariablesClassName } = await import("@/lib/fonts.ts");
    const htmlClasses = document.documentElement.className.split(/\s+/);
    for (const cls of fontVariablesClassName.split(/\s+/)) {
      expect(htmlClasses).toContain(cls);
    }
  });
});
