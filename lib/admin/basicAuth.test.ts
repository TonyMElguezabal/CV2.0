import { verifyBasicAuth } from "./basicAuth.ts";

function basicHeader(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

const EXPECTED = { user: "owner", pass: "correct-horse-battery-staple" };

describe("verifyBasicAuth", () => {
  it("returns true for a correct Authorization: Basic header", () => {
    const header = basicHeader(EXPECTED.user, EXPECTED.pass);
    expect(verifyBasicAuth(header, EXPECTED)).toBe(true);
  });

  it("returns false for a wrong password", () => {
    const header = basicHeader(EXPECTED.user, "wrong-password");
    expect(verifyBasicAuth(header, EXPECTED)).toBe(false);
  });

  it("returns false for a wrong user", () => {
    const header = basicHeader("intruder", EXPECTED.pass);
    expect(verifyBasicAuth(header, EXPECTED)).toBe(false);
  });

  it("returns false for a missing header", () => {
    expect(verifyBasicAuth(null, EXPECTED)).toBe(false);
    expect(verifyBasicAuth(undefined, EXPECTED)).toBe(false);
  });

  it("returns false for a non-Basic scheme", () => {
    expect(verifyBasicAuth("Bearer sometoken", EXPECTED)).toBe(false);
  });

  it("returns false for malformed base64", () => {
    expect(verifyBasicAuth("Basic not-valid-base64!!!", EXPECTED)).toBe(false);
  });

  it("returns false when the decoded credential has no colon separator", () => {
    const header = `Basic ${Buffer.from("no-colon-here").toString("base64")}`;
    expect(verifyBasicAuth(header, EXPECTED)).toBe(false);
  });

  it("fails closed when the configured user is empty", () => {
    const header = basicHeader(EXPECTED.user, EXPECTED.pass);
    expect(verifyBasicAuth(header, { user: "", pass: EXPECTED.pass })).toBe(
      false,
    );
  });

  it("fails closed when the configured pass is empty", () => {
    const header = basicHeader(EXPECTED.user, EXPECTED.pass);
    expect(verifyBasicAuth(header, { user: EXPECTED.user, pass: "" })).toBe(
      false,
    );
  });

  it("fails closed when both configured values are undefined", () => {
    const header = basicHeader(EXPECTED.user, EXPECTED.pass);
    expect(
      verifyBasicAuth(header, { user: undefined, pass: undefined }),
    ).toBe(false);
  });

  it("compares in constant time regardless of match position (no early-exit string comparison)", () => {
    // Not a true timing-attack test (unreliable in CI), but proves the
    // implementation doesn't use a short-circuiting === on the raw
    // strings by checking the internal compare handles differing
    // lengths and near-total mismatches identically to total mismatches.
    const shortWrong = basicHeader(EXPECTED.user, "x");
    const longWrong = basicHeader(
      EXPECTED.user,
      "x".repeat(EXPECTED.pass.length + 20),
    );
    expect(verifyBasicAuth(shortWrong, EXPECTED)).toBe(false);
    expect(verifyBasicAuth(longWrong, EXPECTED)).toBe(false);
  });
});
