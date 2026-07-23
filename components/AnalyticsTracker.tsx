"use client";

import { useEffect } from "react";
import { track } from "../lib/analytics/track.ts";

// Sections carrying a real anchor id are the ones worth tracking as scroll
// milestones (experience chapters, the contact section, project cards) —
// their nested "-projects" sub-lists aren't independent navigation targets,
// so they're excluded here to avoid noisy duplicate milestones.
const SECTION_SELECTOR = "main [id]";
const NOISY_ID_SUFFIX = "-projects";

export function AnalyticsTracker() {
  useEffect(() => {
    track({ eventType: "page_view", pagePath: window.location.pathname });

    const reachedSectionIds = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const sectionId = (entry.target as HTMLElement).id;
          if (!sectionId || reachedSectionIds.has(sectionId)) continue;

          reachedSectionIds.add(sectionId);
          const scrollDepthPercent = Math.round(
            (entry.target.getBoundingClientRect().top /
              document.documentElement.scrollHeight) *
              100
          );

          track({
            eventType: "section_reach",
            pagePath: window.location.pathname,
            sectionId,
            scrollDepthPercent: Math.max(0, Math.min(100, scrollDepthPercent)),
          });
        }
      },
      { threshold: 0.5 }
    );

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(SECTION_SELECTOR)
    ).filter((el) => !el.id.endsWith(NOISY_ID_SUFFIX));

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
