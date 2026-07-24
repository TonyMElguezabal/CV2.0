import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin login — CareerDNA",
  robots: { index: false, follow: false },
};

// Plain Server Component — no "use client", no JS required. The form
// posts natively to app/admin/login/submit/route.ts's POST handler
// (a sibling route, not this segment — Next.js doesn't allow a page.tsx
// and a route.ts at the same segment).
export default function AdminLoginPage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-lg font-semibold text-zinc-100">Admin login</h1>
      <form method="POST" action="/admin/login/submit" className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Username
          <input
            type="text"
            name="username"
            autoComplete="username"
            required
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
