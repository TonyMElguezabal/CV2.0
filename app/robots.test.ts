import robots from "./robots.ts";

describe("robots", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows all user agents and points sitemap at the resolved site origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://fixture.example.com");

    const result = robots();

    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBe("https://fixture.example.com/sitemap.xml");
  });
});
