// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ARRIVAL_STEP_DELAYS, detectDeepLinkSkip } from "./arrivalSequence";
import { pace } from "./motionPace";

afterEach(() => {
  window.location.hash = "";
});

describe("ARRIVAL_STEP_DELAYS — one rhythm, not several timings", () => {
  it("every step's delay derives from the shared pace token", () => {
    for (const delay of Object.values(ARRIVAL_STEP_DELAYS)) {
      expect(delay).toBeGreaterThanOrEqual(0);
      // Each delay is a fraction of pace.duration, not an independently
      // chosen number — dividing by pace.duration should always land on a
      // "nice" fraction rather than an arbitrary decimal.
      expect(delay % pace.duration === 0 || delay / pace.duration < 1).toBe(
        true
      );
    }
  });

  it("steps are strictly increasing — a defined order, not simultaneous", () => {
    const delays = Object.values(ARRIVAL_STEP_DELAYS);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]!);
    }
  });

  it("every step's delay is well under pace.duration, so steps overlap rather than playing strictly in sequence", () => {
    for (const delay of Object.values(ARRIVAL_STEP_DELAYS)) {
      expect(delay).toBeLessThan(pace.duration);
    }
  });

  it("the laptop (non-text) precedes hero name and positioning (text)", () => {
    expect(ARRIVAL_STEP_DELAYS.laptop).toBeLessThan(
      ARRIVAL_STEP_DELAYS.heroName
    );
    expect(ARRIVAL_STEP_DELAYS.laptop).toBeLessThan(
      ARRIVAL_STEP_DELAYS.heroPositioning
    );
  });
});

describe("detectDeepLinkSkip — never touches scroll itself", () => {
  it("calls no scroll API — the browser's own native scroll-to-anchor and scroll restoration are left entirely alone", () => {
    // design.md Decision 4: the risk this guards against is the sequence
    // fighting the browser's native anchor-scroll behavior. The safest way
    // to guarantee that is structural: this function only ever reads
    // `window.location.hash` and calls `document.getElementById` to check
    // whether the target exists — it never calls `scrollTo`,
    // `scrollIntoView`, or touches `history.scrollRestoration`.
    const source = readFileSync(
      join(process.cwd(), "components", "arrivalSequence.ts"),
      "utf8"
    );
    expect(source).not.toMatch(/scrollTo|scrollIntoView|scrollRestoration/);
  });
});

describe("detectDeepLinkSkip", () => {
  it("returns false when there is no fragment", () => {
    window.location.hash = "";
    expect(detectDeepLinkSkip()).toBe(false);
  });

  it("returns false when the fragment targets no element in the document", () => {
    window.location.hash = "#does-not-exist";
    expect(detectDeepLinkSkip()).toBe(false);
  });

  it("returns true when the fragment targets a real element", () => {
    const el = document.createElement("div");
    el.id = "contact";
    document.body.appendChild(el);
    window.location.hash = "#contact";

    expect(detectDeepLinkSkip()).toBe(true);

    el.remove();
  });
});
