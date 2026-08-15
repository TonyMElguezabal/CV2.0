import { writeFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
// `next/og` (no extension) isn't in Next's package.json `exports` map, so
// it only resolves inside Next's own bundler/webpack alias resolution —
// not under plain Node's ESM loader, which this prebuild script runs
// under. `next/og.js` is the real underlying file and resolves directly.
import { ImageResponse } from "next/og.js";
import { getProfile } from "../content/read.ts";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const OG_IMAGE_PUBLIC_PATH = join(
  process.cwd(),
  "public",
  "og-image.png",
);

// Generates the OpenGraph share card at build time instead of as a Next.js
// route (`app/opengraph-image.tsx`, removed) — `next/og`'s ImageResponse
// never executes in the Worker this way, taking the library out of the
// Worker's import graph entirely rather than merely serving it from a
// prerendered cache (openspec/changes/reduce-worker-bundle-size design.md
// Decision 2/3). Content and visual design are unchanged from the previous
// route — only when and where this renders has changed.
//
// Built with React.createElement, not JSX: this script runs under
// `node --experimental-strip-types` in `prebuild`, which strips TypeScript
// types but does not transform JSX (design.md Decision 2).
export async function generateOgImage(): Promise<ArrayBuffer> {
  const { name, positioning } = getProfile();

  const element = React.createElement(
    "div",
    {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        color: "#ededed",
        padding: "80px",
      },
    },
    React.createElement(
      "div",
      { style: { fontSize: 72, fontWeight: 600, textAlign: "center" } },
      name,
    ),
    React.createElement(
      "div",
      {
        style: {
          marginTop: 24,
          fontSize: 32,
          color: "#a1a1aa",
          textAlign: "center",
        },
      },
      positioning,
    ),
  );

  const response = new ImageResponse(element, {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
  });
  return response.arrayBuffer();
}

async function main(): Promise<void> {
  const buffer = await generateOgImage();
  writeFileSync(OG_IMAGE_PUBLIC_PATH, Buffer.from(buffer));
  console.log(
    `Wrote OpenGraph image (${buffer.byteLength} bytes) to ${OG_IMAGE_PUBLIC_PATH}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
