// @vitest-environment jsdom
import { render, cleanup, act, screen, waitFor } from "@testing-library/react";
import { RevealHeading } from "./RevealHeading";
import { MotionProvider } from "./MotionProvider";
import {
  revealHeadingGhostBlurClass,
  REVEAL_HEADING_STAGGER_SECONDS,
} from "./RevealHeadingStyles";
import { revealAnimatedClass, revealGhostClass } from "./RevealStyles";
import { pace } from "./motionPace";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function revealNow() {
  // useRevealOnScroll re-checks getBoundingClientRect itself rather than
  // trusting the observer entry alone (its fail-visible design) — the
  // default out-of-view mock from beforeEach must be swapped for an
  // in-view rect first, or the hook silently discards the intersection
  // and `revealed` never actually flips.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top: 100,
    bottom: 200,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON() {},
  } as DOMRect);
  const observer = FakeIntersectionObserver.instances.at(-1)!;
  act(() => {
    observer.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver
    );
  });
}

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

beforeEach(() => {
  setPrefersReducedMotion(false);
  FakeIntersectionObserver.instances = [];
  (
    globalThis as { IntersectionObserver?: unknown }
  ).IntersectionObserver = FakeIntersectionObserver;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top: 2000,
    bottom: 2100,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON() {},
  } as DOMRect);
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

function renderHeading(text = "Skills") {
  return render(
    <MotionProvider>
      <RevealHeading as="h2" text={text} className="fixture-heading" />
    </MotionProvider>
  );
}

describe("RevealHeading — cross-fade construction (Task Group 2)", () => {
  it("gives the ghost a static blur class, never an animated filter", () => {
    const { container } = renderHeading();
    const ghost = container.querySelector(`.${revealGhostClass}`) as HTMLElement;
    expect(ghost.className).toContain(revealHeadingGhostBlurClass);
    expect(ghost.style.filter).toBe("");
  });

  it("never sets filter as an inline (animated) style on any element, before or after reveal", () => {
    const { container } = renderHeading();
    const allSpans = container.querySelectorAll("span");
    for (const span of Array.from(allSpans)) {
      expect((span as HTMLElement).style.filter).toBe("");
    }

    revealNow();

    const allSpansAfter = container.querySelectorAll("span");
    for (const span of Array.from(allSpansAfter)) {
      expect((span as HTMLElement).style.filter).toBe("");
    }
  });

  it("only animates opacity and transform on the sharp/ghost/wrapper spans — never any other property", () => {
    const { container } = renderHeading();
    revealNow();
    const animatedSpans = container.querySelectorAll(
      `.${revealAnimatedClass}, .${revealGhostClass}`
    );
    expect(animatedSpans.length).toBeGreaterThan(0);
    for (const span of Array.from(animatedSpans)) {
      const style = (span as HTMLElement).style;
      const styledProps = Array.from(style).filter((prop) => style.getPropertyValue(prop));
      for (const prop of styledProps) {
        expect(["opacity", "transform", "transform-origin"]).toContain(prop);
      }
    }
  });

  it("applies an increasing per-character stagger delay", () => {
    // A stagger noticeably smaller than the shared entrance duration —
    // otherwise a short word would still be mid-stagger when its own
    // entrance should already have settled.
    expect(REVEAL_HEADING_STAGGER_SECONDS).toBeGreaterThan(0);
    expect(REVEAL_HEADING_STAGGER_SECONDS).toBeLessThan(pace.duration / 4);

    const { container } = renderHeading("Ski");
    const sharpSpans = Array.from(
      container.querySelectorAll(`.${revealAnimatedClass}`)
    );
    expect(sharpSpans).toHaveLength(3);
    // framer-motion doesn't expose `delay` as a readable DOM property, so
    // this is verified structurally instead: three distinct sharp copies
    // exist, one per character, which is the precondition for a
    // per-character stagger to exist at all (the actual delay values are
    // exercised via the browser verification step).
    expect(sharpSpans[0]?.textContent).toBe("S");
    expect(sharpSpans[1]?.textContent).toBe("k");
    expect(sharpSpans[2]?.textContent).toBe("i");
  });

  it("renders exactly one ghost and one sharp copy per character", () => {
    const { container } = renderHeading("Ski");
    expect(container.querySelectorAll(`.${revealGhostClass}`)).toHaveLength(3);
    expect(container.querySelectorAll(`.${revealAnimatedClass}`)).toHaveLength(3);
  });

  // Regression test for a real-browser defect found in Task Group 9
  // (design.md Decision 1's amendment, openspec/changes/scroll-reveal-motion):
  // nesting a ghost character as a DOM sibling inside its matching sharp
  // character's own small wrapper broke native double-click/triple-click
  // word-selection on the revealed heading, even though `select-none`
  // correctly kept the ghost out of the *selected text*. jsdom can't
  // exercise word-selection itself, but it can assert the DOM shape that
  // caused it never recurs: no ghost is ever a descendant of a sharp span's
  // own wrapper, and all ghosts live in one separate overlay instead.
  it("never nests a ghost character inside a sharp character's own wrapper — the two live in separate layers", () => {
    const { container } = renderHeading("Ski");
    const sharpSpans = container.querySelectorAll(`.${revealAnimatedClass}`);
    for (const sharp of Array.from(sharpSpans)) {
      expect(sharp.querySelector(`.${revealGhostClass}`)).toBeNull();
    }
    const ghostSpans = container.querySelectorAll(`.${revealGhostClass}`);
    for (const ghost of Array.from(ghostSpans)) {
      expect(ghost.querySelector(`.${revealAnimatedClass}`)).toBeNull();
      expect(ghost.closest(`.${revealAnimatedClass}`)).toBeNull();
    }
  });
});

