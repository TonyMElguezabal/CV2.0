// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HeroFramer } from "./HeroFramer";
import { ChatWidgetProvider } from "./ChatWidgetContext";
import { ArrivalSequenceProvider } from "./ArrivalSequenceProvider";

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

// The hero's entrance is owned by the page-load arrival sequence (JOS-112),
// not by HeroFramer itself — every render here needs a real
// ArrivalSequenceProvider ancestor to exercise the actual timed entrance;
// without one, useArrivalStep falls back to its fail-visible context
// default (already arrived, no transition), which is a real and correct
// behavior but not what these tests are about.
function renderHero() {
  return render(
    <ChatWidgetProvider>
      <ArrivalSequenceProvider>
        <HeroFramer
          name="Jose Muñoz"
          positioning="Technical Delivery Manager"
        />
      </ArrivalSequenceProvider>
    </ChatWidgetProvider>
  );
}

afterEach(() => {
  window.location.hash = "";
  cleanup();
});

describe("HeroFramer", () => {
  it("renders the real name and positioning text under default motion settings", () => {
    setPrefersReducedMotion(false);
    renderHero();

    expect(
      screen.getByRole("heading", { level: 1, name: "Jose Muñoz" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Technical Delivery Manager")
    ).toBeInTheDocument();
  });

  it("applies a y-offset to the entrance animation under default motion settings", () => {
    setPrefersReducedMotion(false);
    renderHero();

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.style.transform).toContain("24px");
  });

  it("renders the real name and positioning text under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    renderHero();

    expect(
      screen.getByRole("heading", { level: 1, name: "Jose Muñoz" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Technical Delivery Manager")
    ).toBeInTheDocument();
  });

  it("uses an opacity-only fade with no y-offset under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    const { container } = renderHero();

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
    renderHero();

    const positioning = screen.getByText("Technical Delivery Manager");
    expect(positioning.style.transform).not.toContain("px");
    expect(positioning.style.opacity).toBe("0");
  });

  it("skips the animation and renders directly in final state on a deep-linked load", async () => {
    setPrefersReducedMotion(false);
    const el = document.createElement("div");
    el.id = "contact";
    document.body.appendChild(el);
    window.location.hash = "#contact";

    renderHero();

    // The skip branch still routes through framer-motion's animate-
    // transition engine (a duration:0 transition, not a synchronous style
    // write like the SSR-baked `initial` prop is) — it commits on the next
    // animation frame rather than within the same synchronous act() flush
    // that ran the mount effect. Same characteristic already documented
    // for post-reveal settled-state assertions elsewhere in this codebase
    // (SectionReveal.test.tsx, RevealHeading.test.tsx).
    const heading = screen.getByRole("heading", { level: 1 });
    await waitFor(() => expect(heading.style.opacity).toBe("1"));
    expect(heading.style.transform).not.toContain("px");

    el.remove();
  });

  it("its entrance timing derives from the shared motion pace token, not an independently chosen one", () => {
    // Source-content check: framer-motion's initial/animate-driven
    // transitions aren't real CSS `transition-duration`/`transition-timing-
    // function` properties inspectable post-render in jsdom (render()
    // captures the synchronous *initial* inline style, not the animated
    // timing config) — the same reason HeroLaptop's lighting-rig tests
    // check source/computed style rather than trying to observe animation
    // playback. HeroFramer no longer references `pace` directly — its
    // entrance timing is owned by the shared arrival sequence (JOS-112) —
    // so this now confirms the delegation itself, and that the token flows
    // through to the real source.
    const heroSource = readFileSync(
      join(process.cwd(), "components", "HeroFramer.tsx"),
      "utf8"
    );
    expect(heroSource).toContain("useArrivalStep");
    expect(heroSource).toContain("ARRIVAL_STEP_DELAYS");
    expect(heroSource).not.toMatch(/duration:\s*0\.6/);
    expect(heroSource).not.toMatch(/duration:\s*0\.5/);
    expect(heroSource).not.toContain('"easeOut"');

    const providerSource = readFileSync(
      join(process.cwd(), "components", "ArrivalSequenceProvider.tsx"),
      "utf8"
    );
    expect(providerSource).toMatch(/from ["']\.\/motionPace(\.ts)?["']/);
    expect(providerSource).toContain("pace.duration");
    expect(providerSource).toContain("pace.ease");
  });

  it("anchors the name/positioning copy to a left column at every viewport width, off the laptop's centered axis", () => {
    setPrefersReducedMotion(false);
    renderHero();

    const wrapper = screen.getByTestId("hero-wrapper");
    const wrapperClasses = wrapper.className.split(/\s+/);
    // hero-signature-motion "Copy and laptop do not share one axis" now
    // applies at every width (mobile-motion-parity) — the laptop layer
    // docks to a corner (items-end justify-end) at every width too, so
    // the copy's off-center anchor is unconditional, not sm+-scoped.
    expect(wrapperClasses).toContain("items-start");
    expect(wrapperClasses).toContain("text-left");
    expect(wrapperClasses).not.toContain("sm:items-start");
    expect(wrapperClasses).not.toContain("sm:text-left");
    // The generous side padding stays breakpoint-scoped (design.md
    // Decision 1) — alignment and padding are separable, and it is the
    // padding that would cramp a narrow column, not the alignment.
    expect(wrapperClasses).toContain("sm:pl-16");
    expect(wrapperClasses).toContain("sm:pr-16");
  });
});
