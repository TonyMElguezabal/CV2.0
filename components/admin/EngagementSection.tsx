import type { EngagementReport } from "@/lib/analytics/reports.ts";
import { StatCard } from "./StatCard";
import { TrendBarList } from "./TrendBarList";
import {
  adminSectionClass,
  adminSectionHeadingClass,
  adminStatGridClass,
} from "./adminStyles";

export interface EngagementSectionProps {
  report: EngagementReport;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function EngagementSection({ report }: EngagementSectionProps) {
  return (
    <section
      className={adminSectionClass}
      aria-labelledby="engagement-heading"
    >
      <h2 id="engagement-heading" className={adminSectionHeadingClass}>
        Engagement depth
      </h2>
      <div className={adminStatGridClass}>
        <StatCard
          label="Median session duration"
          value={formatDuration(report.medianSessionDurationSeconds)}
        />
        <StatCard
          label="Reached 2nd chapter"
          value={`${Math.round(report.secondChapterReachShare * 100)}%`}
        />
      </div>
      <TrendBarList
        rows={report.scrollDepthDistribution.map((point) => ({
          label: `${point.milestone}%`,
          value: point.sessionCount,
        }))}
      />
    </section>
  );
}
