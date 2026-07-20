"use client";

import { useEffect, useState } from "react";
import type { ExperienceWithId } from "@/lib/content/read.ts";
import { formatChapterDateRange } from "./formatChapterDate";
import {
  timelineNavClass,
  timelineListClass,
  timelineNodeClass,
  timelineCompanyClass,
  timelineDateClass,
} from "./CareerTimelineStyles";

export interface CareerTimelineProps {
  experiences: ExperienceWithId[];
}

// A reading-line band through the upper-middle of the viewport (20%-65%
// down) — the chapter passing through it reads as current. The
// short-trailing-content edge case (a chapter that can rest below even
// this band's reach, because the page can't scroll any further) is handled
// separately below via a plain scroll check, not by widening this band
// further — see design.md decisions in
// openspec/changes/career-timeline-scroll-indicator.
const ACTIVE_CHAPTER_ROOT_MARGIN = "-20% 0px -35% 0px";

function isScrolledToBottom(): boolean {
  return (
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 2
  );
}

export function CareerTimeline({ experiences }: CareerTimelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = experiences
      .map((experience) => document.getElementById(experience.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      return;
    }

    const intersectingIds = new Set<string>();

    // Both the observer callback and the scroll listener below call this —
    // neither ever sets state independently — so "at bottom" wins
    // deterministically no matter which one fires last for a given scroll
    // gesture, instead of racing to overwrite each other.
    function updateActiveId() {
      if (isScrolledToBottom()) {
        const last = experiences[experiences.length - 1];
        if (last) {
          setActiveId(last.id);
        }
        return;
      }

      const current = experiences.find((experience) =>
        intersectingIds.has(experience.id)
      );
      if (current) {
        setActiveId(current.id);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectingIds.add(entry.target.id);
          } else {
            intersectingIds.delete(entry.target.id);
          }
        });
        updateActiveId();
      },
      { rootMargin: ACTIVE_CHAPTER_ROOT_MARGIN }
    );

    elements.forEach((el) => observer.observe(el));

    // IntersectionObserver callbacks only fire on a state *change* — on a
    // short page, a short trailing chapter's rect can sit entirely below
    // the reading-line band for the page's *entire* scrollable range, so
    // its intersection state never changes and the observer callback above
    // never runs for it at all. A plain scroll check is the only reliable
    // way to detect "reached the bottom of the page" independent of
    // whether any observed element's band membership ever changed; kept
    // intentionally minimal (one cheap comparison, no debouncing) since the
    // shared decision function above is cheap and idempotent.
    window.addEventListener("scroll", updateActiveId, { passive: true });
    updateActiveId();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActiveId);
    };
  }, [experiences]);

  if (experiences.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Career timeline" className={timelineNavClass}>
      <ol className={timelineListClass}>
        {experiences.map((experience) => {
          const dateRange = formatChapterDateRange(experience.dates);
          const isActive = experience.id === activeId;
          return (
            <li key={experience.id}>
              <a
                href={`#${experience.id}`}
                aria-label={`${experience.role} at ${experience.company}, ${dateRange}`}
                aria-current={isActive ? "location" : undefined}
                className={timelineNodeClass}
              >
                <span aria-hidden="true" className={timelineCompanyClass}>
                  {experience.company}
                </span>
                <span aria-hidden="true" className={timelineDateClass}>
                  {dateRange}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
