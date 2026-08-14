// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

  it("also drops the positioning text's y-offset under prefers-reduced-motion, not just the heading's", () => {
    setPrefersReducedMotion(true);
    render(
      <ChatWidgetProvider>
        <HeroFramer
          name="Jose Muñoz"
          positioning="Technical Delivery Manager"
        />
      </ChatWidgetProvider>
    );

    const positioning = screen.getByText("Technical Delivery Manager");
    expect(positioning.style.transform).not.toContain("px");
    expect(positioning.style.opacity).toBe("0");
  });

  it("derives its entrance timing from the shared motion pace token, not its own hardcoded duration/easing", () => {
    // Source-content check: framer-motion's initial/animate-driven
    // transitions aren't real CSS `transition-duration`/`transition-timing-
    // function` properties inspectable post-render in jsdom (render()
    // captures the synchronous *initial* inline style, not the animated
    // timing config) — the same reason HeroLaptop's lighting-rig tests
    // check source/computed style rather than trying to observe animation
    // playback. This confirms the source wires both entrances to the one
    // shared token instead of picking its own numbers.
    const source = readFileSync(
      join(process.cwd(), "components", "HeroFramer.tsx"),
      "utf8"
    );
    expect(source).toMatch(/from ["']\.\/motionPace(\.ts)?["']/);
    expect(source).toContain("pace.duration");
    expect(source).toContain("pace.ease");
    // The old per-element hardcoded values must be gone.
    expect(source).not.toMatch(/duration:\s*0\.6/);
    expect(source).not.toMatch(/duration:\s*0\.5/);
    expect(source).not.toContain('"easeOut"');
  });

  it("anchors the name/positioning copy to a left column on sm+ viewports, off the laptop's centered axis", () => {
    setPrefersReducedMotion(false);
    render(
      <ChatWidgetProvider>
        <HeroFramer
          name="Jose Muñoz"
          positioning="Technical Delivery Manager"
        />
      </ChatWidgetProvider>
    );

    const wrapper = screen.getByTestId("hero-wrapper");
    const wrapperClasses = wrapper.className.split(/\s+/);
    // hero-signature-motion "Copy and laptop do not share one axis" — the
    // laptop layer docks to a corner (items-end justify-end); the copy
    // anchors to a left column instead of staying centered.
    expect(wrapperClasses).toEqual(
      expect.arrayContaining(["sm:items-start", "sm:text-left"])
    );
  });
});
