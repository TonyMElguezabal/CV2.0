import { describe, expect, it } from "vitest";

describe("motionPace", () => {
  it("exposes the owner-selected duration, easing, and offset as one shared token", async () => {
    const { pace } = await import("./motionPace.ts");
    // 1.4s cubic-bezier(.16, 1, .3, 1) — owner-selected from the A/B
    // specimen against the original 0.6s easeOut. site-typography-and-
    // palette design.md Decision 4.
    expect(pace.duration).toBe(1.4);
    expect(pace.ease).toEqual([0.16, 1, 0.3, 1]);
    expect(typeof pace.offsetY).toBe("number");
  });
});
