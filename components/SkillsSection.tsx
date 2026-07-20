import type { ExperienceWithId } from "@/lib/content/read.ts";
import type { Skill } from "@/lib/content/types.ts";
import {
  skillsSectionClass,
  skillsHeadingClass,
  skillsListClass,
  skillItemClass,
  skillNameClass,
  skillEvidenceListClass,
  skillEvidenceLinkClass,
} from "./SkillsSectionStyles";

export interface SkillsSectionProps {
  skills: Skill[];
  experiences: ExperienceWithId[];
}

export function SkillsSection({ skills, experiences }: SkillsSectionProps) {
  const experienceById = new Map(
    experiences.map((experience) => [experience.id, experience])
  );

  return (
    <section className={skillsSectionClass}>
      <h2 className={skillsHeadingClass}>Skills</h2>
      <ul className={skillsListClass}>
        {skills.map((skill) => (
          <li key={skill.name} className={skillItemClass}>
            <span className={skillNameClass}>{skill.name}</span>
            <span className={skillEvidenceListClass}>
              {skill.evidence.map((evidenceId) => {
                const experience = experienceById.get(evidenceId);
                if (!experience) {
                  return null;
                }
                return (
                  <a
                    key={evidenceId}
                    href={`#${evidenceId}-projects`}
                    aria-label={`${skill.name} — evidenced by ${experience.role} at ${experience.company}`}
                    className={skillEvidenceLinkClass}
                  >
                    {experience.company}
                  </a>
                );
              })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
