// @vitest-environment jsdom
import { render, cleanup, act } from "@testing-library/react";
import { useRevealOnScroll } from "./useRevealOnScroll";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];
  disconnected = false;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function fireIntersecting(
  observer: FakeIntersectionObserver,
  isIntersecting: boolean
) {
  act(() => {
    observer.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver
    );
  });
}

function fireScroll() {
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

function mockRect(overrides: Partial<DOMRect>) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON() {},
    ...overrides,
  } as DOMRect);
}

function Probe({ onRevealed }: { onRevealed: (revealed: boolean) => void }) {
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>();
  onRevealed(revealed);
  return <div ref={ref} data-testid="probe" />;
}

let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  (
    globalThis as { IntersectionObserver?: unknown }
  ).IntersectionObserver = FakeIntersectionObserver;
  removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  // Out-of-view by default; individual tests override when they need
  // in-view geometry.
  mockRect({ top: 2000, bottom: 2100 });
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("useRevealOnScroll — fail-visible foundation", () => {
  it("starts as not revealed when the element is out of view", () => {
    const states: boolean[] = [];
    render(<Probe onRevealed={(r) => states.push(r)} />);
    expect(states[0]).toBe(false);
  });

  it("reveals when the IntersectionObserver reports intersection", () => {
    const states: boolean[] = [];
    render(<Probe onRevealed={(r) => states.push(r)} />);
    const observer = FakeIntersectionObserver.instances.at(-1)!;

    mockRect({ top: 100, bottom: 200 });
    fireIntersecting(observer, true);

    expect(states.at(-1)).toBe(true);
  });

  it("reveals via the scroll-listener fallback even if the observer never fires — mirrors CareerTimeline's own redundant pattern", () => {
    const states: boolean[] = [];
    render(<Probe onRevealed={(r) => states.push(r)} />);

    // Element has since scrolled into view, but the observer callback is
    // never invoked (simulating a gap in observer behavior) — only the
    // scroll listener runs.
    mockRect({ top: 100, bottom: 200 });
    fireScroll();

    expect(states.at(-1)).toBe(true);
  });

  it("reveals immediately at mount if the element is already in view — the observer's own initial callback covers this in a real browser, and the scroll-listener's own immediate call covers it here", () => {
    mockRect({ top: 100, bottom: 200 });
    const states: boolean[] = [];
    render(<Probe onRevealed={(r) => states.push(r)} />);
    expect(states.at(-1)).toBe(true);
  });

  it("fails visible when IntersectionObserver is unsupported, rather than staying gated on a missing capability", () => {
    // Deliberately simulating an unsupported browser.
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    const states: boolean[] = [];
    render(<Probe onRevealed={(r) => states.push(r)} />);
    expect(states.at(-1)).toBe(true);
  });

  it("is idempotent: once revealed, further scroll events do not un-reveal it", () => {
    const states: boolean[] = [];
    render(<Probe onRevealed={(r) => states.push(r)} />);
    const observer = FakeIntersectionObserver.instances.at(-1)!;

    mockRect({ top: 100, bottom: 200 });
    fireIntersecting(observer, true);
    expect(states.at(-1)).toBe(true);

    mockRect({ top: 2000, bottom: 2100 });
    fireScroll();
    expect(states.at(-1)).toBe(true);
  });

  it("disconnects the observer and removes the scroll listener once revealed, and again on unmount", () => {
    const states: boolean[] = [];
    const { unmount } = render(<Probe onRevealed={(r) => states.push(r)} />);
    const observer = FakeIntersectionObserver.instances.at(-1)!;

    mockRect({ top: 100, bottom: 200 });
    fireIntersecting(observer, true);
    expect(observer.disconnected).toBe(true);
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );

    unmount();
    // Cleanup runs again on unmount (disconnect/removeEventListener are
    // idempotent no-ops the second time) — no error should be thrown.
  });
});
