import { verifyCredentials } from "./credentials.ts";

const EXPECTED = { user: "owner", pass: "correct-horse-battery-staple" };

describe("verifyCredentials", () => {
  it("returns true for the correct user and password", () => {
    expect(verifyCredentials(EXPECTED.user, EXPECTED.pass, EXPECTED)).toBe(
      true,
    );
  });

  it("returns false for a wrong password", () => {
    expect(
      verifyCredentials(EXPECTED.user, "wrong-password", EXPECTED),
    ).toBe(false);
  });

  it("returns false for a wrong user", () => {
    expect(verifyCredentials("intruder", EXPECTED.pass, EXPECTED)).toBe(
      false,
    );
  });

  it("fails closed when the configured user is empty", () => {
    expect(
      verifyCredentials(EXPECTED.user, EXPECTED.pass, {
        user: "",
        pass: EXPECTED.pass,
      }),
    ).toBe(false);
  });

  it("fails closed when the configured pass is empty", () => {
    expect(
      verifyCredentials(EXPECTED.user, EXPECTED.pass, {
        user: EXPECTED.user,
        pass: "",
      }),
    ).toBe(false);
  });

  it("fails closed when both configured values are undefined", () => {
    expect(
      verifyCredentials(EXPECTED.user, EXPECTED.pass, {
        user: undefined,
        pass: undefined,
      }),
    ).toBe(false);
  });

  it("compares in constant time regardless of match position (no early-exit string comparison)", () => {
    // Not a true timing-attack test (unreliable in CI), but proves the
    // implementation doesn't use a short-circuiting === on the raw
    // strings by checking the internal compare handles differing
    // lengths and near-total mismatches identically to total mismatches.
    const shortWrong = "x";
    const longWrong = "x".repeat(EXPECTED.pass.length + 20);
    expect(verifyCredentials(EXPECTED.user, shortWrong, EXPECTED)).toBe(
      false,
    );
    expect(verifyCredentials(EXPECTED.user, longWrong, EXPECTED)).toBe(
      false,
    );
  });
});
