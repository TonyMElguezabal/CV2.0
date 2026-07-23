import { EventPayloadSchema } from "../../../lib/analytics/schema.ts";
import type { StoredEvent } from "../../../lib/analytics/schema.ts";
import {
  countryFromHeaders,
  referrerDomainFromHeaders,
  deviceClassFromUserAgent,
} from "../../../lib/analytics/derive.ts";
import { createNeonAnalyticsStore } from "../../../lib/analytics/store.ts";
import { checkRateLimit, createUpstashRateLimitStore } from "../../../lib/chat/rateLimit.ts";

// Reads request headers for anonymization, so this can't be static.
export const runtime = "nodejs";

const PER_IP_LIMIT = 60;
const PER_IP_WINDOW_SECONDS = 60;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const parsed = EventPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid event" }, 400);
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimitStore = createUpstashRateLimitStore();
  const { allowed } = await checkRateLimit(
    rateLimitStore,
    `ip:${ip}`,
    PER_IP_LIMIT,
    PER_IP_WINDOW_SECONDS,
  );
  if (!allowed) {
    return jsonResponse({ error: "rate_limited" }, 429);
  }

  const storedEvent: StoredEvent = {
    ...parsed.data,
    occurredAt: new Date(),
    countryOrRegion: countryFromHeaders(request.headers),
    referrerDomain: referrerDomainFromHeaders(request.headers),
    deviceClass: deviceClassFromUserAgent(request.headers.get("user-agent")),
  };

  const store = createNeonAnalyticsStore();
  await store.recordEvent(storedEvent);

  return new Response(null, { status: 204 });
}