describe("RevealHeading — accessible name (Task Group 3.1/3.3)", () => {
  it("exposes the full, unbroken text as the heading's accessible name via aria-label", () => {
    renderHeading("Skills");
    expect(
      screen.getByRole("heading", { name: "Skills" })
    ).toBeInTheDocument();
  });

  it("hides the entire per-character split behind one aria-hidden container, as a direct child of the heading", () => {
    const { container } = renderHeading("Skills");
    const heading = container.querySelector("h2")!;
    const directChild = heading.firstElementChild!;
    expect(directChild).toHaveAttribute("aria-hidden", "true");
    // Every character span lives inside this one aria-hidden container.
    expect(directChild.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("multi-word headings still resolve to their exact full text, spaces included", () => {
    renderHeading("Ask AI");
    expect(screen.getByRole("heading", { name: "Ask AI" })).toBeInTheDocument();
  });
});

describe("RevealHeading — selection safety (Task Group 3.2/3.4)", () => {
  it("excludes every ghost copy from text selection via user-select:none — the actual clipboard behavior is verified in a real browser (task 3.5), since jsdom does not implement user-select", () => {
    const { container } = renderHeading("Ski");
    const ghosts = container.querySelectorAll(`.${revealGhostClass}`);
    expect(ghosts).toHaveLength(3);
    for (const ghost of Array.from(ghosts)) {
      expect(ghost.className).toContain("select-none");
    }
  });

  it("leaves the sharp copy selectable (no select-none on it)", () => {
    const { container } = renderHeading("Ski");
    const sharpSpans = container.querySelectorAll(`.${revealAnimatedClass}`);
    for (const span of Array.from(sharpSpans)) {
      expect(span.className).not.toContain("select-none");
    }
  });
});

describe("RevealHeading — reduced motion (Task Group 5)", () => {
  it("renders no ghost layer at all under reduced motion — no cross-fade, opacity-only on the sharp copy", () => {
    setPrefersReducedMotion(true);
    const { container } = renderHeading("Ski");
    expect(container.querySelectorAll(`.${revealGhostClass}`)).toHaveLength(0);
    expect(container.querySelectorAll(`.${revealAnimatedClass}`)).toHaveLength(3);
  });

  it("never renders a y-offset under reduced motion", () => {
    setPrefersReducedMotion(true);
    const { container } = renderHeading("Ski");
    const wrappers = container.querySelectorAll(".relative.inline-block");
    for (const wrapper of Array.from(wrappers)) {
      expect((wrapper as HTMLElement).style.transform ?? "").not.toContain("px");
    }
  });

  it("still reaches its fully visible final state once revealed under reduced motion — sharp copies settle to opacity 1, still no y-offset", async () => {
    setPrefersReducedMotion(true);
    const { container } = renderHeading("Ski");
    revealNow();

    const sharpSpans = container.querySelectorAll(`.${revealAnimatedClass}`);
    expect(sharpSpans).toHaveLength(3);
    await waitFor(() => {
      for (const span of Array.from(sharpSpans)) {
        expect((span as HTMLElement).style.opacity).toBe("1");
      }
    }, { timeout: 2000 });

    const wrappers = container.querySelectorAll(".relative.inline-block");
    for (const wrapper of Array.from(wrappers)) {
      expect((wrapper as HTMLElement).style.transform ?? "").not.toContain("px");
    }
  }, 3000);
});
