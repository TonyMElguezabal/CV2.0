// @vitest-environment jsdom
import { render, cleanup, act, waitFor } from "@testing-library/react";
import { SectionReveal } from "./SectionReveal";
import { MotionProvider } from "./MotionProvider";
import { revealAnimatedClass } from "./RevealStyles";
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

function fireIntersecting(observer: FakeIntersectionObserver) {
  act(() => {
    observer.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver
    );
  });
}

// Same fake mediaQueryList pattern as HeroFramer.test.tsx/HeroLaptop.test.tsx.
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
  // Out of view by default, so tests control reveal timing explicitly.
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

function renderReveal(children = "Fixture content") {
  return render(
    <MotionProvider>
      <SectionReveal>
        <p data-testid="content">{children}</p>
      </SectionReveal>
    </MotionProvider>
  );
}

describe("SectionReveal", () => {
  it("renders as a plain div by default", () => {
    const { container } = renderReveal();
    expect(container.querySelector(`.${revealAnimatedClass}`)?.tagName).toBe(
      "DIV"
    );
  });

  it("renders as the requested tag via the polymorphic `as` prop — no extra wrapper element, so sibling-position CSS (first:/last:) on the revealed element itself keeps working", () => {
    const { container } = render(
      <MotionProvider>
        <SectionReveal as="details">
          <summary>Fixture summary</summary>
        </SectionReveal>
      </MotionProvider>
    );
    const el = container.querySelector(`.${revealAnimatedClass}`)!;
    expect(el.tagName).toBe("DETAILS");
  });

  it("renders its children", () => {
    const { getByTestId } = renderReveal();
    expect(getByTestId("content")).toHaveTextContent("Fixture content");
  });

  it("carries the shared no-JS override marker class", () => {
    const { container } = renderReveal();
    expect(container.querySelector(`.${revealAnimatedClass}`)).not.toBeNull();
  });

  it("starts hidden (opacity 0, offset) before the reveal fires", () => {
    const { container } = renderReveal();
    const wrapper = container.querySelector(
      `.${revealAnimatedClass}`
    ) as HTMLElement;
    expect(wrapper.style.opacity).toBe("0");
    expect(wrapper.style.transform).toContain(`${pace.offsetY}px`);
  });

  it("animates to visible once the reveal fires", async () => {
    const { container } = renderReveal();
    const observer = FakeIntersectionObserver.instances.at(-1)!;

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
    fireIntersecting(observer);

    const wrapper = container.querySelector(
      `.${revealAnimatedClass}`
    ) as HTMLElement;
    // pace.duration is 1.4s — the default waitFor timeout (1s) is shorter
    // than a real settle, so this needs its own longer timeout.
    await waitFor(() => expect(wrapper.style.opacity).toBe("1"), {
      timeout: 2000,
    });
    expect(wrapper.style.transform).not.toContain("px");
  }, 3000);

  it("under reduced motion, never renders a y-offset, only opacity", () => {
    setPrefersReducedMotion(true);
    const { container } = renderReveal();
    const wrapper = container.querySelector(
      `.${revealAnimatedClass}`
    ) as HTMLElement;
    expect(wrapper.style.opacity).toBe("0");
    expect(wrapper.style.transform ?? "").not.toContain("px");
  });

  it("under reduced motion, still reaches its fully visible final state once revealed — opacity only, never a y-offset even after settling", async () => {
    setPrefersReducedMotion(true);
    const { container } = renderReveal();
    const observer = FakeIntersectionObserver.instances.at(-1)!;

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
    fireIntersecting(observer);

    const wrapper = container.querySelector(
      `.${revealAnimatedClass}`
    ) as HTMLElement;
    await waitFor(() => expect(wrapper.style.opacity).toBe("1"), {
      timeout: 2000,
    });
    expect(wrapper.style.transform ?? "").not.toContain("px");
  }, 3000);
});
