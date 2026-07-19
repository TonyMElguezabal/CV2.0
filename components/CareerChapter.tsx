import type { ExperienceWithId } from "@/lib/content/read.ts";
import type { ExperienceDates } from "@/lib/content/types.ts";
import {
  chapterDetailsClass,
  chapterSummaryClass,
  chapterHeadingClass,
  chapterMissionClass,
  chapterDateRangeClass,
  chapterBodyClass,
  chapterSubheadingClass,
  chapterListClass,
  chapterParagraphClass,
  chapterProjectClass,
  chapterProjectTitleClass,
} from "./CareerChaptersStyles";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

function formatChapterDateRange(dates: ExperienceDates): string {
  const start = formatMonthYear(dates.start);
  const end = dates.end ? formatMonthYear(dates.end) : "Present";
  return `${start} – ${end}`;
}

export interface CareerChapterProps {
  experience: ExperienceWithId;
}

export function CareerChapter({ experience }: CareerChapterProps) {
  return (
    <details className={chapterDetailsClass}>
      <summary className={chapterSummaryClass}>
        <h3 className={chapterHeadingClass}>
          {experience.role} at {experience.company}
        </h3>
        <p className={chapterMissionClass}>{experience.mission}</p>
        <p className={chapterDateRangeClass}>
          {formatChapterDateRange(experience.dates)}
        </p>
      </summary>
      <div className={chapterBodyClass}>
        <section>
          <h4 className={chapterSubheadingClass}>Business context</h4>
          <p className={chapterParagraphClass}>{experience.context}</p>
        </section>
        <section>
          <h4 className={chapterSubheadingClass}>Actions</h4>
          <ul className={chapterListClass}>
            {experience.responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className={chapterSubheadingClass}>Projects</h4>
          <div className={chapterListClass}>
            {experience.projects.map((project) => (
              <div key={project.title} className={chapterProjectClass}>
                <p className={chapterProjectTitleClass}>{project.title}</p>
                <p>{project.outcome}</p>
                <ul>
                  {project.metrics.map((metric) => (
                    <li key={metric}>{metric}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h4 className={chapterSubheadingClass}>Leadership</h4>
          <ul className={chapterListClass}>
            {experience.leadership.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className={chapterSubheadingClass}>Technologies</h4>
          <ul className={chapterListClass}>
            {experience.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className={chapterSubheadingClass}>Lessons learned</h4>
          <p className={chapterParagraphClass}>{experience.lessons}</p>
        </section>
      </div>
    </details>
  );
}
