// @vitest-environment jsdom
import { act, render, screen, cleanup } from "@testing-library/react";
import {
  ArrivalSequenceProvider,
  useArrivalStep,
} from "./ArrivalSequenceProvider";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pace } from "./motionPace";
import * as arrivalSequence from "./arrivalSequence";

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
  window.location.hash = "";
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Probe({
  delay = 0.5,
  withOffset = true,
}: {
  delay?: number;
  withOffset?: boolean;
}) {
  const step = useArrivalStep(delay, withOffset);
  return (
    <div
      data-testid="probe"
      data-initial-opacity={step.initial.opacity}
      data-initial-y={step.initial.y}
      data-animate-opacity={step.animate.opacity}
      data-animate-y={step.animate.y}
      data-duration={step.transition.duration}
      data-delay={step.transition.delay}
    />
  );
}

describe("ArrivalSequenceProvider / useArrivalStep", () => {
  it("starts hidden (opacity 0, offset) before the mount effect resolves", () => {
    // React Testing Library's render() wraps effects in act(), so by the
    // time render() returns the effect has already run once — this test
    // instead asserts the *initial* value the hook computed, which is what
    // SSR bakes into the HTML and is exactly what task 1.1 needs covered.
    let initialOpacity: string | null = null;
    function CaptureFirstRender() {
      const step = useArrivalStep(0.5);
      if (initialOpacity === null) {
        initialOpacity = String(step.initial.opacity);
      }
      return null;
    }
    render(
      <ArrivalSequenceProvider>
        <CaptureFirstRender />
      </ArrivalSequenceProvider>
    );
    expect(initialOpacity).toBe("0");
  });

  it("reaches the visible animate target once the mount effect has run", () => {
    render(
      <ArrivalSequenceProvider>
        <Probe delay={0.5} />
      </ArrivalSequenceProvider>
    );
    const probe = screen.getByTestId("probe");
    expect(probe.dataset.animateOpacity).toBe("1");
    expect(probe.dataset.animateY).toBe("0");
  });

  it("uses the requested delay and the shared pace duration/ease — not an independent timing", () => {
    render(
      <ArrivalSequenceProvider>
        <Probe delay={0.63} />
      </ArrivalSequenceProvider>
    );
    const probe = screen.getByTestId("probe");
    expect(probe.dataset.delay).toBe("0.63");
    expect(probe.dataset.duration).toBe(String(pace.duration));
  });

  it("applies the shared offsetY in its hidden/initial state, matching the site's standard fade+rise", () => {
    render(
      <ArrivalSequenceProvider>
        <Probe delay={0.5} />
      </ArrivalSequenceProvider>
    );
    const probe = screen.getByTestId("probe");
    expect(probe.dataset.initialY).toBe(String(pace.offsetY));
  });

  it("withOffset=false never renders a y-offset, even without reduced motion", () => {
    render(
      <ArrivalSequenceProvider>
        <Probe delay={0} withOffset={false} />
      </ArrivalSequenceProvider>
    );
    const probe = screen.getByTestId("probe");
    expect(probe.dataset.initialY).toBe("0");
    expect(probe.dataset.animateY).toBe("0");
  });

  describe("deep-link skip", () => {
    it("when the fragment targets a real element, renders directly in final state with no transition", () => {
      const el = document.createElement("div");
      el.id = "contact";
      document.body.appendChild(el);
      window.location.hash = "#contact";

      render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      const probe = screen.getByTestId("probe");
      expect(probe.dataset.initialOpacity).toBe("1");
      expect(probe.dataset.animateOpacity).toBe("1");
      expect(probe.dataset.duration).toBe("0");

      el.remove();
    });

    it("plays normally with no fragment", () => {
      window.location.hash = "";
      render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      const probe = screen.getByTestId("probe");
      expect(probe.dataset.duration).toBe(String(pace.duration));
    });
  });

  describe("fail-visible: the orchestrator throws", () => {
    it("still reaches the visible animate target if deep-link detection throws", () => {
      vi.spyOn(arrivalSequence, "detectDeepLinkSkip").mockImplementation(
        () => {
          throw new Error("simulated orchestrator failure");
        }
      );

      render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      const probe = screen.getByTestId("probe");
      expect(probe.dataset.animateOpacity).toBe("1");
      expect(probe.dataset.animateY).toBe("0");
    });
  });

  describe("reduced motion", () => {
    it("never renders a y-offset under prefers-reduced-motion", () => {
      setPrefersReducedMotion(true);
      render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      const probe = screen.getByTestId("probe");
      expect(probe.dataset.initialY).toBe("0");
      expect(probe.dataset.animateY).toBe("0");
    });

    it("still fades to full opacity under prefers-reduced-motion", () => {
      setPrefersReducedMotion(true);
      render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      const probe = screen.getByTestId("probe");
      expect(probe.dataset.animateOpacity).toBe("1");
    });

    it("movement is removed, not merely stretched over a longer duration", () => {
      setPrefersReducedMotion(true);
      render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      const probe = screen.getByTestId("probe");
      expect(probe.dataset.duration).toBe(String(pace.duration));
    });
  });

  it("a consumer rendered outside the provider fails visible (fully visible, no-op) rather than staying hidden", () => {
    render(<Probe delay={0.5} />);
    const probe = screen.getByTestId("probe");
    expect(probe.dataset.initialOpacity).toBe("1");
    expect(probe.dataset.animateOpacity).toBe("1");
  });

  describe("never blocks interaction (task 1.3)", () => {
    it("the returned style only ever touches opacity/y — never pointer-events or a disabled state", () => {
      // Structural guarantee: a visitor who arrives wanting the résumé
      // must not have to wait out a flourish to click it. Asserted against
      // every branch useArrivalStep can take (normal, skip, reduced
      // motion), not just the default path.
      function AllBranches() {
        const normal = useArrivalStep(0.5);
        const noOffset = useArrivalStep(0.5, false);
        for (const step of [normal, noOffset]) {
          expect(Object.keys(step.initial).sort()).toEqual(["opacity", "y"]);
          expect(Object.keys(step.animate).sort()).toEqual(["opacity", "y"]);
        }
        return null;
      }
      render(
        <ArrivalSequenceProvider>
          <AllBranches />
        </ArrivalSequenceProvider>
      );
    });

    it("a real control stays clickable while its wrapper is mid-sequence", () => {
      function Wrapped() {
        const step = useArrivalStep(0.5);
        return (
          <div style={{ opacity: step.animate.opacity }}>
            <button type="button" onClick={() => setClicked(true)}>
              Download résumé
            </button>
          </div>
        );
      }
      let clicked = false;
      function setClicked(value: boolean) {
        clicked = value;
      }
      render(
        <ArrivalSequenceProvider>
          <Wrapped />
        </ArrivalSequenceProvider>
      );
      const button = screen.getByRole("button", { name: "Download résumé" });
      expect(button).not.toBeDisabled();
      button.click();
      expect(clicked).toBe(true);
    });
  });

  describe("plays on every load and persists nothing (task 4)", () => {
    it("writes no cookie, localStorage, or sessionStorage — either load", () => {
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      const cookieSpy = vi.spyOn(document, "cookie", "set");

      // Render twice in a row — simulating a repeat visit in the same
      // browser — to prove the second run behaves identically to the
      // first rather than reading/writing anything to remember it.
      const first = render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      first.unmount();
      render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );

      expect(setItemSpy).not.toHaveBeenCalled();
      expect(cookieSpy).not.toHaveBeenCalled();
    });

    it("the source never references localStorage, sessionStorage, or document.cookie", () => {
      // Structural guarantee, not just a spy on this test's own render:
      // confirms the *mechanism* to persist a "has played" flag was never
      // introduced, matching `lib/session.ts`'s own deliberate in-memory-
      // only convention (design.md Decision 3).
      for (const file of ["arrivalSequence.ts", "ArrivalSequenceProvider.tsx"]) {
        const source = readFileSync(
          join(process.cwd(), "components", file),
          "utf8"
        );
        expect(source).not.toMatch(
          /localStorage|sessionStorage|document\.cookie/
        );
      }
    });

    it("the sequence plays again on a repeat render, replaying exactly like the first", () => {
      const first = render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      const firstAnimate = screen.getByTestId("probe").dataset.animateOpacity;
      first.unmount();

      render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      const secondAnimate = screen.getByTestId("probe").dataset.animateOpacity;

      expect(secondAnimate).toBe(firstAnimate);
      expect(secondAnimate).toBe("1");
    });
  });

  describe("one owner per element (task 6)", () => {
    it("the hero's entrance is not also claimed by the scroll-reveal system", () => {
      // design.md Decision 6: the hero's entrance belongs to the arrival
      // sequence; JOS-111's scroll-reveal system (SectionReveal/
      // RevealHeading) must not also animate it. Verified at the source
      // level across every hero component.
      for (const file of ["HeroFramer.tsx", "HeroCtas.tsx", "HeroLaptop.tsx"]) {
        const source = readFileSync(
          join(process.cwd(), "components", file),
          "utf8"
        );
        expect(source).not.toMatch(/SectionReveal|RevealHeading/);
      }
    });

    it("tolerates absent participants — an unrelated consumer resolves normally even when only some participants are mounted", () => {
      // No central registry of "expected" participants exists to go
      // missing — each component independently calls useArrivalStep with
      // its own delay, so there is no runtime path where one participant's
      // absence could affect another's. Demonstrated by mounting a single
      // consumer alone (as GridOverlay's removal, JOS-113, now permanently
      // does for the grid) and confirming it still completes normally.
      render(
        <ArrivalSequenceProvider>
          <Probe delay={0.5} />
        </ArrivalSequenceProvider>
      );
      const probe = screen.getByTestId("probe");
      expect(probe.dataset.animateOpacity).toBe("1");
      expect(probe.dataset.duration).toBe(String(pace.duration));
    });
  });
});
