let sessionId: string | undefined;

// A random, in-memory-only identifier for this browser session — never
// persisted (no localStorage/cookies), matching the "nothing persisted
// server-side" privacy constraint (PRD §9). It's a best-effort input to the
// server's per-session rate limit, not an auth/security boundary.
export function getSessionId(): string {
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}
