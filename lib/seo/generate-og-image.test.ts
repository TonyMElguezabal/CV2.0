import { generateOgImage, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from "./generate-og-image.ts";

// PNG header: 8-byte signature, then an IHDR chunk whose data starts at
// byte 16 with 4-byte big-endian width and height.
function readPngDimensions(buffer: ArrayBuffer): { width: number; height: number } {
  const view = new DataView(buffer);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
}

describe("generateOgImage", () => {
  it("renders a real PNG at the declared 1200x630 size from real profile content", async () => {
    const buffer = await generateOgImage();

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const signature = new Uint8Array(buffer.slice(0, 8));
    expect(Array.from(signature)).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const { width, height } = readPngDimensions(buffer);
    expect(width).toBe(OG_IMAGE_WIDTH);
    expect(height).toBe(OG_IMAGE_HEIGHT);
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
