import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { ProfileSchema } from "./schemas.ts";
import { VALID_PROFILE } from "./test-fixtures.ts";

const VALID_FOOTER_BLOCK = `
footer:
  headline: Hey, you're at the bottom of my interactive CV page.
  subline: Just click the contact button if you're interested. There's nothing to lose!
  ctaLabel: Come on, click on this
  ctaSubLabel: Don't make me beg
`;

// VALID_PROFILE now carries a footer block; these tests need the base without one.
const BASE_PROFILE_WITHOUT_FOOTER = VALID_PROFILE.slice(
  0,
  VALID_PROFILE.indexOf("footer:"),
);

function profileWith(extraYaml: string): unknown {
  return parseYaml(`${BASE_PROFILE_WITHOUT_FOOTER}${extraYaml}`);
}

describe("content-model: profile footer block", () => {
  it("accepts a profile whose footer block carries all four strings", () => {
    const result = ProfileSchema.safeParse(profileWith(VALID_FOOTER_BLOCK));

    expect(result.success).toBe(true);
  });

  it("rejects a profile with no footer block", () => {
    const result = ProfileSchema.safeParse(
      parseYaml(BASE_PROFILE_WITHOUT_FOOTER),
    );

    expect(result.success).toBe(false);
  });

  it.each(["headline", "subline", "ctaLabel", "ctaSubLabel"])(
    "rejects a footer block missing %s, naming the field",
    (missingField) => {
      const footerLines = VALID_FOOTER_BLOCK.split("\n").filter(
        (line) => !line.trimStart().startsWith(`${missingField}:`),
      );
      const result = ProfileSchema.safeParse(
        profileWith(footerLines.join("\n")),
      );

      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain(missingField);
    },
  );
});
