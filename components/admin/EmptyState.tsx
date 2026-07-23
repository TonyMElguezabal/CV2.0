import { adminEmptyStateClass } from "./adminStyles";

export function EmptyState() {
  return (
    <p className={adminEmptyStateClass}>
      No data yet. Reports will populate once the deployed site starts
      collecting events.
    </p>
  );
}
