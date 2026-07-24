import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getProfile, getExperiences } from "../content/read.ts";
import type { ProfileContact } from "../content/types.ts";

export interface SiteConfig {
  contact: ProfileContact;
  chapterIds: string[];
}

export const DEFAULT_SITE_CONFIG_PATH = join(
  process.cwd(),
  "lib",
  "site-config",
  "generated.json",
);

// Derives the small, build-time-stable slice of content that two dynamic
// (Worker-executed) routes need at request time — /api/chat's error
// responses (contact) and /admin's dashboard (chapterIds) — without those
// routes reading /content directly via node:fs, which the Cloudflare
// Workers runtime doesn't support. See
// openspec/changes/cloudflare-deployment-readiness.
export function buildSiteConfig(): SiteConfig {
  const { contact } = getProfile();
  const chapterIds = getExperiences().map((experience) => experience.id);
  return { contact, chapterIds };
}

function main(): void {
  const config = buildSiteConfig();
  writeFileSync(DEFAULT_SITE_CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(
    `Wrote site config (${config.chapterIds.length} chapters) to ${DEFAULT_SITE_CONFIG_PATH}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
