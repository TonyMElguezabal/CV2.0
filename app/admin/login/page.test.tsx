// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AdminLoginPage from "./page.tsx";

afterEach(() => {
  cleanup();
});

describe("AdminLoginPage", () => {
  it("renders a native form posting to /admin/login/submit with username and password fields", () => {
    render(<AdminLoginPage />);

    const form = screen.getByRole("button", { name: /sign in/i }).closest("form");
    expect(form).toHaveAttribute("method", "POST");
    expect(form).toHaveAttribute("action", "/admin/login/submit");
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password");
  });
});
