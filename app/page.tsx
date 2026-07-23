import {
  getExperiences,
  getProfile,
  getSkills,
  getProjects,
} from "@/lib/content/read.ts";
import { HeroFramer } from "@/components/HeroFramer";
import { CareerTimeline } from "@/components/CareerTimeline";
import { CareerChapters } from "@/components/CareerChapters";
import { SkillsSection } from "@/components/SkillsSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { ContactSection } from "@/components/ContactSection";

export default function Home() {
  const profile = getProfile();
  const experiences = getExperiences();
  const skills = getSkills();
  const projects = getProjects();

  return (
    <main>
      <HeroFramer name={profile.name} positioning={profile.positioning} />
      <CareerTimeline experiences={experiences} />
      <CareerChapters experiences={experiences} />
      <SkillsSection skills={skills} experiences={experiences} />
      <ProjectsSection projects={projects} />
      <ContactSection contact={profile.contact} links={profile.links} />
    </main>
  );
}
