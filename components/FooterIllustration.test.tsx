// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  FOOTER_ELBOW_TRANSFORM_ORIGIN,
  FOOTER_WAG_DURATION_SECONDS,
  FOOTER_WAG_ROTATE_KEYFRAMES,
  FOOTER_WAG_TIMES,
} from "./SiteFooterStyles";
import { FooterIllustration, footerWagMotionProps } from "./FooterIllustration";

let mockReducedMotion = false;

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useReducedMotion: () => mockReducedMotion,
  };
});

describe("FooterIllustration — decorative, inline-SVG vector art on the shared body render", () => {
  it("hides the whole illustration from assistive technology", () => {
    mockReducedMotion = false;
    const { container } = render(<FooterIllustration />);

    const root = container.firstElementChild;
    expect(root?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders one body image, served from /public, never as a data URI", () => {
    mockReducedMotion = false;
    const { container } = render(<FooterIllustration />);

    const images = container.querySelectorAll("image");
    expect(images).toHaveLength(1);
    const src = images[0]!.getAttribute("href") ?? "";
    expect(src.startsWith("/")).toBe(true);
    expect(src.startsWith("data:")).toBe(false);
  });

  it("pivots only the forearm group, at the recorded elbow origin", () => {
    mockReducedMotion = false;
    const { container } = render(<FooterIllustration />);

    const forearm = container.querySelector('[data-layer="forearm"]') as HTMLElement;
    expect(forearm).not.toBeNull();
    expect(forearm.style.transformOrigin).toBe(FOOTER_ELBOW_TRANSFORM_ORIGIN);

    const body = container.querySelector('[data-layer="body"]');
    expect(body?.getAttribute("style") ?? "").not.toMatch(/transform-origin/);
  });

  it("draws the vector hands and face as real markup, not a raster layer", () => {
    mockReducedMotion = false;
    const { container } = render(<FooterIllustration />);

    expect(container.querySelectorAll("svg path, svg rect, svg ellipse").length).toBeGreaterThan(0);
  });
});

describe("footerWagMotionProps — the finger wag (spec: transform-only, stops under reduced motion)", () => {
  it("animates the rotation with the shared keyframes and timing", () => {
    const props = footerWagMotionProps(false);

    expect(props.animate).toEqual({ rotate: FOOTER_WAG_ROTATE_KEYFRAMES });
    expect(props.transition.times).toEqual(FOOTER_WAG_TIMES);
    expect(props.transition.duration).toBe(FOOTER_WAG_DURATION_SECONDS);
    expect(props.transition.repeat).toBe(Infinity);
  });

  it("stops entirely under reduced motion, leaving the forearm at rest", () => {
    const props = footerWagMotionProps(true);

    expect(props.animate).toBeUndefined();
  });

  it("keeps keyframes and times the same length, and times ascending in [0, 1]", () => {
    expect(FOOTER_WAG_TIMES).toHaveLength(FOOTER_WAG_ROTATE_KEYFRAMES.length);
    expect([...FOOTER_WAG_TIMES].sort((a, b) => a - b)).toEqual(FOOTER_WAG_TIMES);
    expect(FOOTER_WAG_TIMES[0]).toBe(0);
    expect(FOOTER_WAG_TIMES[FOOTER_WAG_TIMES.length - 1]).toBe(1);
  });
});
