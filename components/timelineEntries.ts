import type { ExperienceWithId } from "@/lib/content/read.ts";
import type { Origins } from "@/lib/content/types.ts";
import { formatChapterDateRange } from "./formatChapterDate";

// The rail's uniform per-node shape (origins-earlier-career design.md
// Decision 4) — `id` is what's observed and linked to, `label`/`meta` are
// the two aria-hidden spans the rail already renders, `accessibleName` is
// the full aria-label text. `CareerTimeline` renders this shape only; it
// never branches on which content source produced an entry, so origins
// joining the rail is a change to what feeds the component, not to how it
// behaves.
export interface TimelineEntry {
  id: string;
  label: string;
  meta: string;
  accessibleName: string;
}

export function experienceToTimelineEntry(
  experience: ExperienceWithId,
): TimelineEntry {
  const dateRange = formatChapterDateRange(experience.dates);
  return {
    id: experience.id,
    label: experience.company,
    meta: dateRange,
    accessibleName: `${experience.role} at ${experience.company}, ${dateRange}`,
  };
}

// Matches the anchor origins chunks use in lib/content/chunk.ts (`#origins`)
// and OriginsSection's root `id` — the one place this id is decided.
export const ORIGINS_TIMELINE_ID = "origins";

export function originsToTimelineEntry(origins: Origins): TimelineEntry {
  return {
    id: ORIGINS_TIMELINE_ID,
    label: origins.title,
    meta: origins.period,
    accessibleName: `${origins.title} — earlier career, ${origins.period}`,
  };
}
