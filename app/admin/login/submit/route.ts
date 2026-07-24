import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyCredentials } from "@/lib/admin/credentials.ts";
import { createSessionToken } from "@/lib/admin/session.ts";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin/sessionCookie.ts";
import { checkRateLimit, createUpstashRateLimitStore } from "@/lib/chat/rateLimit.ts";

export const runtime = "nodejs";

// Same limit/window proxy.ts previously applied to every /admin/:path*
// request; now scoped to login attempts specifically.
const PER_IP_LIMIT = 30;
const PER_IP_WINDOW_SECONDS = 5 * 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const store = createUpstashRateLimitStore();
  const { allowed } = await checkRateLimit(
    store,
    `admin-login:${ip}`,
    PER_IP_LIMIT,
    PER_IP_WINDOW_SECONDS,
  );
  if (!allowed) {
    return new NextResponse(null, { status: 429 });
  }

  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const secret = process.env.ADMIN_PASSWORD;
  const authorized =
    !!secret &&
    verifyCredentials(username, password, {
      user: process.env.ADMIN_USER,
      pass: process.env.ADMIN_PASSWORD,
    });

  if (!authorized) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
  }

  const token = await createSessionToken(secret);
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
