// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { CareerChapters } from "./CareerChapters";
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

describe("CareerChapters", () => {
  it("renders one chapter per experience passed in, scaling to any count", () => {
    render(<CareerChapters experiences={[NEWER, OLDER]} />);
    expect(screen.getAllByRole("group")).toHaveLength(2);
  });

  it("renders each chapter's collapsed summary with role, company, mission, and formatted date range", () => {
    render(<CareerChapters experiences={[OLDER]} />);
    expect(screen.getByText("Engineer at Acme")).toBeInTheDocument();
    expect(screen.getByText("Older mission statement.")).toBeInTheDocument();
    expect(screen.getByText("Jan 2018 – Jun 2020")).toBeInTheDocument();
  });

  it("formats an ongoing chapter's date range with an open end as 'Present'", () => {
    render(<CareerChapters experiences={[NEWER]} />);
    expect(screen.getByText("Jan 2021 – Present")).toBeInTheDocument();
  });

  it("renders each chapter as a native <details> element, collapsed by default", () => {
    render(<CareerChapters experiences={[OLDER]} />);
    const details = screen.getByRole("group");
    expect(details.tagName).toBe("DETAILS");
    expect((details as HTMLDetailsElement).open).toBe(false);
  });

  it("gives each chapter's <details> element an id matching its experience id, so it is a valid navigation target", () => {
    render(<CareerChapters experiences={[OLDER, NEWER]} />);
    const [olderDetails, newerDetails] = screen.getAllByRole("group");
    expect(olderDetails).toHaveAttribute("id", "acme");
    expect(newerDetails).toHaveAttribute("id", "beta");
  });

  it("expands to render all seven §F3 elements in order when the summary is activated", () => {
    render(<CareerChapters experiences={[OLDER]} />);
    const details = screen.getByRole("group");
    const summary = within(details).getByText("Engineer at Acme").closest("summary")!;
    fireEvent.click(summary);

    expect((details as HTMLDetailsElement).open).toBe(true);

    const headings = within(details).getAllByRole("heading");
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts).toEqual([
      "▸ Engineer at Acme",
      "Business context",
      "Actions",
      "Projects",
      "Leadership",
      "Technologies",
      "Lessons learned",
    ]);

    expect(within(details).getByText("Older context.")).toBeInTheDocument();
    expect(within(details).getByText("Did an older thing")).toBeInTheDocument();
    expect(within(details).getByText("Older project")).toBeInTheDocument();
    expect(within(details).getByText("50% improvement")).toBeInTheDocument();
    expect(within(details).getByText("Led an older thing")).toBeInTheDocument();
    expect(within(details).getByText("JavaScript")).toBeInTheDocument();
    expect(within(details).getByText("Older lesson.")).toBeInTheDocument();
  });
});
