import type { ConversionsReport } from "@/lib/analytics/reports.ts";
import { StatCard } from "./StatCard";
import {
  adminSectionClass,
  adminSectionHeadingClass,
  adminStatGridClass,
  adminTableCellClass,
  adminTableClass,
  adminTableHeadCellClass,
} from "./adminStyles";

export interface ConversionsSectionProps {
  report: ConversionsReport;
}

const CONTACT_TARGET_LABELS: Record<string, string> = {
  scheduling: "Scheduling",
  email: "Email",
  linkedin: "LinkedIn",
};

export function ConversionsSection({ report }: ConversionsSectionProps) {
  return (
    <section
      className={adminSectionClass}
      aria-labelledby="conversions-heading"
    >
      <h2 id="conversions-heading" className={adminSectionHeadingClass}>
        Conversions
      </h2>
      <div className={adminStatGridClass}>
        <StatCard
          label="Résumé downloads"
          value={report.resumeDownloadCount.toLocaleString()}
        />
      </div>
      <table className={adminTableClass}>
        <caption className="sr-only">Contact clicks by target</caption>
        <thead>
          <tr>
            <th scope="col" className={adminTableHeadCellClass}>
              Contact target
            </th>
            <th scope="col" className={adminTableHeadCellClass}>
              Clicks
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(report.contactClicksByTarget).map(
            ([target, count]) => (
              <tr key={target}>
                <td className={adminTableCellClass}>
                  {CONTACT_TARGET_LABELS[target] ?? target}
                </td>
                <td className={adminTableCellClass}>{count}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </section>
  );
}
