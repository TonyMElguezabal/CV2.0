import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/content/read.ts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// This route is a prerendered, cacheable page (per the Cloudflare adapter's
// static-assets incremental cache — see
// openspec/changes/cloudflare-deployment-readiness design.md Decision 5):
// it renders once during `next build`'s own prerendering — a real Node.js
// process with full filesystem access — and is served from that cached
// output thereafter, never re-executing at Worker request time. So
// `getProfile()` and `ImageResponse`'s internal default-font `fs` read are
// both safe here despite the Cloudflare Workers runtime not supporting
// request-time `node:fs` reads.
export default function OpengraphImage() {
  const { name, positioning } = getProfile();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#ededed",
          padding: "80px",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 600, textAlign: "center" }}>
          {name}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: "#a1a1aa",
            textAlign: "center",
          }}
        >
          {positioning}
        </div>
      </div>
    ),
    { ...size }
  );
}
