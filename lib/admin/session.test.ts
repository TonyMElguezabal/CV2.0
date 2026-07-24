import { createSessionToken, verifySessionToken } from "./session.ts";

const SECRET = "test-signing-secret";

describe("session tokens", () => {
  it("verifies a freshly issued, unexpired token", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe(true);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(token, "wrong-secret")).toBe(false);
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken(SECRET);
    const tampered = token.slice(0, -1) + (token.at(-1) === "a" ? "b" : "a");
    expect(await verifySessionToken(tampered, SECRET)).toBe(false);
  });

  it("rejects a malformed token", async () => {
    expect(await verifySessionToken("not-a-real-token", SECRET)).toBe(false);
    expect(await verifySessionToken("", SECRET)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await createSessionToken(SECRET, -1000);
    expect(await verifySessionToken(token, SECRET)).toBe(false);
  });
});
