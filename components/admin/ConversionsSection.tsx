import type { ConversionsReport } from "@/lib/analytics/reports.ts";
import { CONTACT_TARGETS, type ContactTarget } from "@/lib/analytics/schema.ts";
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

const CONTACT_TARGET_LABELS: Record<ContactTarget, string> = {
  scheduling: "Scheduling",
  email: "Email",
  linkedin: "LinkedIn",
  github: "GitHub",
  whatsapp: "WhatsApp",
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
          {CONTACT_TARGETS.map((target) => (
            <tr key={target}>
              <td className={adminTableCellClass}>
                {CONTACT_TARGET_LABELS[target]}
              </td>
              <td className={adminTableCellClass}>
                {report.contactClicksByTarget[target]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
