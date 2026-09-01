// Own fixed layer, stacked between the hero laptop layer and page content —
// never inside the hero layer, since that would place it under the scrim
// and cut its contribution by ~80% (design.md Decision 2 in
// openspec/changes/ambient-sparkle-layer). `-z-10` matches
// `heroLaptopLayerClass`/`gridOverlayClass`'s own convention: negative
// z-index guarantees normal-flow (auto z-index) page content always paints
// above it, regardless of DOM order.
//
// Renders at every viewport width, not gated below `sm` — mobile-motion-
// parity removed the `hidden sm:block` gate that used to mirror the hero
// laptop's own (now also removed). The layer's cost on constrained
// devices is bounded by requirements that already apply at every width:
// particle count derives from measured area (`particleCountForArea()`,
// clamped [40, 260]), and the animation loop stops whenever the layer is
// hidden or scrolled out of view.
export const ambientSparkleLayerClass =
  "fixed inset-0 -z-10 block pointer-events-none";

export const ambientSparkleCanvasClass = "h-full w-full";
