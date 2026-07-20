import type { ExperienceWithId } from "@/lib/content/read.ts";
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
  chapterChevronClass,
  chapterTechLinkClass,
} from "./CareerChaptersStyles";
import { formatChapterDateRange } from "./formatChapterDate";

export interface CareerChapterProps {
  experience: ExperienceWithId;
}

export function CareerChapter({ experience }: CareerChapterProps) {
  return (
    <details id={experience.id} className={chapterDetailsClass}>
      <summary className={chapterSummaryClass}>
        <h3 className={chapterHeadingClass}>
          <span aria-hidden="true" className={chapterChevronClass}>
            ▸
          </span>{" "}
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
        <section id={`${experience.id}-projects`}>
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
                {project.projectId && (
                  <a
                    href={`#${project.projectId}`}
                    className={chapterTechLinkClass}
                  >
                    View full project
                  </a>
                )}
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
              <li key={tech}>
                <a
                  href={`#${experience.id}-projects`}
                  className={chapterTechLinkClass}
                >
                  {tech}
                  <span className="sr-only"> — jump to Projects</span>
                </a>
              </li>
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
