import {
  checkRateLimit,
  createUpstashRateLimitStore,
} from "../../../lib/chat/rateLimit.ts";

// Reads a runtime secret and the request's client IP, so it must never be
// prerendered at build time, when the secret may be absent.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PER_IP_LIMIT = 10;
const PER_IP_WINDOW_SECONDS = 3600;
const WHATSAPP_NUMBER_PATTERN = /^\d{8,15}$/;

// Never cached by the CDN, never indexed by crawlers.
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

// Own key namespace, so this route never shares or resets the chat and events counters.
// Fails open: a limiter outage or misconfiguration must not block the redirect.
async function isWithinRateLimit(ip: string): Promise<boolean> {
  try {
    const { allowed } = await checkRateLimit(
      createUpstashRateLimitStore(),
      `go-whatsapp:ip:${ip}`,
      PER_IP_LIMIT,
      PER_IP_WINDOW_SECONDS,
    );
    return allowed;
  } catch {
    return true;
  }
}

// The number is read here and written only into the Location header. It is never logged.
export async function GET(request: Request): Promise<Response> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await isWithinRateLimit(ip))) {
    return new Response(null, { status: 429, headers: NO_STORE_HEADERS });
  }

  const whatsappNumber = process.env.WHATSAPP_NUMBER;
  if (!whatsappNumber || !WHATSAPP_NUMBER_PATTERN.test(whatsappNumber)) {
    return new Response(null, { status: 503, headers: NO_STORE_HEADERS });
  }

  return new Response(null, {
    status: 302,
    headers: {
      ...NO_STORE_HEADERS,
      Location: `https://wa.me/${whatsappNumber}`,
    },
  });
}
