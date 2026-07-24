import { constantTimeEquals } from "./credentials.ts";

// Web Crypto's `crypto.subtle` — not `node:crypto` — so this runs
// identically on Cloudflare Workers, Node, and in tests, matching
// credentials.ts's runtime-agnostic convention.

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionPayload {
  expiresAt: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return base64UrlEncode(new Uint8Array(signature));
}

// `durationMs` defaults to 7 days; overridable for tests (including
// negative values, to produce an already-expired token).
export async function createSessionToken(
  secret: string,
  durationMs: number = SEVEN_DAYS_MS,
): Promise<string> {
  const payload: SessionPayload = { expiresAt: Date.now() + durationMs };
  const payloadB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await hmacSign(secret, payloadB64);
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const separatorIndex = token.indexOf(".");
  if (separatorIndex === -1) {
    return false;
  }

  const payloadB64 = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = await hmacSign(secret, payloadB64);
  if (!constantTimeEquals(signature, expectedSignature)) {
    return false;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadB64)),
    );
  } catch {
    return false;
  }

  return (
    typeof payload.expiresAt === "number" && Date.now() < payload.expiresAt
  );
}
