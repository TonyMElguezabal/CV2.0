import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getExperiences } from "@/lib/content/read.ts";
import { createNeonAnalyticsReports } from "@/lib/analytics/reports.ts";

// Owner-only, dynamic, and gated by proxy.ts — outside the public
// performance budget by design. force-dynamic is required: nothing else
// here (no cookies()/headers()/searchParams) signals to Next that this
// page can't be statically prerendered, so without it the reports would
// get baked in at build time instead of queried per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — CareerDNA",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const orderedChapterIds = getExperiences().map((experience) => experience.id);
  const reports = createNeonAnalyticsReports(orderedChapterIds);

  const [traffic, engagement, chat, conversions] = await Promise.all([
    reports.getTrafficReport(),
    reports.getEngagementReport(),
    reports.getChatUsageReport(),
    reports.getConversionsReport(),
  ]);

  return (
    <AdminDashboard
      traffic={traffic}
      engagement={engagement}
      chat={chat}
      conversions={conversions}
    />
  );
}
