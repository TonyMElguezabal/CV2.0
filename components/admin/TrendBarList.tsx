import {
  adminTrendBarFillClass,
  adminTrendBarTrackClass,
  adminTrendClass,
  adminTrendLabelClass,
  adminTrendRowClass,
  adminTrendValueClass,
} from "./adminStyles";

export interface TrendBarListProps {
  rows: { label: string; value: number }[];
  formatValue?: (value: number) => string;
}

export function TrendBarList({ rows, formatValue }: TrendBarListProps) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className={adminTrendClass}>
      {rows.map((row) => (
        <div key={row.label} className={adminTrendRowClass}>
          <span className={adminTrendLabelClass}>{row.label}</span>
          <span className={adminTrendBarTrackClass}>
            <span
              className={adminTrendBarFillClass}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </span>
          <span className={adminTrendValueClass}>
            {formatValue ? formatValue(row.value) : row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
