import { loadSiteConfig } from "./read.ts";

describe("loadSiteConfig", () => {
  it("loads the bundled site config", async () => {
    const config = await loadSiteConfig();

    expect(config.contact).toEqual(
      expect.objectContaining({
        email: expect.any(String),
        scheduling: expect.any(String),
      }),
    );
    expect(Array.isArray(config.chapterIds)).toBe(true);
    expect(config.chapterIds.length).toBeGreaterThan(0);
  });
});
