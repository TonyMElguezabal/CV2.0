// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MotionProvider } from "./MotionProvider";
import { ChatGreetingText } from "./ChatGreetingText";

const NBSP = " ";

function renderGreeting(text: string, prefersReducedMotion: boolean) {
  render(
    <MotionProvider>
      <ChatGreetingText text={text} prefersReducedMotion={prefersReducedMotion} />
    </MotionProvider>,
  );
}

function normalizeSpaces(text: string | null | undefined): string {
  return (text ?? "").split(NBSP).join(" ");
}

describe("ChatGreetingText", () => {
  it("keeps the full text present in the document immediately, not progressively inserted", () => {
    renderGreeting("Hi! I'm Mar.IA, nice to meet you.", false);
    // The animated (aria-hidden) layer must already contain every
    // character as a DOM node on first render — only opacity may still be
    // animating, never node insertion. Spaces render as NBSP in this
    // layer (RevealHeading's same fix for inline-block space collapsing —
    // harmless here since aria-hidden content is never announced), so
    // normalize before comparing.
    const hidden = document.querySelector('[aria-hidden="true"]');
    expect(normalizeSpaces(hidden?.textContent)).toBe(
      "Hi! I'm Mar.IA, nice to meet you.",
    );
  });

  it("exposes one complete, pronounceable string to assistive technology, not per-character markup", () => {
    renderGreeting("Hi! I'm Mar.IA, nice to meet you.", false);
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly?.textContent).toBe("Hi! I'm Maria, nice to meet you.");
    // The per-character layer must be hidden from assistive technology.
    const hidden = document.querySelector('[aria-hidden="true"]');
    expect(hidden).not.toBeNull();
  });

  it("renders every character as a separate node in the animated layer", () => {
    renderGreeting("Hi!", false);
    const hidden = document.querySelector('[aria-hidden="true"]');
    expect(hidden?.children.length).toBe(3);
  });

  it("renders in final, fully-opaque form immediately under reduced motion", () => {
    renderGreeting("Hi!", true);
    const hidden = document.querySelector('[aria-hidden="true"]');
    const firstChar = hidden?.children[0] as HTMLElement;
    expect(firstChar.style.opacity).toBe("1");
  });

  it("plain text with no assistant name passes through the spoken layer unchanged", () => {
    renderGreeting("Ask about Jose", false);
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly?.textContent).toBe("Ask about Jose");
  });

  it("is queryable by its rendered text via the accessible sr-only node", () => {
    renderGreeting("Hi! Test greeting.", false);
    expect(screen.getByText("Hi! Test greeting.")).toBeInTheDocument();
  });
});
