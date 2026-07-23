import { readFileSync } from "node:fs";
import { join } from "node:path";

// The chat route streams tokens to the client and never writes anywhere —
// chat_open/question_asked analytics are fired client-side as count-only
// events with no question text (see lib/analytics/track.ts), never from
// this route. This is a structural regression guard: it fails if a future
// change adds any database/analytics write to the chat route, which would
// risk persisting conversation content server-side (PRD §9, AC5).
const routeSource = readFileSync(
  join(process.cwd(), "app/api/chat/route.ts"),
  "utf8",
);

const PERSISTENCE_MARKERS = [
  "recordEvent",
  "AnalyticsStore",
  "createNeonAnalyticsStore",
  "@neondatabase/serverless",
  "lib/analytics/store",
  "INSERT INTO",
  "DATABASE_URL",
];

describe("POST /api/chat persists nothing", () => {
  it("imports no persistence/database collaborator", () => {
    for (const marker of PERSISTENCE_MARKERS) {
      expect(routeSource).not.toContain(marker);
    }
  });

  it("the only store referenced is the rate-limit store, not a content store", () => {
    expect(routeSource).toContain("createUpstashRateLimitStore");
    expect(routeSource).not.toMatch(/\bwrite\(|\.insert\(|\.save\(/);
  });
});
