import { getProfile } from "@/lib/content/read.ts";
import { HeroFramer } from "@/components/HeroFramer";

export default function Home() {
  const profile = getProfile();

  return (
    <main>
      <HeroFramer name={profile.name} positioning={profile.positioning} />
    </main>
  );
}
