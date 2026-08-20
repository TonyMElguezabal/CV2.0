import type { Origins, OriginEntry } from "@/lib/content/types.ts";
import { RevealHeading } from "./RevealHeading";
import { SectionReveal } from "./SectionReveal";
import {
  originsSectionClass,
  originsHeadingClass,
  originsSummaryClass,
  originsBeatClass,
  originsBeatHeadingClass,
  originsEntryListClass,
  originsEntryClass,
  originsEntryHeaderClass,
  originsEntryTitleClass,
  originsEntryPeriodClass,
  originsEntryNarrativeClass,
  originsEntryHighlightClass,
} from "./OriginsSectionStyles";

export interface OriginsSectionProps {
  origins: Origins;
}

function OriginsEntryItem({ entry }: { entry: OriginEntry }) {
  return (
    <SectionReveal as="article" id={entry.id} className={originsEntryClass}>
      <div className={originsEntryHeaderClass}>
        <h3 className={originsEntryTitleClass}>
          {entry.label}
          {entry.organization ? ` — ${entry.organization}` : ""}
        </h3>
        <span className={originsEntryPeriodClass}>{entry.period}</span>
      </div>
      <p className={originsEntryNarrativeClass}>{entry.narrative}</p>
      {entry.highlight && (
        <p className={originsEntryHighlightClass}>{entry.highlight}</p>
      )}
    </SectionReveal>
  );
}

// Groups entries by their authored `phase` into the record's two-beat
// structure — self-taught, then formal — per design.md Decision 3 in
// openspec/changes/origins-earlier-career. An entry with no `phase` falls
// into neither beat and renders under the fallback "More" group, so a
// future entry authored without a phase is never silently dropped from the
// page.
function groupByPhase(entries: OriginEntry[]) {
  const selfTaught = entries.filter((entry) => entry.phase === "self-taught");
  const formal = entries.filter((entry) => entry.phase === "formal");
  const unphased = entries.filter((entry) => !entry.phase);
  return { selfTaught, formal, unphased };
}

export function OriginsSection({ origins }: OriginsSectionProps) {
  const { selfTaught, formal, unphased } = groupByPhase(origins.entries);

  return (
    <section id="origins" className={originsSectionClass}>
      <RevealHeading as="h2" className={originsHeadingClass} text={origins.title} />
      <p className={originsSummaryClass}>{origins.summary}</p>

      {selfTaught.length > 0 && (
        <div className={originsBeatClass}>
          <h3 className={originsBeatHeadingClass}>The self-taught years</h3>
          <div className={originsEntryListClass}>
            {selfTaught.map((entry) => (
              <OriginsEntryItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {formal.length > 0 && (
        <div className={originsBeatClass}>
          <h3 className={originsBeatHeadingClass}>The formal years</h3>
          <div className={originsEntryListClass}>
            {formal.map((entry) => (
              <OriginsEntryItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {unphased.length > 0 && (
        <div className={originsBeatClass}>
          <h3 className={originsBeatHeadingClass}>More</h3>
          <div className={originsEntryListClass}>
            {unphased.map((entry) => (
              <OriginsEntryItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
