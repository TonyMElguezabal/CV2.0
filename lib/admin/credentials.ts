export interface ExpectedCredentials {
  user: string | undefined;
  pass: string | undefined;
}

// Constant-time compare: folds a byte-by-byte XOR over the longer length
// (padding the shorter side), so the number of matching leading bytes
// never affects how much work is done — no early-exit `===`/`localeCompare`.
// Exported for reuse by lib/admin/session.ts's signature comparison.
export function constantTimeEquals(a: string, b: string): boolean {
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

export function verifyCredentials(
  user: string,
  pass: string,
  expected: ExpectedCredentials,
): boolean {
  // Fail closed: an unconfigured credential must never authenticate.
  if (!expected.user || !expected.pass) {
    return false;
  }

  const userMatches = constantTimeEquals(user, expected.user);
  const passMatches = constantTimeEquals(pass, expected.pass);
  return userMatches && passMatches;
}
