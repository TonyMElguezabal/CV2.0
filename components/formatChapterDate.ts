import type { ExperienceDates } from "@/lib/content/types.ts";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

export function formatChapterDateRange(dates: ExperienceDates): string {
  const start = formatMonthYear(dates.start);
  const end = dates.end ? formatMonthYear(dates.end) : "Present";
  return `${start} – ${end}`;
}
