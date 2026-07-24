// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Terminal } from "./Terminal";

afterEach(() => {
  cleanup();
});

describe("Terminal", () => {
  it("renders each content-sourced line", () => {
    render(<Terminal lines={["$ whoami", "jose_munoz"]} />);

    expect(screen.getByText("$ whoami")).toBeInTheDocument();
    expect(screen.getByText("jose_munoz")).toBeInTheDocument();
  });
});
