// @vitest-environment jsdom
//
// Guardrail for the owner's IA decision (proposal.md "the timeline becomes
// the rail" / design.md Decision 2): the failure mode this test exists to
// catch is someone adding a second progress indicator later "because the
// frame should have one." The site's one mechanism for indicating scroll
// position is `aria-current="location"` on a CareerTimeline node — this
// asserts the header and grid overlay are structurally incapable of
// producing that same signal, not just that they happen not to today.
import { render } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";
import { GridOverlay } from "./GridOverlay";
import { CareerTimeline } from "./CareerTimeline";
import type { ExperienceWithId } from "@/lib/content/read.ts";

class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeEach(() => {
  (
    globalThis as { IntersectionObserver?: unknown }
  ).IntersectionObserver = NoopIntersectionObserver;
});

const FIXTURE_EXPERIENCE: ExperienceWithId = {
  id: "fixture-co",
  company: "Fixture Co",
  role: "Engineer",
  mission: "Fixture mission.",
  dates: { start: "2020-01" },
  context: "Fixture context.",
  responsibilities: ["Fixture responsibility"],
  projects: [
    { title: "Fixture project", outcome: "Fixture outcome", metrics: ["1%"] },
  ],
  leadership: ["Fixture leadership"],
  technologies: ["FixtureLang"],
  lessons: "Fixture lesson.",
};

describe("no second scroll-position indicator in the frame", () => {
  it("only a CareerTimeline node can ever carry aria-current in the composed frame", () => {
    const { container } = render(
      <>
        <SiteHeader brandName="Fixture Person" />
        <GridOverlay />
        <CareerTimeline experiences={[FIXTURE_EXPERIENCE]} />
      </>
    );

    const markers = container.querySelectorAll("[aria-current]");
    for (const marker of markers) {
      expect(marker.closest("nav")).toHaveAttribute(
        "aria-label",
        "Career timeline"
      );
    }
  });

  it("the header's own nav never carries aria-current — it is a static section-link list, not a position indicator", () => {
    const { container } = render(<SiteHeader brandName="Fixture Person" />);
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(0);
  });

  it("the grid overlay renders no interactive or stateful indicator elements at all", () => {
    const { container } = render(<GridOverlay />);
    expect(
      container.querySelectorAll("[aria-current], a, button")
    ).toHaveLength(0);
  });
});
