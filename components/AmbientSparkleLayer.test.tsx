// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AmbientSparkleLayer } from "./AmbientSparkleLayer";
import { HeroLaptop } from "./HeroLaptop";
import {
  ambientSparkleLayerClass,
  ambientSparkleCanvasClass,
} from "./AmbientSparkleLayerStyles";
import { heroLaptopAccentHex } from "./HeroShellStyles";
import { hexToRgb } from "@/lib/color/contrast.ts";
import { particleCountForArea } from "@/lib/particles/simulation.ts";
import { ArrivalSequenceProvider } from "./ArrivalSequenceProvider";

// Same fake mediaQueryList pattern as HeroLaptop.test.tsx/HeroFramer.test.tsx
// — useReducedMotion reads window.matchMedia lazily and re-reads only via
// the registered "change" listener.
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

class FakeCanvasContext {
  calls: string[] = [];
  fillStyle = "";
  strokeStyle = "";
  lineWidth = 1;
  private _globalCompositeOperation = "source-over";
  get globalCompositeOperation() {
    return this._globalCompositeOperation;
  }
  set globalCompositeOperation(value: string) {
    this._globalCompositeOperation = value;
    this.calls.push(`mode:${value}`);
  }
  setTransform() {}
  clearRect() {
    this.calls.push("clearRect");
  }
  arcCalls: Array<{ x: number; y: number; radius: number }> = [];
  beginPath() {}
  moveTo() {}
  lineTo() {}
  arc(x: number, y: number, radius: number) {
    this.arcCalls.push({ x, y, radius });
  }
  fill() {
    this.calls.push(`fill:${this.fillStyle}`);
  }
  stroke() {
    this.calls.push(`stroke:${this.strokeStyle}`);
  }
}
let fakeCtx: FakeCanvasContext;

let rafCallbacks: Map<number, FrameRequestCallback>;
let rafIdCounter: number;
function flushRaf(time = 16) {
  const callbacks = Array.from(rafCallbacks.values());
  rafCallbacks.clear();
  callbacks.forEach((cb) => cb(time));
}
function pendingRafCount() {
  return rafCallbacks.size;
}

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
function triggerIntersection(
  observer: FakeIntersectionObserver,
  isIntersecting: boolean
) {
  observer.callback(
    [{ isIntersecting } as IntersectionObserverEntry],
    observer as unknown as IntersectionObserver
  );
}

