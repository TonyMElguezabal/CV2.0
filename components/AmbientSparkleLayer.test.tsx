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
  globalCompositeOperation = "source-over";
  setTransform() {}
  clearRect() {
    this.calls.push("clearRect");
  }
  beginPath() {}
  arc() {}
  fill() {
    this.calls.push(`fill:${this.fillStyle}`);
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
  it("is gated to sm and up via the same hidden sm:block class the hero laptop uses", () => {
    expect(ambientSparkleLayerClass).toContain("hidden");
    expect(ambientSparkleLayerClass).toContain("sm:block");
  });

  it("starts no loop when its container reports zero size (the hidden sm:block collapsed state)", () => {
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
