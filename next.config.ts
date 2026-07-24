import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security/config.ts";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Enables local Cloudflare bindings (env vars, ASSETS, etc.) during
// `next dev`, for parity with the deployed Worker environment.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
