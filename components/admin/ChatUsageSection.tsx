import type { ChatUsageReport } from "@/lib/analytics/reports.ts";
import { StatCard } from "./StatCard";
import { adminSectionClass, adminSectionHeadingClass, adminStatGridClass } from "./adminStyles";

export interface ChatUsageSectionProps {
  report: ChatUsageReport;
}

export function ChatUsageSection({ report }: ChatUsageSectionProps) {
  return (
    <section className={adminSectionClass} aria-labelledby="chat-heading">
      <h2 id="chat-heading" className={adminSectionHeadingClass}>
        Chat usage
      </h2>
      <div className={adminStatGridClass}>
        <StatCard
          label="Sessions that opened chat"
          value={report.chatOpenSessionCount.toLocaleString()}
        />
        <StatCard
          label="Share of sessions"
          value={`${Math.round(report.chatOpenShare * 100)}%`}
        />
        <StatCard
          label="Questions asked"
          value={report.questionAskedCount.toLocaleString()}
        />
      </div>
    </section>
  );
}
