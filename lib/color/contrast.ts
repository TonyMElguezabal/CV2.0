// WCAG 2.1 relative luminance / contrast ratio — pure arithmetic on two hex
// values. Extracted from HeroLaptop.test.tsx (JOS-105) for reuse by
// site-typography-and-palette's palette tests. Unlike axe's "color-contrast"
// rule (disabled in accessibilityStructure.test.tsx), this needs no real
// computed layout, which jsdom cannot produce — so it's usable anywhere a
// text/background pair is known ahead of time.
export function srgbToLinear(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

// Shared with ambient-sparkle-layer (JOS-110): the particle field's fill
// color derives from `heroLaptopAccentHex` via this same parse, rather than
// hard-coding a second rgb triplet — see design.md Decision 7 in
// openspec/changes/ambient-sparkle-layer.
export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// Simulates canvas 2D compositing of a translucent foreground colour over an
// opaque background, so a rendered contrast can be checked before anything
// is actually drawn. "source-over" is normal alpha blending; "lighter" is
// additive (Porter-Duff "plus") compositing, matching
// `ctx.globalCompositeOperation`. Shared by AmbientSparkleLayer's node pass
// (lighter) and its link pass (source-over, deliberately not lighter) — see
// ambient-constellation-links design.md Decision 3, where the two modes are
// shown to produce materially different contrast against the same
// background.
export function compositeOverBackground(
  foregroundHex: string,
  backgroundHex: string,
  alpha: number,
  mode: "source-over" | "lighter" = "source-over"
): [number, number, number] {
  const [fr, fg, fb] = hexToRgb(foregroundHex);
  const [br, bg, bb] = hexToRgb(backgroundHex);
  if (mode === "lighter") {
    return [
      Math.min(255, fr * alpha + br),
      Math.min(255, fg * alpha + bg),
      Math.min(255, fb * alpha + bb),
    ];
  }
  return [
    fr * alpha + br * (1 - alpha),
    fg * alpha + bg * (1 - alpha),
    fb * alpha + bb * (1 - alpha),
  ];
}

export function relativeLuminanceRgb(rgb: readonly [number, number, number]): number {
  const [r, g, b] = rgb;
  return (
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
  );
}

export function contrastRatioRgb(
  rgbA: readonly [number, number, number],
  rgbB: readonly [number, number, number]
): number {
  const lA = relativeLuminanceRgb(rgbA);
  const lB = relativeLuminanceRgb(rgbB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}
