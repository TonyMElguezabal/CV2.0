import type { ProjectWithId } from "@/lib/content/read.ts";
import {
  projectsSectionClass,
  projectsHeadingClass,
  projectsListClass,
  projectCardClass,
  projectTitleClass,
  projectCompanyClass,
  projectSkillsListClass,
  projectSkillTagClass,
  projectSubheadingClass,
  projectParagraphClass,
  projectMetricsListClass,
} from "./ProjectsSectionStyles";

export interface ProjectsSectionProps {
  projects: ProjectWithId[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section className={projectsSectionClass}>
      <h2 className={projectsHeadingClass}>Projects</h2>
      <div className={projectsListClass}>
        {projects.map((project) => (
          <article key={project.id} id={project.id} className={projectCardClass}>
            <div>
              <h3 className={projectTitleClass}>{project.title}</h3>
              <p className={projectCompanyClass}>{project.company}</p>
              <ul className={projectSkillsListClass}>
                {project.skills.map((skill) => (
                  <li key={skill} className={projectSkillTagClass}>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
            <section>
              <h4 className={projectSubheadingClass}>Problem</h4>
              <p className={projectParagraphClass}>{project.problem}</p>
            </section>
            <section>
              <h4 className={projectSubheadingClass}>Approach</h4>
              <p className={projectParagraphClass}>{project.approach}</p>
            </section>
            <section>
              <h4 className={projectSubheadingClass}>Outcome</h4>
              <p className={projectParagraphClass}>{project.outcome}</p>
            </section>
            <section>
              <h4 className={projectSubheadingClass}>Metrics</h4>
              <ul className={projectMetricsListClass}>
                {project.metrics.map((metric) => (
                  <li key={metric}>{metric}</li>
                ))}
              </ul>
            </section>
          </article>
        ))}
      </div>
    </section>
  );
}
