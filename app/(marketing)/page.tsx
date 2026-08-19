import {
  getExperiences,
  getProfile,
  getSkills,
  getProjects,
  getOrigins,
} from "@/lib/content/read.ts";
import { HeroFramer } from "@/components/HeroFramer";
import { CareerTimeline } from "@/components/CareerTimeline";
import { CareerChapters } from "@/components/CareerChapters";
import { SkillsSection } from "@/components/SkillsSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { OriginsSection } from "@/components/OriginsSection";
import { ContactSection } from "@/components/ContactSection";

export default function Home() {
  const profile = getProfile();
  const experiences = getExperiences();
  const skills = getSkills();
  const projects = getProjects();
  const origins = getOrigins();

  return (
    <main id="main" tabIndex={-1}>
      <HeroFramer name={profile.name} positioning={profile.positioning} />
      <CareerTimeline experiences={experiences} origins={origins} />
      <CareerChapters experiences={experiences} />
      <SkillsSection skills={skills} experiences={experiences} />
      <ProjectsSection projects={projects} />
      <OriginsSection origins={origins} />
      <ContactSection contact={profile.contact} links={profile.links} />
    </main>
  );
}
