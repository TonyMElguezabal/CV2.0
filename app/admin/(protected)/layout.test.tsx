import { createSessionToken } from "@/lib/admin/session.ts";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/sessionCookie.ts";

const SECRET = "test-admin-secret";

let cookieValue: string | undefined;
const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === ADMIN_SESSION_COOKIE_NAME && cookieValue !== undefined
        ? { value: cookieValue }
        : undefined,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("ProtectedAdminLayout", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", SECRET);
    cookieValue = undefined;
    redirectMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects to /admin/login when no session cookie is present", async () => {
    const { default: ProtectedAdminLayout } = await import("./layout.tsx");

    await expect(
      ProtectedAdminLayout({ children: "content" }),
    ).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("renders children when a valid, unexpired session cookie is present", async () => {
    cookieValue = await createSessionToken(SECRET);
    const { default: ProtectedAdminLayout } = await import("./layout.tsx");

    const result = await ProtectedAdminLayout({ children: "dashboard" });
    expect(result).toBe("dashboard");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to /admin/login when the session cookie is tampered with", async () => {
    const token = await createSessionToken(SECRET);
    cookieValue = token.slice(0, -1) + (token.at(-1) === "a" ? "b" : "a");
    const { default: ProtectedAdminLayout } = await import("./layout.tsx");

    await expect(
      ProtectedAdminLayout({ children: "content" }),
    ).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("redirects to /admin/login when the session cookie has expired", async () => {
    cookieValue = await createSessionToken(SECRET, -1000);
    const { default: ProtectedAdminLayout } = await import("./layout.tsx");

    await expect(
      ProtectedAdminLayout({ children: "content" }),
    ).rejects.toThrow("REDIRECT:/admin/login");
  });
});
