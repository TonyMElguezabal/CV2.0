import type { TrafficReport } from "@/lib/analytics/reports.ts";
import { StatCard } from "./StatCard";
import { TrendBarList } from "./TrendBarList";
import {
  adminSectionClass,
  adminSectionHeadingClass,
  adminStatGridClass,
} from "./adminStyles";

export interface TrafficSectionProps {
  report: TrafficReport;
}

export function TrafficSection({ report }: TrafficSectionProps) {
  return (
    <section className={adminSectionClass} aria-labelledby="traffic-heading">
      <h2 id="traffic-heading" className={adminSectionHeadingClass}>
        Traffic
      </h2>
      <div className={adminStatGridClass}>
        <StatCard
          label="Page views"
          value={report.pageViewCount.toLocaleString()}
        />
        <StatCard
          label="Unique sessions"
          value={report.uniqueSessionCount.toLocaleString()}
        />
      </div>
      <TrendBarList
        rows={report.dailyTrend.map((point) => ({
          label: point.date,
          value: point.pageViews,
        }))}
      />
    </section>
  );
}