function setVisibilityState(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    writable: true,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  // Deliberately NOT clearing `changeListeners`: framer-motion's own
  // useReducedMotion attaches its change listener exactly once, ever
  // (motion-dom's `hasReducedMotionListener` module singleton) — wiping
  // this array after that first registration would permanently orphan it,
  // freezing every later test's reduced-motion state at whatever the very
  // first test observed. Matches HeroLaptop.test.tsx/HeroFramer.test.tsx's
  // own setup, neither of which clears it either.
  setPrefersReducedMotion(false);

  fakeCtx = new FakeCanvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => fakeCtx as unknown as CanvasRenderingContext2D
  );

  rafCallbacks = new Map();
  rafIdCounter = 1;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    const id = rafIdCounter++;
    rafCallbacks.set(id, cb);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    rafCallbacks.delete(id);
  });

  FakeIntersectionObserver.instances = [];
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver =
    FakeIntersectionObserver;

  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width: 1200,
    height: 800,
    top: 0,
    left: 0,
    right: 1200,
    bottom: 800,
    x: 0,
    y: 0,
    toJSON() {},
  } as DOMRect);

  setVisibilityState("visible");
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("AmbientSparkleLayer — structure (Task Group 1)", () => {
  it("is hidden from assistive technology", () => {
    const { getByTestId } = render(<AmbientSparkleLayer />);
    expect(getByTestId("ambient-sparkle-layer")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("is not focusable and contains no focusable elements", () => {
    const { container } = render(<AmbientSparkleLayer />);
    expect(
      container.querySelectorAll("a, button, input, [tabindex]")
    ).toHaveLength(0);
  });

  it("does not intercept pointer events", () => {
    expect(ambientSparkleLayerClass).toMatch(/\bpointer-events-none\b/);
  });

  it("contains no text nodes", () => {
    const { container } = render(<AmbientSparkleLayer />);
    expect(container.textContent).toBe("");
  });

  it("sits behind normal content via a negative z-index, matching HeroLaptop's convention", () => {
    expect(ambientSparkleLayerClass).toMatch(/-z-10\b/);
  });

  it("paints after (on top of) the hero laptop layer in DOM order", () => {
    const { container } = render(
      <>
        <HeroLaptop terminalLines={["$ whoami"]} />
        <AmbientSparkleLayer />
      </>
    );
    const laptopLayer = container.querySelector(
      '[data-testid="hero-laptop-layer"]'
    );
    const sparkleLayer = container.querySelector(
      '[data-testid="ambient-sparkle-layer"]'
    );
    expect(laptopLayer).not.toBeNull();
    expect(sparkleLayer).not.toBeNull();
    const position = laptopLayer!.compareDocumentPosition(sparkleLayer!);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("AmbientSparkleLayer — particle simulation (Task Group 2)", () => {
  it("renders exactly one canvas element, not N particle nodes", () => {
    const { container } = render(<AmbientSparkleLayer />);
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
  });

  it("uses additive glow compositing", () => {
    render(<AmbientSparkleLayer />);
    expect(fakeCtx.globalCompositeOperation).toBe("lighter");
  });

  it("derives its particle color from the shared accent token, not a second hard-coded value", () => {
    render(<AmbientSparkleLayer />);
    const [r, g, b] = hexToRgb(heroLaptopAccentHex);
    const fillCall = fakeCtx.calls.find((call) => call.startsWith("fill:"));
    expect(fillCall).toBeDefined();
    expect(fillCall).toContain(`rgba(${r}, ${g}, ${b},`);
  });

  it("sizes the canvas backing store by devicePixelRatio via ambientSparkleCanvasClass filling its container", () => {
    expect(ambientSparkleCanvasClass).toContain("h-full");
    expect(ambientSparkleCanvasClass).toContain("w-full");
  });
});

describe("AmbientSparkleLayer — constellation links, two-pass draw (ambient-constellation-links Task Group 6)", () => {
  it("draws links source-over, then nodes lighter, in that order", () => {
    render(<AmbientSparkleLayer />);
    const modeCalls = fakeCtx.calls.filter((c) => c.startsWith("mode:"));
    const sourceOverIndex = modeCalls.indexOf("mode:source-over");
    const lighterIndex = modeCalls.indexOf("mode:lighter");
    expect(sourceOverIndex).toBeGreaterThanOrEqual(0);
    expect(lighterIndex).toBeGreaterThanOrEqual(0);
    expect(sourceOverIndex).toBeLessThan(lighterIndex);
  });

  it("strokes every link before filling any node", () => {
    // All particles land at the same position (distance 0), which
    // guarantees at least one link exists regardless of the random draw —
    // avoids a flaky assertion that depends on particles happening to end
    // up close enough by chance.
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<AmbientSparkleLayer />);
    const strokeIndices = fakeCtx.calls
      .map((c, i) => (c.startsWith("stroke:") ? i : -1))
      .filter((i) => i >= 0);
    const firstFillIndex = fakeCtx.calls.findIndex((c) =>
      c.startsWith("fill:")
    );
    expect(strokeIndices.length).toBeGreaterThan(0);
    expect(firstFillIndex).toBeGreaterThanOrEqual(0);
    expect(Math.max(...strokeIndices)).toBeLessThan(firstFillIndex);
  });

  it("derives link stroke colour from the shared accent token, not a second hard-coded value", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<AmbientSparkleLayer />);
    const [r, g, b] = hexToRgb(heroLaptopAccentHex);
    const strokeCall = fakeCtx.calls.find((c) => c.startsWith("stroke:"));
    expect(strokeCall).toBeDefined();
    expect(strokeCall).toContain(`rgba(${r}, ${g}, ${b},`);
  });

  it("batches strokes by alpha bucket rather than issuing one stroke per link", () => {
    // Every particle at the same position -> every pair has the same
    // strength -> every link falls in the same alpha bucket. A batched
    // renderer issues exactly one stroke() for that bucket regardless of
    // how many individual links it contains; an unbatched one would issue
    // one stroke() per link (dozens, for ~40+ particles all mutually
    // linked).
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<AmbientSparkleLayer />);
    const strokeCalls = fakeCtx.calls.filter((c) => c.startsWith("stroke:"));
    expect(strokeCalls.length).toBeGreaterThan(0);
    expect(strokeCalls.length).toBeLessThanOrEqual(16);
  });

  it("restores lighter compositing for nodes after the link pass, so the existing additive-glow assertion still holds", () => {
    render(<AmbientSparkleLayer />);
    expect(fakeCtx.globalCompositeOperation).toBe("lighter");
  });
});

function setContainerSize(width: number, height: number) {
  (
    Element.prototype.getBoundingClientRect as ReturnType<typeof vi.fn>
  ).mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON() {},
  } as DOMRect);
}

describe("AmbientSparkleLayer — viewport-derived particle count and resize hysteresis (ambient-constellation-links Task Group 7)", () => {
  it("derives the initial particle count from the measured container area, not a fixed constant", () => {
    // beforeEach's default mock reports a 1200x800 container.
    render(<AmbientSparkleLayer />);
    const fillCount = fakeCtx.calls.filter((c) => c.startsWith("fill:")).length;
    expect(fillCount).toBe(particleCountForArea(1200, 800));
  });

  // arc() receives pixel-space coordinates (particle.x * width), which
  // legitimately change on resize even for an untouched particle, since the
  // canvas itself is a different size. Positions are compared in normalized
  // space (dividing back out the container size at each snapshot) so the
  // assertion is about the underlying particle, not the render scale.
  function normalized(
    calls: Array<{ x: number; y: number; radius: number }>,
    width: number,
    height: number
  ) {
    return calls.map((p) => ({ x: p.x / width, y: p.y / height, radius: p.radius }));
  }

  it("leaves particle positions untouched across a resize that changes the derived count by less than the hysteresis threshold", () => {
    render(<AmbientSparkleLayer />);
    const before = normalized(fakeCtx.arcCalls.slice(), 1200, 800);
    fakeCtx.arcCalls = [];

    // 1200x800 -> 1200x850: a small area change, well under the ~15%
    // hysteresis threshold on the derived particle count.
    setContainerSize(1200, 850);
    window.dispatchEvent(new Event("resize"));

    const after = normalized(fakeCtx.arcCalls, 1200, 850);
    expect(after.length).toBe(before.length);
    after.forEach((p, i) => {
      expect(p.x).toBeCloseTo(before[i]!.x, 10);
      expect(p.y).toBeCloseTo(before[i]!.y, 10);
      expect(p.radius).toBe(before[i]!.radius);
    });
  });

  it("adjusts the field incrementally — growth adds particles without disturbing the ones that already exist", () => {
    render(<AmbientSparkleLayer />);
    const before = normalized(fakeCtx.arcCalls.slice(), 1200, 800);
    fakeCtx.arcCalls = [];

    // 1200x800 -> 2400x1600: area quadruples, well past the hysteresis
    // threshold.
    setContainerSize(2400, 1600);
    window.dispatchEvent(new Event("resize"));

    const after = normalized(fakeCtx.arcCalls, 2400, 1600);
    expect(after.length).toBe(particleCountForArea(2400, 1600));
    expect(after.length).toBeGreaterThan(before.length);
    // The particles that existed before the resize keep their exact
    // positions — growth is additive, not a full regeneration.
    before.forEach((p, i) => {
      expect(after[i]!.x).toBeCloseTo(p.x, 10);
      expect(after[i]!.y).toBeCloseTo(p.y, 10);
      expect(after[i]!.radius).toBe(p.radius);
    });
  });

  it("adjusts the field incrementally — shrinkage removes particles without repositioning the ones that remain", () => {
    setContainerSize(2400, 1600);
    render(<AmbientSparkleLayer />);
    const before = normalized(fakeCtx.arcCalls.slice(), 2400, 1600);
    fakeCtx.arcCalls = [];

    setContainerSize(1200, 800); // area quarters
    window.dispatchEvent(new Event("resize"));

    const after = normalized(fakeCtx.arcCalls, 1200, 800);
    expect(after.length).toBe(particleCountForArea(1200, 800));
    expect(after.length).toBeLessThan(before.length);
    after.forEach((p, i) => {
      expect(p.x).toBeCloseTo(before[i]!.x, 10);
      expect(p.y).toBeCloseTo(before[i]!.y, 10);
      expect(p.radius).toBe(before[i]!.radius);
    });
  });
});

function dispatchPointerMove(
  clientX: number,
  clientY: number,
  pointerType: "mouse" | "touch" = "mouse"
) {
  window.dispatchEvent(
    new PointerEvent("pointermove", { clientX, clientY, pointerType })
  );
}

describe("AmbientSparkleLayer — pointer attraction (ambient-constellation-links Task Group 8)", () => {
  it("registers a passive pointermove listener on window, never on the layer itself", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    render(<AmbientSparkleLayer />);
    const call = addSpy.mock.calls.find(([type]) => type === "pointermove");
    expect(call).toBeDefined();
    expect(call![2]).toMatchObject({ passive: true });
    // The layer keeps pointer-events-none regardless (existing assertion,
    // re-affirmed here since this whole describe block is about how the
    // layer tracks the pointer without ever receiving its events directly).
    expect(ambientSparkleLayerClass).toMatch(/\bpointer-events-none\b/);
  });

  it("ignores non-mouse pointer types — a touch drag must not move the field", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // stationary particle at (0.5, 0.5), vx=vy=0
    render(<AmbientSparkleLayer />);
    flushRaf(0); // establish the loop's time baseline (delta=0, a no-op)

    dispatchPointerMove(700, 400, "touch"); // 100px right of the particle's (600, 400)
    fakeCtx.arcCalls = [];
    flushRaf(1000); // 1s later — plenty of time for attraction to show, if active

    expect(fakeCtx.arcCalls[0]!.x).toBeCloseTo(600, 5);
    expect(fakeCtx.arcCalls[0]!.y).toBeCloseTo(400, 5);
  });

  it("attracts toward a hovering mouse pointer, and releases on document pointerleave", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<AmbientSparkleLayer />);
    flushRaf(0);

    dispatchPointerMove(700, 400, "mouse");
    fakeCtx.arcCalls = [];
    flushRaf(1000);
    const attractedX = fakeCtx.arcCalls[0]!.x;
    expect(attractedX).toBeGreaterThan(600); // pulled toward the pointer

    document.dispatchEvent(new PointerEvent("pointerleave"));
    fakeCtx.arcCalls = [];
    flushRaf(2000);
    const releasedX = fakeCtx.arcCalls[0]!.x;
    expect(releasedX).toBeLessThan(attractedX); // easing back, not held in place
    expect(releasedX).toBeCloseTo(600, 0); // nearly fully released after 1s more
  });

  it("also releases on window blur", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<AmbientSparkleLayer />);
    flushRaf(0);

    dispatchPointerMove(700, 400, "mouse");
    fakeCtx.arcCalls = [];
    flushRaf(1000);
    const attractedX = fakeCtx.arcCalls[0]!.x;

    window.dispatchEvent(new Event("blur"));
    fakeCtx.arcCalls = [];
    flushRaf(2000);
    expect(fakeCtx.arcCalls[0]!.x).toBeLessThan(attractedX);
  });

  it("registers no pointer listener at all under prefers-reduced-motion: reduce", () => {
    setPrefersReducedMotion(true);
    const windowAddSpy = vi.spyOn(window, "addEventListener");
    const docAddSpy = vi.spyOn(document, "addEventListener");
    render(<AmbientSparkleLayer />);

    expect(
      windowAddSpy.mock.calls.filter(([type]) => type === "pointermove")
    ).toHaveLength(0);
    expect(
      windowAddSpy.mock.calls.filter(([type]) => type === "blur")
    ).toHaveLength(0);
    expect(
      docAddSpy.mock.calls.filter(([type]) => type === "pointerleave")
    ).toHaveLength(0);
  });

  it("includes links in the reduced-motion static frame, not particles alone", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // guarantees at least one link
    setPrefersReducedMotion(true);
    render(<AmbientSparkleLayer />);
    expect(fakeCtx.calls.some((c) => c.startsWith("stroke:"))).toBe(true);
    expect(fakeCtx.calls.some((c) => c.startsWith("fill:"))).toBe(true);
  });
});

