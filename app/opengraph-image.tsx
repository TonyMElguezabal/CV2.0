import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/content/read.ts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
