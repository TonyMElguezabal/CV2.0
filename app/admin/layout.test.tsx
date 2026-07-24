// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AdminLayout from "./layout.tsx";

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
  });
});