describe("AmbientSparkleLayer — reduced motion (Task Group 3)", () => {
  it("draws exactly one static frame and never schedules an animation loop", () => {
    setPrefersReducedMotion(true);
    render(<AmbientSparkleLayer />);
    expect(fakeCtx.calls.filter((c) => c === "clearRect")).toHaveLength(1);
    expect(pendingRafCount()).toBe(0);
  });

  it("still renders particles (a still field), not nothing — a compliant empty canvas would look identical to a failed one", () => {
    setPrefersReducedMotion(true);
    render(<AmbientSparkleLayer />);
    expect(fakeCtx.calls.some((c) => c.startsWith("fill:"))).toBe(true);
  });

  it("does not start a loop even after becoming visible/in-view again", () => {
    setPrefersReducedMotion(true);
    render(<AmbientSparkleLayer />);
    setVisibilityState("hidden");
    setVisibilityState("visible");
    const observer = FakeIntersectionObserver.instances.at(-1)!;
    triggerIntersection(observer, false);
    triggerIntersection(observer, true);
    expect(pendingRafCount()).toBe(0);
  });

  it("runs a real animation loop when motion is not reduced (control case)", () => {
    setPrefersReducedMotion(false);
    render(<AmbientSparkleLayer />);
    expect(pendingRafCount()).toBe(1);
  });
});

