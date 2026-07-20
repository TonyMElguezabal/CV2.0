import { getExperiences, getProfile, getSkills } from "@/lib/content/read.ts";
import { HeroFramer } from "@/components/HeroFramer";
import { CareerTimeline } from "@/components/CareerTimeline";
import { CareerChapters } from "@/components/CareerChapters";
import { SkillsSection } from "@/components/SkillsSection";

export default function Home() {
  const profile = getProfile();
  const experiences = getExperiences();
  const skills = getSkills();

  return (
    <main>
      <HeroFramer
        name={profile.name}
        positioning={profile.positioning}
        profile={profile}
      />
      <CareerTimeline experiences={experiences} />
      <CareerChapters experiences={experiences} />
      <SkillsSection skills={skills} experiences={experiences} />
    </main>
  );
}
