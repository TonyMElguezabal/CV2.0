"use client";

import type { Profile } from "@/lib/content/types.ts";
import { useChatWidget } from "./ChatWidgetContext";
import {
  ctaRowClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "./HeroShellStyles";

export interface HeroCtasProps {
  profile: Pick<Profile, "contact">;
}

export function HeroCtas({ profile }: HeroCtasProps) {
  const { openChat } = useChatWidget();

  return (
    <div className={ctaRowClass}>
      <a href="#hero-next" className={ctaPrimaryClass}>
        Scroll to explore ↓
      </a>
      <button type="button" onClick={openChat} className={ctaSecondaryClass}>
        Ask AI
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
