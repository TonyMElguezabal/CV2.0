import sitemap from "./sitemap.ts";

describe("sitemap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists the landing route with an absolute URL from the resolved site origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://fixture.example.com");

    const result = sitemap();

    expect(result).toHaveLength(1);
    expect(result[0]!.url).toBe("https://fixture.example.com");
    expect(result[0]!.lastModified).toBeInstanceOf(Date);
  });
});
