import {
  countryFromHeaders,
  referrerDomainFromHeaders,
  deviceClassFromUserAgent,
} from "./derive.ts";

describe("countryFromHeaders", () => {
  it("returns the x-vercel-ip-country header value", () => {
    const headers = new Headers({ "x-vercel-ip-country": "MX" });
    expect(countryFromHeaders(headers)).toBe("MX");
  });

  it("returns null when the header is absent", () => {
    const headers = new Headers();
    expect(countryFromHeaders(headers)).toBeNull();
  });

  it("never returns anything resembling an IP address", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.5",
      "x-vercel-ip-country": "US",
    });
    const result = countryFromHeaders(headers);
    expect(result).not.toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
  });
});

describe("referrerDomainFromHeaders", () => {
  it("reduces a full referrer URL to its host only", () => {
    const headers = new Headers({
      referer: "https://www.google.com/search?q=jose+munoz",
    });
    expect(referrerDomainFromHeaders(headers)).toBe("www.google.com");
  });

  it("drops path and query from the referrer", () => {
    const headers = new Headers({
      referer: "https://news.ycombinator.com/item?id=12345",
    });
    const result = referrerDomainFromHeaders(headers);
    expect(result).toBe("news.ycombinator.com");
    expect(result).not.toContain("/item");
    expect(result).not.toContain("id=12345");
  });

  it("returns null when the referrer header is missing", () => {
    const headers = new Headers();
    expect(referrerDomainFromHeaders(headers)).toBeNull();
  });

  it("returns null when the referrer is not a valid URL", () => {
    const headers = new Headers({ referer: "not-a-valid-url" });
    expect(referrerDomainFromHeaders(headers)).toBeNull();
  });
});

describe("deviceClassFromUserAgent", () => {
  it("maps a representative mobile UA to 'mobile'", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    expect(deviceClassFromUserAgent(ua)).toBe("mobile");
  });

  it("maps a representative tablet UA to 'tablet'", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    expect(deviceClassFromUserAgent(ua)).toBe("tablet");
  });

  it("maps a representative desktop UA to 'desktop'", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(deviceClassFromUserAgent(ua)).toBe("desktop");
  });

  it("defaults to 'desktop' for an unknown or missing UA, and never returns the raw UA", () => {
    const result = deviceClassFromUserAgent(null);
    expect(["mobile", "tablet", "desktop"]).toContain(result);
    expect(result).not.toContain("Mozilla");
  });
});
