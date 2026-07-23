export interface ExpectedCredentials {
  user: string | undefined;
  pass: string | undefined;
}

// Constant-time compare: folds a byte-by-byte XOR over the longer length
// (padding the shorter side), so the number of matching leading bytes
// never affects how much work is done — no early-exit `===`/`localeCompare`.
function constantTimeEquals(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bytesA = encoder.encode(a);
  const bytesB = encoder.encode(b);
  const length = Math.max(bytesA.length, bytesB.length);

  let diff = bytesA.length === bytesB.length ? 0 : 1;
  for (let i = 0; i < length; i++) {
    diff |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  }
  return diff === 0;
}

// Runtime-agnostic base64 decode (works on the Edge middleware runtime,
// Node, and in vitest) — no `Buffer`, no `node:crypto`.
function decodeBase64(value: string): string | null {
  try {
    return atob(value);
  } catch {
    return null;
  }
}

export function verifyBasicAuth(
  authHeader: string | null | undefined,
  expected: ExpectedCredentials,
): boolean {
  // Fail closed: an unconfigured credential must never authenticate.
  if (!expected.user || !expected.pass) {
    return false;
  }
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const encoded = authHeader.slice("Basic ".length);
  const decoded = decodeBase64(encoded);
  if (decoded === null) {
    return false;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return false;
  }

  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  const userMatches = constantTimeEquals(user, expected.user);
  const passMatches = constantTimeEquals(pass, expected.pass);
  return userMatches && passMatches;
}
