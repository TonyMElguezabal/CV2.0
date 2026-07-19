import { getExperiences, getProfile } from "@/lib/content/read.ts";
import { HeroFramer } from "@/components/HeroFramer";
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
      <CareerChapters experiences={experiences} />
    </main>
  );
}
