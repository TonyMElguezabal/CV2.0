import {
  adminStatCardClass,
  adminStatLabelClass,
  adminStatValueClass,
} from "./adminStyles";

export interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className={adminStatCardClass}>
      <p className={adminStatValueClass}>{value}</p>
      <p className={adminStatLabelClass}>{label}</p>
    </div>
  );
}
