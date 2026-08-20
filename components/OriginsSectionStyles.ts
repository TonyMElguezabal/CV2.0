export const originsSectionClass = "mx-auto max-w-3xl px-6 py-24";

export const originsHeadingClass =
  "font-display font-bold text-[clamp(19px,2.2vw,28px)] tracking-[-0.03em] text-balance text-ink";

export const originsSummaryClass =
  "mt-4 max-w-2xl text-[17px] leading-[1.68] text-ink-body";

export const originsBeatClass = "mt-12";

export const originsBeatHeadingClass =
  "text-[13px] font-medium uppercase tracking-[0.02em] text-ink-meta";

export const originsEntryListClass = "mt-6 flex flex-col gap-10";

export const originsEntryClass = "flex flex-col gap-2";

export const originsEntryHeaderClass =
  "flex flex-wrap items-baseline gap-x-2 gap-y-1";

// Same per-item title scale ProjectsSection/CareerChapter use for their
// own titles — see ProjectsSectionStyles.ts's projectTitleClass.
export const originsEntryTitleClass =
  "font-display font-bold text-[21px] tracking-[-0.02em] text-balance text-ink";

export const originsEntryPeriodClass = "text-[13px] text-ink-meta";

export const originsEntryNarrativeClass =
  "text-[17px] leading-[1.68] text-ink-body";

// Deliberately not italic/quoted — the highlight is a plain continuation
// sentence, weighted only by its position after the narrative, not by a
// distinct visual treatment that would compete with the entry title.
export const originsEntryHighlightClass =
  "text-[17px] font-medium leading-[1.68] text-ink";
