import type { ExperienceWithId } from "@/lib/content/read.ts";
import { CareerChapter } from "./CareerChapter";
import { chaptersSectionClass } from "./CareerChaptersStyles";

export interface CareerChaptersProps {
  experiences: ExperienceWithId[];
}

export function CareerChapters({ experiences }: CareerChaptersProps) {
  return (
    <section className={chaptersSectionClass}>
      <h2 className="sr-only">Career</h2>
      {experiences.map((experience) => (
        <CareerChapter key={experience.id} experience={experience} />
      ))}
    </section>
  );
}
