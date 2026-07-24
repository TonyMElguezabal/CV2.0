import { buildSiteConfig } from "./build.ts";

describe("buildSiteConfig", () => {
  it("derives contact and an ordered chapter-ID list from real content", () => {
    const config = buildSiteConfig();

    expect(config.contact).toEqual(
      expect.objectContaining({
        email: expect.any(String),
        scheduling: expect.any(String),
      }),
    );
    expect(Array.isArray(config.chapterIds)).toBe(true);
    expect(config.chapterIds.length).toBeGreaterThan(0);
    for (const id of config.chapterIds) {
      expect(typeof id).toBe("string");
    }
  });
});
