export type DeviceClass = "mobile" | "tablet" | "desktop";

// Vercel sets this header at the edge from GeoIP lookup; the raw IP itself
// is never read or stored here (design.md Decision 2).
export function countryFromHeaders(headers: Headers): string | null {
  return headers.get("x-vercel-ip-country");
}

// Reduces the referrer to its host only — path and query (which can carry
// search terms or tracking params) are discarded.
export function referrerDomainFromHeaders(headers: Headers): string | null {
  const referer = headers.get("referer");
  if (!referer) return null;

  try {
    return new URL(referer).host;
  } catch {
    return null;
  }
}

const TABLET_UA_PATTERN = /iPad|Tablet/i;
const MOBILE_UA_PATTERN = /Mobile|iPhone|Android/i;

// Buckets the User-Agent into one of three low-cardinality classes; the raw
// UA string is never returned or stored. Checked tablet-first since tablet
// UAs (notably iPad) can also match the broader mobile pattern.
export function deviceClassFromUserAgent(
  userAgent: string | null
): DeviceClass {
  if (!userAgent) return "desktop";
  if (TABLET_UA_PATTERN.test(userAgent)) return "tablet";
  if (MOBILE_UA_PATTERN.test(userAgent)) return "mobile";
  return "desktop";
}
