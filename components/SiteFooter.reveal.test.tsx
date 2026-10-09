// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";
import type { Profile } from "@/lib/content/types.ts";

// The footer sits outside the layout's MotionProvider, so it must supply its own.
// Without LazyMotion, the reveal's animation never runs and the text stays at opacity 0.
const FOOTER: Pick<Profile, "footer" | "links" | "contact"> = {
  footer: {
    headline: "Fixture headline.",
    subline: "Fixture subline.",
    ctaLabel: "Fixture call to action",
    ctaSubLabel: "Fixture sub-label",
  },
  links: { linkedin: "https://www.linkedin.com/in/fixture" },
  contact: { email: "fixture@example.com", scheduling: "https://cal.com/fixture" },
};

describe("SiteFooter — text block reveals on the live page", () => {
  it("animates the headline to fully visible once revealed", async () => {
    const { getByRole } = render(<SiteFooter {...FOOTER} />);
    const headlineWrapper = getByRole("heading", { level: 2 }).parentElement as HTMLElement;

    // pace.duration is 1.4s; waitFor's default 1s timeout is shorter than
    // the animation it's waiting on, so it must be raised here.
    await waitFor(
      () => {
        expect(getComputedStyle(headlineWrapper).opacity).toBe("1");
      },
      { timeout: 2000 },
    );
  });
});
