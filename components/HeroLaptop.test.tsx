// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HeroLaptop } from "./HeroLaptop";

// Same fake mediaQueryList pattern as HeroFramer.test.tsx: useReducedMotion
// reads window.matchMedia lazily and re-reads only via the registered
// "change" listener.
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

const terminalLines = ["$ whoami", "jose_munoz"];

describe("HeroLaptop", () => {
  it("renders closed and angled toward the lower-left/tilted-down as a background layer under default motion settings", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const layer = screen.getByTestId("hero-laptop-layer");
    expect(layer).toHaveAttribute("aria-hidden", "true");

    const scene = screen.getByTestId("hero-laptop-scene");
    expect(scene.style.transform).toContain("deg");
    expect(scene.style.transform).not.toBe("rotateY(0deg) rotateZ(0deg)");

    const lid = screen.getByTestId("hero-laptop-lid");
    expect(lid.style.transform).toContain("deg");
    expect(lid.style.transform).not.toContain("rotateX(0deg)");
  });

  it("keeps the terminal screen hidden (opacity 0) at the start of the scroll range under default motion settings", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const screenEl = screen.getByTestId("hero-laptop-screen");
    expect(screenEl.style.opacity).toBe("0");
  });

  it("renders the terminal's content-sourced lines in the DOM", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    expect(screen.getByText("$ whoami")).toBeInTheDocument();
    expect(screen.getByText("jose_munoz")).toBeInTheDocument();
  });

  it("renders static, fully open, front-facing, with the terminal visible under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const scene = screen.getByTestId("hero-laptop-scene");
    expect(scene.style.transform).not.toContain("-35deg");
    expect(scene.style.transform).not.toContain("-8deg");

    const lid = screen.getByTestId("hero-laptop-lid");
    expect(lid.style.transform).not.toContain("-100deg");

    const screenEl = screen.getByTestId("hero-laptop-screen");
    expect(screenEl.style.opacity).toBe("1");
  });

  it("is simplified away below the sm breakpoint (hidden on small viewports, shown at sm and up)", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const layer = screen.getByTestId("hero-laptop-layer");
    expect(layer.className.split(/\s+/)).toEqual(
      expect.arrayContaining(["hidden", "sm:flex"])
    );
  });
});

// The no-JS static override (a <noscript><style> block forcing the open/
// front-facing/terminal-visible state) is not unit-tested: jsdom does not
// expose <noscript> children even when the DOM is built via createElement
// rather than HTML parsing — the same reason HeroFramer.tsx's own noscript
// override has no jsdom test. Verified visually/manually (task 5.6).
