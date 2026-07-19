import type { Profile } from "@/lib/content/types.ts";
import {
  ctaRowClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
  ctaDisabledClass,
} from "./HeroShellStyles";

export interface HeroCtasProps {
  profile: Pick<Profile, "contact">;
}

export function HeroCtas({ profile }: HeroCtasProps) {
  return (
    <div className={ctaRowClass}>
      <a href="#hero-next" className={ctaPrimaryClass}>
        Scroll to explore ↓
      </a>
      <button type="button" disabled className={ctaDisabledClass}>
        Ask AI — coming soon
      </button>
      <a href="/resume.pdf" download className={ctaSecondaryClass}>
        Download résumé
      </a>
      <a href={`mailto:${profile.contact.email}`} className={ctaSecondaryClass}>
        Contact
      </a>
    </div>
  );
}
