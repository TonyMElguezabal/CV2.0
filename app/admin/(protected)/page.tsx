import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { loadSiteConfig } from "@/lib/site-config/read.ts";
import { createNeonAnalyticsReports } from "@/lib/analytics/reports.ts";

// Owner-only, dynamic, and gated by app/admin/(protected)/layout.tsx's
// session check — outside the public performance budget by design.
// force-dynamic is required: nothing else here (no cookies()/headers()/
// searchParams) signals to Next that this page can't be statically
// prerendered, so without it the reports would get baked in at build time
// instead of queried per request. chapterIds comes from the build-time
// site-config artifact, not getExperiences(), so this page never reads
// /content via node:fs at request time — see
// openspec/changes/cloudflare-deployment-readiness.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — CareerDNA",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const { chapterIds } = await loadSiteConfig();
  const reports = createNeonAnalyticsReports(chapterIds);

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
