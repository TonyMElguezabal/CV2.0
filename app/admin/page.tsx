import type { Metadata } from "next";
import { AdminDashboardShell } from "@/components/AdminDashboardShell";

// Owner-only, dynamic, and gated by middleware.ts — outside the public
// performance budget by design.
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Admin — CareerDNA",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboardShell />;
}
