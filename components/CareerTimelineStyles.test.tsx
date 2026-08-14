import {
  timelineMarkerClass,
  timelineNodeClass,
} from "./CareerTimelineStyles";

describe("editorial rail — reduced-motion (editorial-frame Task Group 6.4)", () => {
  it("only gates its color change behind motion-safe, never an unconditional transition", () => {
    expect(timelineMarkerClass).toContain("motion-safe:transition-colors");
    // No bare `transition`/`transition-*` utility outside the motion-safe:
    // variant — an unconditional one would still animate under
    // prefers-reduced-motion.
    expect(timelineMarkerClass).not.toMatch(/(?<!motion-safe:)\btransition(-\w+)?\b/);
  });

  it("keeps the marker's active-state size change a plain property jump, not an animated one", () => {
    // Only color is ever transitioned (see above) — width/height utilities
    // switch instantly on aria-current change, at every motion preference,
    // by construction (no transition-[height,width]/transition-all here).
    expect(timelineMarkerClass).not.toMatch(/transition-(all|\[)/);
  });

  it("carries no transition utility of its own on the node wrapper (color now lives on the marker only)", () => {
    expect(timelineNodeClass).not.toMatch(/\btransition/);
  });
});
