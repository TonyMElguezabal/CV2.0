import { resolveSiteUrl } from "./siteUrl.ts";

describe("resolveSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns NEXT_PUBLIC_SITE_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://josemunoz.dev");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "some-preview.vercel.app");

    expect(resolveSiteUrl()).toBe("https://josemunoz.dev");
  });

  it("falls back to the Vercel production URL when NEXT_PUBLIC_SITE_URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "careerdna.vercel.app");

    expect(resolveSiteUrl()).toBe("https://careerdna.vercel.app");
  });

  it("falls back to localhost when neither env var is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");

    expect(resolveSiteUrl()).toBe("http://localhost:3000");
  });

  it("strips a trailing slash from NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://josemunoz.dev/");

    expect(resolveSiteUrl()).toBe("https://josemunoz.dev");
  });
});
