import {
  experienceToTimelineEntry,
  originsToTimelineEntry,
  ORIGINS_TIMELINE_ID,
} from "./timelineEntries";
import type { ExperienceWithId } from "@/lib/content/read.ts";
import type { Origins } from "@/lib/content/types.ts";

const EXPERIENCE: ExperienceWithId = {
  id: "acme",
  company: "Acme",
  role: "Engineer",
  mission: "Test mission.",
  dates: { start: "2018-01", end: "2020-06" },
  context: "Test context.",
  responsibilities: ["Did a thing"],
  projects: [],
  leadership: ["Led a thing"],
  technologies: ["TypeScript"],
  lessons: "Test lesson.",
};

const ORIGINS: Origins = {
  title: "Origins",
  period: "1994 – 2006",
  summary: "Test origins summary.",
  entries: [
    {
      id: "ccej",
      label: "Test entry",
      period: "age 13",
      narrative: "Test narrative.",
    },
  ],
};

describe("experienceToTimelineEntry", () => {
  it("maps an experience's id, company, and formatted date range unchanged", () => {
    const entry = experienceToTimelineEntry(EXPERIENCE);
    expect(entry.id).toBe("acme");
    expect(entry.label).toBe("Acme");
    expect(entry.meta).toBe("Jan 2018 – Jun 2020");
  });

  it("builds an accessible name identical in shape to the pre-existing '{role} at {company}, {dateRange}' format", () => {
    const entry = experienceToTimelineEntry(EXPERIENCE);
    expect(entry.accessibleName).toBe("Engineer at Acme, Jan 2018 – Jun 2020");
  });
});

describe("originsToTimelineEntry", () => {
  it("derives label and meta from the origins record's own content, not hardcoded strings", () => {
    const entry = originsToTimelineEntry(ORIGINS);
    expect(entry.label).toBe(ORIGINS.title);
    expect(entry.meta).toBe(ORIGINS.period);
  });

  it("uses the shared ORIGINS_TIMELINE_ID as its id, matching the OriginsSection anchor", () => {
    const entry = originsToTimelineEntry(ORIGINS);
    expect(entry.id).toBe(ORIGINS_TIMELINE_ID);
    expect(entry.id).toBe("origins");
  });

  it("gives the origins node an accessible name identifying it as the earlier-career record", () => {
    const entry = originsToTimelineEntry(ORIGINS);
    expect(entry.accessibleName.toLowerCase()).toContain("origins");
    expect(entry.accessibleName).toContain(ORIGINS.period);
  });

  it("changes its output when the origins record's title or period changes — nothing hardcoded", () => {
    const renamed: Origins = { ...ORIGINS, title: "Renamed", period: "1990 – 1999" };
    const entry = originsToTimelineEntry(renamed);
    expect(entry.label).toBe("Renamed");
    expect(entry.meta).toBe("1990 – 1999");
  });
});
