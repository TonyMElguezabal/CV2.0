// Own fixed layer, stacked between the hero laptop layer and page content —
// never inside the hero layer, since that would place it under the scrim
// and cut its contribution by ~80% (design.md Decision 2 in
// openspec/changes/ambient-sparkle-layer). `-z-10` matches
// `heroLaptopLayerClass`/`gridOverlayClass`'s own convention: negative
// z-index guarantees normal-flow (auto z-index) page content always paints
// above it, regardless of DOM order. `hidden sm:block` mirrors the hero
// laptop's own `hidden sm:flex` gate (design.md Decision 5) — same
// constrained-device and readability reasoning, one rule to learn instead
// of two.
export const ambientSparkleLayerClass =
  "fixed inset-0 -z-10 hidden pointer-events-none sm:block";

export const ambientSparkleCanvasClass = "h-full w-full";
