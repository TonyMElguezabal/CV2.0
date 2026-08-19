// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { CareerTimeline } from "./CareerTimeline";
import type { ExperienceWithId } from "@/lib/content/read.ts";
import type { Origins } from "@/lib/content/types.ts";

const OLDER: ExperienceWithId = {
  id: "acme",
  company: "Acme",
  role: "Engineer",
  mission: "Older mission statement.",
  dates: { start: "2018-01", end: "2020-06" },
  context: "Older context.",
  responsibilities: ["Did an older thing"],
  projects: [
    { title: "Older project", outcome: "Older outcome", metrics: ["50% improvement"] },
  ],
  leadership: ["Led an older thing"],
  technologies: ["JavaScript"],
  lessons: "Older lesson.",
};

const NEWER: ExperienceWithId = {
  id: "beta",
  company: "Beta",
  role: "Senior Engineer",
  mission: "Newer mission statement.",
  dates: { start: "2021-01" },
  context: "Newer context.",
  responsibilities: ["Did a newer thing"],
  projects: [
    { title: "Newer project", outcome: "Newer outcome", metrics: ["200% improvement"] },
  ],
  leadership: ["Led a newer thing"],
  technologies: ["TypeScript"],
  lessons: "Newer lesson.",
};

describe("CareerTimeline", () => {
  it("renders one node per experience passed in, in the same order", () => {
    render(<CareerTimeline experiences={[NEWER, OLDER]} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleName(/Beta/);
    expect(links[1]).toHaveAccessibleName(/Acme/);
  });

  it("shows the company and formatted date range as visible text on each node", () => {
    render(<CareerTimeline experiences={[OLDER]} />);
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Jan 2018 – Jun 2020")).toBeInTheDocument();
  });

  it("gives each node an accessible name including role, company, and date range", () => {
    render(<CareerTimeline experiences={[OLDER]} />);
    const link = screen.getByRole("link", { name: /Acme/ });
    expect(link).toHaveAccessibleName("Engineer at Acme, Jan 2018 – Jun 2020");
  });

  it("links each node to its chapter via a matching fragment anchor", () => {
    render(<CareerTimeline experiences={[OLDER, NEWER]} />);
    expect(screen.getByRole("link", { name: /Acme/ })).toHaveAttribute(
      "href",
      "#acme"
    );
    expect(screen.getByRole("link", { name: /Beta/ })).toHaveAttribute(
      "href",
      "#beta"
    );
  });

  it("scales the node count to any number of experiences", () => {
    render(<CareerTimeline experiences={[]} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);

    render(<CareerTimeline experiences={[OLDER, NEWER]} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});

// origins-earlier-career (JOS-115): the origins prop is optional and
// additive — every test above omits it and must keep passing unmodified
// (design.md Decision 4).
const ORIGINS_FIXTURE: Origins = {
  title: "Origins",
  period: "1994 – 2006",
  summary: "Fixture origins summary.",
  entries: [
    {
      id: "ccej",
      label: "Fixture entry",
      period: "age 13",
      narrative: "Fixture narrative.",
    },
    {
      id: "calcom",
      label: "Fixture entry two",
      period: "age 17",
      narrative: "Fixture narrative two.",
    },
  ],
};

describe("CareerTimeline with an origins record", () => {
  it("adds exactly one node for the origins record, regardless of how many entries it contains", () => {
    render(<CareerTimeline experiences={[OLDER, NEWER]} origins={ORIGINS_FIXTURE} />);
    // 2 experience nodes + exactly 1 origins node, even though the fixture
    // record has 2 entries.
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("adding an entry to the origins record does not change the node count", () => {
    const withThreeEntries: Origins = {
      ...ORIGINS_FIXTURE,
      entries: [
        ...ORIGINS_FIXTURE.entries,
        { id: "inegi", label: "Third entry", period: "2004–2006", narrative: "Third narrative." },
      ],
    };
    render(<CareerTimeline experiences={[OLDER]} origins={withThreeEntries} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("labels the origins node from the origins record's own title and period, not a hardcoded string", () => {
    render(<CareerTimeline experiences={[]} origins={ORIGINS_FIXTURE} />);
    expect(screen.getByText("Origins")).toBeInTheDocument();
    expect(screen.getByText("1994 – 2006")).toBeInTheDocument();

    const renamed: Origins = { ...ORIGINS_FIXTURE, title: "Before The Résumé", period: "1993 – 2005" };
    const { unmount } = render(<CareerTimeline experiences={[]} origins={renamed} />);
    expect(screen.getByText("Before The Résumé")).toBeInTheDocument();
    expect(screen.getByText("1993 – 2005")).toBeInTheDocument();
    unmount();
  });

  it("links the origins node to #origins, matching the anchor origins chunks and OriginsSection use", () => {
    render(<CareerTimeline experiences={[]} origins={ORIGINS_FIXTURE} />);
    expect(screen.getByRole("link", { name: /origins/i })).toHaveAttribute(
      "href",
      "#origins"
    );
  });

  it("omitting origins reproduces the exact prior node count", () => {
    render(<CareerTimeline experiences={[OLDER, NEWER]} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
