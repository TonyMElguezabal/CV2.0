import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyBasicAuth } from "./lib/admin/basicAuth.ts";
import { checkRateLimit, createUpstashRateLimitStore } from "./lib/chat/rateLimit.ts";

export const config = {
  matcher: ["/admin/:path*"],
};

const PER_IP_LIMIT = 30;
const PER_IP_WINDOW_SECONDS = 5 * 60;

function unauthorizedResponse(): NextResponse {
  return new NextResponse(null, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

// Proxy (Next 16's renamed "middleware") always runs on the Node.js
// runtime, which is why this can safely depend on @upstash/redis (via
// lib/chat/rateLimit.ts) — that package uses process.version internally,
// unsupported on the old middleware Edge runtime. See
// https://nextjs.org/docs/messages/middleware-to-proxy
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const store = createUpstashRateLimitStore();
  const { allowed } = await checkRateLimit(
    store,
    `admin:${ip}`,
    PER_IP_LIMIT,
    PER_IP_WINDOW_SECONDS,
  );
  if (!allowed) {
    return new NextResponse(null, { status: 429 });
  }

  const authorized = verifyBasicAuth(request.headers.get("authorization"), {
    user: process.env.ADMIN_USER,
    pass: process.env.ADMIN_PASSWORD,
  });
  if (!authorized) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}
