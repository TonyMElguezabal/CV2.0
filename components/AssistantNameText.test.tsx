// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { AssistantNameText } from "./AssistantNameText";
import { toSpokenForm, ASSISTANT_NAME_STYLED, ASSISTANT_NAME_SPOKEN } from "./assistantName";

describe("toSpokenForm", () => {
  it("replaces the styled name with its pronounceable form", () => {
    expect(toSpokenForm("Hi! I'm Mar.IA, an assistant.")).toBe(
      "Hi! I'm Maria, an assistant.",
    );
  });

  it("leaves text with no occurrence of the name unchanged", () => {
    expect(toSpokenForm("Ask about Jose")).toBe("Ask about Jose");
  });

  it("replaces every occurrence, not just the first", () => {
    expect(toSpokenForm("Mar.IA here. Mar.IA again.")).toBe(
      "Maria here. Maria again.",
    );
  });
});

describe("AssistantNameText", () => {
  it("renders the styled name visibly and hides it from assistive technology", () => {
    render(<AssistantNameText text="Hi! I am Mar.IA" />);
    const styled = screen.getByText(ASSISTANT_NAME_STYLED);
    expect(styled).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes the pronounceable form to assistive technology only", () => {
    render(<AssistantNameText text="Hi! I am Mar.IA" />);
    const spoken = screen.getByText(ASSISTANT_NAME_SPOKEN);
    expect(spoken.className).toContain("sr-only");
  });

  it("renders surrounding text normally, outside the split", () => {
    render(<AssistantNameText text="Hi! I am Mar.IA, nice to meet you." />);
    expect(screen.getByText(/Hi! I am/)).toBeInTheDocument();
    expect(screen.getByText(/nice to meet you\./)).toBeInTheDocument();
  });

  it("renders text with no name occurrence unchanged, with no split markup", () => {
    render(<AssistantNameText text="Ask about Jose" />);
    expect(screen.getByText("Ask about Jose")).toBeInTheDocument();
    expect(screen.queryByText(ASSISTANT_NAME_SPOKEN)).not.toBeInTheDocument();
  });
});
