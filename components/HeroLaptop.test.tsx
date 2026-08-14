// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { HeroLaptop } from "./HeroLaptop";
import { heroLaptopAccentHex } from "./HeroShellStyles";
import { contrastRatio } from "@/lib/color/contrast.ts";

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
    expect(lid.style.transform).not.toContain("-170deg");

    const screenEl = screen.getByTestId("hero-laptop-screen");
    expect(screenEl.style.opacity).toBe("1");
  });

  it("renders a keyboard, trackpad, and closed-pose lid accent so the shell reads as a laptop", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    expect(screen.getByTestId("hero-laptop-keyboard")).toBeInTheDocument();
    expect(screen.getByTestId("hero-laptop-trackpad")).toBeInTheDocument();
    expect(screen.getByTestId("hero-laptop-lid-accent")).toBeInTheDocument();
  });

  it("is simplified away below the sm breakpoint (hidden on small viewports, shown at sm and up)", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const layer = screen.getByTestId("hero-laptop-layer");
    expect(layer.className.split(/\s+/)).toEqual(
      expect.arrayContaining(["hidden", "sm:flex"])
    );
  });

  it("renders the lid as two distinct faces (screen and outer), each hiding its backface", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const screenFace = screen.getByTestId("hero-laptop-lid-face-screen");
    const outerFace = screen.getByTestId("hero-laptop-lid-face-outer");

    for (const face of [screenFace, outerFace]) {
      expect(face.className.split(/\s+/)).toEqual(
        expect.arrayContaining(["[backface-visibility:hidden]"])
      );
    }

    // The terminal screen lives on the screen face; the lid accent lives on
    // the outer face — so only the viewer-facing face's content is present
    // on that face (JOS-105 AC6 / hero-signature-motion "Only the
    // viewer-facing lid face is visible").
    expect(screenFace.contains(screen.getByTestId("hero-laptop-screen"))).toBe(
      true
    );
    expect(
      outerFace.contains(screen.getByTestId("hero-laptop-lid-accent"))
    ).toBe(true);
    expect(
      screenFace.contains(screen.getByTestId("hero-laptop-lid-accent"))
    ).toBe(false);
    expect(outerFace.contains(screen.getByTestId("hero-laptop-screen"))).toBe(
      false
    );
  });

  // Only four lights: a fifth (key/shadow wash) was implemented, then
  // removed after real-browser verification found it visually
  // indistinguishable from these four once composited under the scrim —
  // see design.md Decision 8 in openspec/changes/hero-laptop-cinematic-
  // lighting and the delta spec's amended light list.
  const lightingTestIds = [
    "hero-laptop-rim-base",
    "hero-laptop-deck-spill",
    "hero-laptop-contact-shadow",
    "hero-laptop-rim-screen",
    "hero-laptop-bezel-bloom",
    "hero-laptop-specular-screen",
    "hero-laptop-rim-outer",
    "hero-laptop-specular-outer",
  ];

  it("renders the four-light rig (rim, screen spill, contact shadow, specular sweep), animating only opacity and transform", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    for (const testId of lightingTestIds) {
      const el = screen.getByTestId(testId);
      expect(el).toBeInTheDocument();
      // Only opacity/transform are permitted animated properties — never
      // filter, box-shadow, or background-position (hero-signature-motion
      // "The lighting rig uses only permitted properties and drivers").
      expect(el.style.filter).toBe("");
      expect(el.style.boxShadow).toBe("");
      expect(el.style.backgroundPosition).toBe("");
    }
  });

  it("rim light is at its strongest and the screen spill is absent at the start of the scroll range", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const rimBase = screen.getByTestId("hero-laptop-rim-base");
    expect(Number(rimBase.style.opacity)).toBeCloseTo(1, 1);

    const deckSpill = screen.getByTestId("hero-laptop-deck-spill");
    expect(Number(deckSpill.style.opacity)).toBe(0);
  });

  it("grounds the laptop with a contact shadow present from the start", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const contactShadow = screen.getByTestId("hero-laptop-contact-shadow");
    expect(Number(contactShadow.style.opacity)).toBeGreaterThan(0);
  });

  it("renders fixed open-pose lighting values under prefers-reduced-motion, not scroll-bound", () => {
    setPrefersReducedMotion(true);
    render(<HeroLaptop terminalLines={terminalLines} />);

    // These constants are the formulas' own values at the static open,
    // front-facing pose (p=1) — distinct from each formula's value at p=0,
    // so a passing assertion here only happens if the reduced-motion
    // branch is actually wired (not just coincidentally close to the
    // scroll-bound default).
    expect(
      Number(screen.getByTestId("hero-laptop-rim-base").style.opacity)
    ).toBeCloseTo(0.28, 2);
    expect(
      Number(screen.getByTestId("hero-laptop-deck-spill").style.opacity)
    ).toBe(1);
    expect(
      Number(screen.getByTestId("hero-laptop-bezel-bloom").style.opacity)
    ).toBe(1);
    expect(
      Number(screen.getByTestId("hero-laptop-contact-shadow").style.opacity)
    ).toBe(1);
    expect(
      Number(screen.getByTestId("hero-laptop-hinge").style.opacity)
    ).toBeCloseTo(0.5, 2);
    expect(
      Number(screen.getByTestId("hero-laptop-specular-screen").style.opacity)
    ).toBeCloseTo(0.45, 2);
  });

  it("derives the terminal's text color and the screen spill/bloom color from one shared accent, not independent literals", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const terminal = screen.getByTestId("hero-laptop-terminal");
    // Checked as an inline `style.color`, not a Tailwind class string:
    // Tailwind's JIT scanner only sees literal text in source files, so a
    // class name built via JS template-literal interpolation (as an
    // earlier version of this code did, `text-[${heroLaptopAccentHex}]`)
    // never gets its CSS rule generated — the className string looks
    // correct but has zero visual effect, a real-browser-only bug a
    // className-content check can't catch (found via Step 11's actual
    // browser verification, not by this test suite). Inline style
    // sidesteps that entirely (the same reason every light in the rig
    // uses inline style rather than a Tailwind utility for its color).
    //
    // jsdom normalizes inline hex colors (and the spill/bloom gradients'
    // 8-digit hex+alpha) to rgb()/rgba() on serialization, so match the
    // same underlying RGB triplet rather than the literal hex substring.
    const accentR = parseInt(heroLaptopAccentHex.slice(1, 3), 16);
    const accentG = parseInt(heroLaptopAccentHex.slice(3, 5), 16);
    const accentB = parseInt(heroLaptopAccentHex.slice(5, 7), 16);
    const accentRgbFragment = `${accentR}, ${accentG}, ${accentB}`;

    expect(terminal.style.color).toBe(`rgb(${accentRgbFragment})`);
    expect(terminal.className).not.toContain("emerald");

    const deckSpill = screen.getByTestId("hero-laptop-deck-spill");
    const bezelBloom = screen.getByTestId("hero-laptop-bezel-bloom");
    expect(deckSpill.style.backgroundImage).toContain(accentRgbFragment);
    expect(bezelBloom.style.backgroundImage).toContain(accentRgbFragment);
  });

  // WCAG 2.1 relative luminance / contrast ratio — pure arithmetic on two
  // known hex values (lib/color/contrast.ts), unlike axe's "color-contrast"
  // rule (disabled in accessibilityStructure.test.tsx) which needs real
  // computed layout that jsdom cannot produce. Terminal text sits on a known
  // #000 background (heroLaptopScreenClass's bg-black), so this is
  // measurable exactly.

  it("meets the site's AA contrast requirement (4.5:1) for the terminal's text against its black screen background", () => {
    const ratio = contrastRatio(heroLaptopAccentHex, "#000000");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("renders at an enlarged, cropped size docked to a corner on sm+ viewports, rather than the original centered-thumbnail dimensions", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const base = screen.getByTestId("hero-laptop-base");
    const baseClasses = base.className.split(/\s+/);
    // Enlarged from the original sm:h-56 sm:w-96 (224x384px) thumbnail —
    // hero-signature-motion "The laptop is cropped by the viewport". Sized
    // to 300x520 (not larger — an initial 420x680 attempt, verified in a
    // real browser during Step 11, clipped the terminal text entirely off
    // the top of the viewport at 1280x800; this size was re-verified
    // in-frame at 1280/1440/1920/2560).
    expect(baseClasses).toEqual(
      expect.arrayContaining(["sm:h-[300px]", "sm:w-[520px]"])
    );

    const scene = screen.getByTestId("hero-laptop-scene");
    const sceneClasses = scene.className.split(/\s+/);
    expect(sceneClasses).toEqual(
      expect.arrayContaining(["sm:-mr-4", "sm:-mb-6"])
    );

    const layer = screen.getByTestId("hero-laptop-layer");
    const layerClasses = layer.className.split(/\s+/);
    expect(layerClasses).toEqual(
      expect.arrayContaining(["items-end", "justify-end"])
    );
    // Mobile gating (AC: "Small viewports are unaffected") is unchanged.
    expect(layerClasses).toEqual(
      expect.arrayContaining(["hidden", "sm:flex"])
    );
  });

  it("paints the scrim on top of the lit scene, not behind it, so it actually dims the laptop's own lit surfaces for text contrast", () => {
    setPrefersReducedMotion(false);
    render(<HeroLaptop terminalLines={terminalLines} />);

    const layer = screen.getByTestId("hero-laptop-layer");
    const scrim = screen.getByTestId("hero-laptop-scrim");
    const scene = screen.getByTestId("hero-laptop-scene");

    // Direct children of the layer, in DOM order — for position:absolute/
    // relative siblings with z-index:auto, later DOM order paints on top.
    // If the scrim were still DOM-first (as it originally was), it would
    // be fully occluded by the laptop's own opaque base/lid material and
    // have zero visual effect over the laptop itself.
    const children = Array.from(layer.children);
    expect(children.indexOf(scrim)).toBeGreaterThan(children.indexOf(scene));
  });
});

// The no-JS static override (a <noscript><style> block forcing the open/
// front-facing/terminal-visible state, extended in
// openspec/changes/hero-laptop-cinematic-lighting to also force every
// light layer to its open-pose opacity) is not unit-tested: jsdom does not
// expose <noscript> children even when the DOM is built via createElement
// rather than HTML parsing — the same reason HeroFramer.tsx's own noscript
// override has no jsdom test. Verified visually/manually (task 5.6, and
// task 11.5 for the lighting rig's no-JS state).
