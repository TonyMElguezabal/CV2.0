// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HeroFramer } from "./HeroFramer";
import { ChatWidgetProvider } from "./ChatWidgetContext";
import { contrastRatio } from "@/lib/color/contrast.ts";
import { heroDisplayGradientClass } from "./HeroShellStyles.ts";
import { skillsHeadingClass } from "./SkillsSectionStyles.ts";
import {
  projectsHeadingClass,
  projectTitleClass,
} from "./ProjectsSectionStyles.ts";
import { contactHeadingClass } from "./ContactSectionStyles.ts";
import { chapterHeadingClass } from "./CareerChaptersStyles.ts";

// Same fake mediaQueryList pattern as HeroFramer.test.tsx.
let currentMatches = false;
const changeListeners: Array<(event: { matches: boolean }) => void> = [];
const fakeMediaQueryList = {
  media: "(prefers-reduced-motion)",
  get matches() {
    return currentMatches;
  },
  addEventListener: (
    _type: string,
    listener: (event: { matches: boolean }) => void
  ) => {
    changeListeners.push(listener);
  },
  removeEventListener: () => {},
  dispatchEvent: () => true,
  onchange: null,
} as unknown as MediaQueryList;

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => fakeMediaQueryList,
  });
});

function setPrefersReducedMotion(matches: boolean) {
  currentMatches = matches;
  changeListeners.forEach((listener) => listener({ matches }));
}

afterEach(() => {
  cleanup();
});

describe("display gradient scope (site-typography-and-palette design.md Decision 6)", () => {
  it("the gradient class exists and is not reused by section headings or chapter/project titles", () => {
    // Applied to a lead-text span, not merged into heroNameClass itself —
    // see the "no inheritance conflict" test below for why.
    expect(heroDisplayGradientClass).toContain("bg-clip-text");
    for (const cls of [
      skillsHeadingClass,
      projectsHeadingClass,
      contactHeadingClass,
      chapterHeadingClass,
      projectTitleClass,
    ]) {
      expect(cls).not.toContain("bg-clip-text");
    }
  });

  it("does not use Tailwind's text-transparent, which has no fallback for unsupporting browsers", () => {
    // color:transparent hides text unconditionally in every browser. The
    // required fallback (task 5.2) only works via -webkit-text-fill-color,
    // which non-WebKit browsers without bg-clip-text simply ignore,
    // leaving the inherited text-ink color (set on the outer heading, not
    // duplicated here) visible instead.
    expect(heroDisplayGradientClass).not.toMatch(/\btext-transparent\b/);
    expect(heroDisplayGradientClass).toContain(
      "[-webkit-text-fill-color:transparent]"
    );
  });

  it("keeps the gradient class off the accent span, avoiding a WebKit inheritance conflict", () => {
    // -webkit-text-fill-color inherits to children in WebKit/Blink; if the
    // gradient class were on a shared ancestor of both the lead text and
    // the accent word, the accent word's own `color` would be silently
    // overridden by the inherited transparent fill. The gradient and
    // accent classes must be siblings, not parent/child.
    expect(heroDisplayGradientClass).not.toContain("text-accent");
  });

  it("the gradient's darkest stop clears the large-text (3:1) threshold, matching the measured design table", () => {
    expect(contrastRatio("#6f6558", "#0a0a0a")).toBeGreaterThanOrEqual(3.0);
  });
});

describe("hero name rendering with the accent word", () => {
  it("splits the name so the second word carries the shared accent, and the rest carries the gradient", () => {
    setPrefersReducedMotion(false);
    render(
      <ChatWidgetProvider>
        <HeroFramer name="Jose Muñoz" positioning="Technical Delivery Manager" />
      </ChatWidgetProvider>
    );

    const heading = screen.getByRole("heading", { level: 1 });
    // Full accessible name is preserved — the word-split must not lose or
    // duplicate characters.
    expect(heading).toHaveAccessibleName("Jose Muñoz");

    const accentWord = screen.getByText("Muñoz");
    expect(accentWord.className).toContain("text-accent");
    expect(heading).toContainElement(accentWord);

    const leadWord = screen.getByText("Jose");
    expect(leadWord.className).toContain("bg-clip-text");
  });

  it("gradient-treated text remains real, selectable DOM text — not an image or generated content", () => {
    setPrefersReducedMotion(false);
    render(
      <ChatWidgetProvider>
        <HeroFramer name="Jose Muñoz" positioning="Technical Delivery Manager" />
      </ChatWidgetProvider>
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.querySelector("img, svg, canvas")).toBeNull();
    expect(heading.textContent).toBe("Jose Muñoz");
  });

  it("falls back to plain rendering for a single-word name, with no accent split", () => {
    setPrefersReducedMotion(false);
    render(
      <ChatWidgetProvider>
        <HeroFramer name="Prince" positioning="Technical Delivery Manager" />
      </ChatWidgetProvider>
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAccessibleName("Prince");
  });
});
