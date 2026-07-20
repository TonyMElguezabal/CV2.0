// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { CareerTimeline } from "./CareerTimeline";
import type { ExperienceWithId } from "@/lib/content/read.ts";

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
