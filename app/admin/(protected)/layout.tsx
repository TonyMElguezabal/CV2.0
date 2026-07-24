import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/admin/session.ts";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/sessionCookie.ts";

// Gates every route under app/admin/(protected)/ behind a valid session —
// replaces proxy.ts's HTTP Basic Auth challenge (unsupported by the
// Cloudflare adapter's OpenNext build; see
// openspec/changes/cloudflare-deployment-readiness). Sits inside
// app/admin/layout.tsx's independent root layout; app/admin/login stays
// outside this group so it's reachable without a session.
export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_PASSWORD;

  const authenticated =
    !!token && !!secret && (await verifySessionToken(token, secret));

  if (!authenticated) {
    redirect("/admin/login");
  }

  return children;
}