describe("AmbientSparkleLayer — lifecycle (Task Group 4)", () => {
  it("stops the loop when the document becomes hidden", () => {
    render(<AmbientSparkleLayer />);
    expect(pendingRafCount()).toBe(1);
    flushRaf();
    expect(pendingRafCount()).toBe(1);
    setVisibilityState("hidden");
    flushRaf();
    expect(pendingRafCount()).toBe(0);
  });

  it("resumes the loop when the document becomes visible again", () => {
    render(<AmbientSparkleLayer />);
    flushRaf();
    setVisibilityState("hidden");
    flushRaf();
    expect(pendingRafCount()).toBe(0);
    setVisibilityState("visible");
    expect(pendingRafCount()).toBe(1);
  });

  it("stops the loop when the layer scrolls out of view", () => {
    render(<AmbientSparkleLayer />);
    flushRaf();
    const observer = FakeIntersectionObserver.instances.at(-1)!;
    triggerIntersection(observer, false);
    flushRaf();
    expect(pendingRafCount()).toBe(0);
  });

  it("resumes the loop when the layer re-enters the viewport", () => {
    render(<AmbientSparkleLayer />);
    flushRaf();
    const observer = FakeIntersectionObserver.instances.at(-1)!;
    triggerIntersection(observer, false);
    flushRaf();
    expect(pendingRafCount()).toBe(0);
    triggerIntersection(observer, true);
    expect(pendingRafCount()).toBe(1);
  });

  it("cancels the animation frame and removes every registered listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const docRemoveEventListenerSpy = vi.spyOn(
      document,
      "removeEventListener"
    );
    const { unmount } = render(<AmbientSparkleLayer />);
    expect(pendingRafCount()).toBe(1);
    const observer = FakeIntersectionObserver.instances.at(-1)!;
    const disconnectSpy = vi.spyOn(observer, "disconnect");

    unmount();

    expect(pendingRafCount()).toBe(0);
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
    expect(docRemoveEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );
    expect(disconnectSpy).toHaveBeenCalled();

    // ambient-constellation-links Task Group 8: the pointer-tracking
    // listeners added alongside pointer attraction must be released too —
    // the "removes every listener it registered" guarantee stays literally
    // true, not just true for the listeners that predate this change.
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "blur",
      expect.any(Function)
    );
    expect(docRemoveEventListenerSpy).toHaveBeenCalledWith(
      "pointerleave",
      expect.any(Function)
    );
  });

  it("throttled is not the same as stopped: being merely unscheduled after a flush still counts as a live loop until an explicit stop condition fires", () => {
    render(<AmbientSparkleLayer />);
    // A live, non-stopped loop always re-schedules itself on every flush.
    expect(pendingRafCount()).toBe(1);
    flushRaf();
    expect(pendingRafCount()).toBe(1);
    flushRaf();
    expect(pendingRafCount()).toBe(1);
  });
});

