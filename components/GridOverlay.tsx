import {
  gridOverlayClass,
  gridOverlayHeaderRuleClass,
  gridOverlayColumnClass,
} from "./GridOverlayStyles";

export function GridOverlay() {
  return (
    <div aria-hidden="true" className={gridOverlayClass}>
      <div className={gridOverlayHeaderRuleClass} />
      <div className={gridOverlayColumnClass} />
    </div>
  );
}
