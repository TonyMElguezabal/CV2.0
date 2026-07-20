import type { ExperienceWithId } from "@/lib/content/read.ts";
import { formatChapterDateRange } from "./formatChapterDate";
import {
  timelineNavClass,
  timelineListClass,
  timelineNodeClass,
  timelineCompanyClass,
  timelineDateClass,
} from "./CareerTimelineStyles";

export interface CareerTimelineProps {
  experiences: ExperienceWithId[];
}

export function CareerTimeline({ experiences }: CareerTimelineProps) {
  if (experiences.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Career timeline" className={timelineNavClass}>
      <ol className={timelineListClass}>
        {experiences.map((experience) => {
          const dateRange = formatChapterDateRange(experience.dates);
          return (
            <li key={experience.id}>
              <a
                href={`#${experience.id}`}
                aria-label={`${experience.role} at ${experience.company}, ${dateRange}`}
                className={timelineNodeClass}
              >
                <span aria-hidden="true" className={timelineCompanyClass}>
                  {experience.company}
                </span>
                <span aria-hidden="true" className={timelineDateClass}>
                  {dateRange}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
