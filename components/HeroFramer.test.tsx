// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HeroFramer } from "./HeroFramer";
import { ChatWidgetProvider } from "./ChatWidgetContext";

// Framer Motion's `useReducedMotion` reads `window.matchMedia` once (lazily,
// on first use in the process) and re-reads it only via the mediaQueryList's
// "change" listener it registers — it does not call `matchMedia` again. This
// fake mediaQueryList lets tests flip the reported preference by invoking
// that same registered listener, which is how a real browser would notify
// of an OS-level preference change.
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

describe("HeroFramer", () => {
  it("renders the real name and positioning text under default motion settings", () => {
    setPrefersReducedMotion(false);
    render(
      <ChatWidgetProvider>
        <HeroFramer
          name="Jose Muñoz"
          positioning="Technical Delivery Manager"
        />
      </ChatWidgetProvider>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Jose Muñoz" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Technical Delivery Manager")
    ).toBeInTheDocument();
  });

  it("applies a y-offset to the entrance animation under default motion settings", () => {
    setPrefersReducedMotion(false);
    render(
      <ChatWidgetProvider>
        <HeroFramer
          name="Jose Muñoz"
          positioning="Technical Delivery Manager"
        />
      </ChatWidgetProvider>
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.style.transform).toContain("24px");
  });

  it("renders the real name and positioning text under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    render(
      <ChatWidgetProvider>
        <HeroFramer
          name="Jose Muñoz"
          positioning="Technical Delivery Manager"
        />
      </ChatWidgetProvider>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Jose Muñoz" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Technical Delivery Manager")
    ).toBeInTheDocument();
  });

  it("uses an opacity-only fade with no y-offset under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    const { container } = render(
      <ChatWidgetProvider>
        <HeroFramer
          name="Jose Muñoz"
          positioning="Technical Delivery Manager"
        />
      </ChatWidgetProvider>
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.style.transform).not.toContain("px");
    expect(heading.style.opacity).toBe("0");

    const wrapper = container.querySelector(
      "[style]"
    ) as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.transform ?? "").not.toContain("px");
  });
});
