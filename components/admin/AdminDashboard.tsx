import type {
  ChatUsageReport,
  ConversionsReport,
  EngagementReport,
  TrafficReport,
} from "@/lib/analytics/reports.ts";
import { ChatUsageSection } from "./ChatUsageSection";
import { ConversionsSection } from "./ConversionsSection";
import { EmptyState } from "./EmptyState";
import { EngagementSection } from "./EngagementSection";
import { TrafficSection } from "./TrafficSection";
import { adminHeadingClass, adminShellClass } from "./adminStyles";

export interface AdminDashboardProps {
  traffic: TrafficReport;
  engagement: EngagementReport;
  chat: ChatUsageReport;
  conversions: ConversionsReport;
}

function isEmpty(props: AdminDashboardProps): boolean {
  return (
    props.traffic.pageViewCount === 0 &&
    props.chat.questionAskedCount === 0 &&
    props.chat.chatOpenSessionCount === 0 &&
    props.conversions.resumeDownloadCount === 0 &&
    Object.values(props.conversions.contactClicksByTarget).every(
      (count) => count === 0,
    )
  );
}

export function AdminDashboard(props: AdminDashboardProps) {
  return (
    <main id="main" tabIndex={-1} className={adminShellClass}>
      <h1 className={adminHeadingClass}>Insights</h1>
      {isEmpty(props) ? (
        <EmptyState />
      ) : (
        <>
          <TrafficSection report={props.traffic} />
          <EngagementSection report={props.engagement} />
          <ChatUsageSection report={props.chat} />
          <ConversionsSection report={props.conversions} />
        </>
      )}
    </main>
  );
}
