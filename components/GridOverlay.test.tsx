// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { GridOverlay } from "./GridOverlay";
import { gridOverlayClass } from "./GridOverlayStyles";

describe("GridOverlay (decorative only — design.md Decision 6)", () => {
  it("is hidden from assistive technology", () => {
    const { container } = render(<GridOverlay />);
    expect(container.firstElementChild).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("is not focusable and contains no focusable elements", () => {
    const { container } = render(<GridOverlay />);
    expect(
      container.querySelectorAll("a, button, input, [tabindex]")
    ).toHaveLength(0);
  });

  it("does not intercept pointer events", () => {
    expect(gridOverlayClass).toMatch(/\bpointer-events-none\b/);
  });

  it("contains no text nodes — --hair fails normal-text contrast, so a text node here would be non-compliant by construction", () => {
    const { container } = render(<GridOverlay />);
    expect(container.textContent).toBe("");
  });
});
