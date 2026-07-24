import "../globals.css";
import type { Metadata } from "next";
import { SkipToContentLink } from "@/components/SkipToContentLink";
import { resolveSiteUrl } from "@/lib/seo/siteUrl.ts";

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl()),
};

// Independent root layout for the entire /admin subtree — deliberately no
// hero, chat widget, footer, or structured data (the public marketing
// chrome). This is an owner-only internal dashboard, not a page visitors
// should see; it previously inherited that chrome only because Next's App
// Router root layout wraps every page by default. See
// openspec/changes/cloudflare-deployment-readiness (admin-access-gate
// delta: "The admin area does not render public marketing chrome").
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <SkipToContentLink />
        {children}
      </body>
    </html>
  );
}