describe("AmbientSparkleLayer — viewport gating (Task Group 5)", () => {
  it("renders at every viewport width, not gated to sm and up (mobile-motion-parity)", () => {
    expect(ambientSparkleLayerClass).not.toContain("hidden");
    expect(ambientSparkleLayerClass).not.toContain("sm:block");
    expect(ambientSparkleLayerClass).toContain("block");
  });

  // Not a gate test despite living in this describe block — this is a
  // robustness guard against a zero-size container that stays correct
  // and valuable regardless of *why* the container might measure zero
  // (e.g. mid-mount, or a future layout change), even though the
  // `hidden sm:block` collapse that originally motivated writing it no
  // longer exists (mobile-motion-parity design.md Decision 4).
  it("starts no loop when its container reports zero size", () => {
    (Element.prototype.getBoundingClientRect as ReturnType<typeof vi.fn>).mockReturnValue({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect);
    render(<AmbientSparkleLayer />);
    expect(pendingRafCount()).toBe(0);
  });
});

// The layer's own mount entrance is owned by the page-load arrival
// sequence (JOS-112), not by AmbientSparkleLayer itself. Every test above
// this point renders without an ArrivalSequenceProvider ancestor, so the
// hook falls back to its fail-visible context default (already visible, no
// transition) — the new entrance is a no-op there, which is why none of
// those existing assertions needed to change.
describe("AmbientSparkleLayer — arrival-sequence entrance", () => {
  beforeEach(() => {
    // The file-wide beforeEach above replaces requestAnimationFrame with a
    // queue that never auto-fires, so this file's particle-loop tests can
    // control frame timing by hand — but that same mock also captures
    // framer-motion's own internal animation driver, which needs real
    // frame timing to ever resolve. Restored here so this describe
    // block's opacity-transition assertions can actually settle; the
    // canvas-context/IntersectionObserver/getBoundingClientRect mocks stay
    // in place, since the component's own effect still needs them.
    (
      window.requestAnimationFrame as unknown as ReturnType<typeof vi.fn>
    ).mockRestore();
    (
      window.cancelAnimationFrame as unknown as ReturnType<typeof vi.fn>
    ).mockRestore();
  });

  afterEach(() => {
    cleanup();
  });

  it("starts hidden (opacity 0) in the raw SSR HTML, before any effect can run", () => {
    const html = renderToStaticMarkup(
      <ArrivalSequenceProvider>
        <AmbientSparkleLayer />
      </ArrivalSequenceProvider>
    );
    expect(html).toContain("ambient-sparkle-layer");
    expect(html).toContain("opacity:0");
  });

  it("wires its entrance to the shared arrival-sequence hook, opacity only", () => {
    // This file's own file-wide beforeEach replaces requestAnimationFrame
    // with a manually-flushed queue (for the particle-loop tests below),
    // and framer-motion's animation engine captures its own frame-loop
    // reference the first time any `m.*` component mounts in this file —
    // once poisoned by an earlier test's mock, a later per-test
    // `mockRestore()` does not un-poison that already-captured reference,
    // so a live DOM settle assertion (proven to work in
    // HeroLaptop.test.tsx, which has no such file-wide rAF mock) cannot be
    // made to reliably resolve here. Verified at the source level instead
    // — the real settling behavior is exercised in HeroLaptop.test.tsx and
    // ArrivalSequenceProvider.test.tsx via the same shared hook.
    const source = readFileSync(
      join(process.cwd(), "components", "AmbientSparkleLayer.tsx"),
      "utf8"
    );
    expect(source).toMatch(
      /useArrivalStep\(\s*ARRIVAL_STEP_DELAYS\.ambient,\s*false\s*\)/
    );
  });

  it("carries the shared no-JS override marker class", () => {
    render(
      <ArrivalSequenceProvider>
        <AmbientSparkleLayer />
      </ArrivalSequenceProvider>
    );
    expect(screen.getByTestId("ambient-sparkle-layer").className).toMatch(
      /\barrival-animated\b/
    );
  });
});
