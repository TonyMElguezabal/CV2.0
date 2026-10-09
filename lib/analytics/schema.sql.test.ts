import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTACT_TARGETS } from "./schema.ts";

const SCHEMA_SQL = readFileSync(join(__dirname, "schema.sql"), "utf-8");
const MIGRATION_SQL = readFileSync(
  join(__dirname, "migrations", "2026-10-disruptive-footer-contact-targets.sql"),
  "utf-8",
);

// The CHECK constraint's allowed set, as written in SQL: 'scheduling', 'email', ...
function allowedTargetsIn(sql: string): string[] {
  const match = sql.match(/contact_target IS NULL OR contact_target IN \(([^)]*)\)/);
  const list = match?.[1];
  if (list === undefined) return [];
  return [...list.matchAll(/'([^']+)'/g)]
    .flatMap((m) => (m[1] ? [m[1]] : []))
    .sort();
}

describe("analytics contact_target database constraint", () => {
  it("fresh-database schema allows exactly the shared CONTACT_TARGETS", () => {
    expect(allowedTargetsIn(SCHEMA_SQL)).toEqual([...CONTACT_TARGETS].sort());
  });

  it("migration re-adds the constraint with exactly the shared CONTACT_TARGETS", () => {
    expect(allowedTargetsIn(MIGRATION_SQL)).toEqual([...CONTACT_TARGETS].sort());
  });

  it("migration replaces the existing auto-named constraint in one transaction", () => {
    expect(MIGRATION_SQL).toMatch(/BEGIN;/);
    expect(MIGRATION_SQL).toMatch(/DROP CONSTRAINT IF EXISTS analytics_event_contact_target_check/);
    expect(MIGRATION_SQL).toMatch(/ADD CONSTRAINT analytics_event_contact_target_check/);
    expect(MIGRATION_SQL).toMatch(/COMMIT;/);
  });

  it("migration states that the owner applies it, not the agent", () => {
    expect(MIGRATION_SQL).toMatch(/applied by the owner/i);
  });
});
