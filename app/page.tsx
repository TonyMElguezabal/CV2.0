import { getExperiences, getProfile } from "@/lib/content/read.ts";
import { HeroFramer } from "@/components/HeroFramer";
import { CareerTimeline } from "@/components/CareerTimeline";
import { CareerChapters } from "@/components/CareerChapters";

export default function Home() {
  const profile = getProfile();
  const experiences = getExperiences();

  return (
    <main>
      <HeroFramer
        name={profile.name}
        positioning={profile.positioning}
        profile={profile}
      />
      <CareerTimeline experiences={experiences} />
      <CareerChapters experiences={experiences} />
    </main>
  );
}
