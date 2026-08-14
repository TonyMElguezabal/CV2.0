export const chaptersSectionClass = "mx-auto max-w-3xl px-6 py-24";

export const chapterDetailsClass =
  "group border-b border-hair py-8 first:pt-0 last:border-b-0";

export const chapterSummaryClass =
  "cursor-pointer list-none [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-200";

export const chapterChevronClass =
  "inline-block transition-transform duration-150 group-open:rotate-90";

// This is a per-chapter <h3> (CareerChapters' own section-level <h2> is
// sr-only), so it takes the "chapter/project title" scale step (~20-22px),
// not the "section heading" step — site-typography-and-palette design.md
// Decision 3.
export const chapterHeadingClass =
  "font-display font-bold text-[21px] tracking-[-0.02em] text-balance text-ink";

export const chapterMissionClass =
  "mt-2 text-[17px] leading-[1.68] text-ink-body";

export const chapterDateRangeClass = "mt-1 text-[13px] text-ink-meta";

export const chapterBodyClass = "mt-8 flex flex-col gap-8";

export const chapterSubheadingClass =
  "text-[13px] font-medium uppercase tracking-[0.02em] text-ink-meta";

export const chapterListClass =
  "mt-2 flex flex-col gap-2 text-[17px] leading-[1.68] text-ink-body";

export const chapterParagraphClass =
  "mt-2 text-[17px] leading-[1.68] text-ink-body";

export const chapterTechLinkClass =
  "underline decoration-hair underline-offset-2 hover:text-ink hover:decoration-ink";

export const chapterProjectClass = "flex flex-col gap-1";

export const chapterProjectTitleClass = "font-medium text-ink";
