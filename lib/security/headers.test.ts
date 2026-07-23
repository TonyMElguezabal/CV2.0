import { securityHeaders } from "./config.ts";

function headerValue(name: string): string | undefined {
  return securityHeaders.find((h) => h.key.toLowerCase() === name.toLowerCase())
    ?.value;
}

describe("securityHeaders", () => {
  it("includes a Content-Security-Policy with the expected restrictive directives", () => {
    const csp = headerValue("Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self'");
  });

  it("allows unsafe-inline for script-src and style-src (the static-preserving trade-off)", () => {
    const csp = headerValue("Content-Security-Policy");
    expect(csp).toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toMatch(/style-src[^;]*'unsafe-inline'/);
  });

  it("includes X-Content-Type-Options: nosniff", () => {
    expect(headerValue("X-Content-Type-Options")).toBe("nosniff");
  });

  it("includes Referrer-Policy: strict-origin-when-cross-origin", () => {
    expect(headerValue("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("includes X-Frame-Options: DENY", () => {
    expect(headerValue("X-Frame-Options")).toBe("DENY");
  });

  it("includes a Permissions-Policy header", () => {
    expect(headerValue("Permissions-Policy")).toBeDefined();
  });

  it("includes a Strict-Transport-Security header", () => {
    const hsts = headerValue("Strict-Transport-Security");
    expect(hsts).toBeDefined();
    expect(hsts).toContain("max-age=");
  });
});
