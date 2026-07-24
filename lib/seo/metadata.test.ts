import {
  buildRootMetadata,
  buildPersonJsonLd,
  buildProfilePageJsonLd,
} from "./metadata.ts";
import type { Profile } from "../content/types.ts";

const FIXTURE_PROFILE: Profile = {
  name: "Fixture Person",
  positioning: "Fixture Positioning Statement",
  summary: "A fixture summary of the fixture person's career.",
  links: {
    linkedin: "https://www.linkedin.com/in/fixture",
    github: "https://github.com/fixture",
  },
  contact: {
    email: "fixture@example.com",
    scheduling: "https://cal.com/fixture",
  },
  chat: {
    greeting: "Hi! Fixture greeting.",
    tooltipLabel: "chat with me",
  },
  hero: {
    terminalLines: ["$ whoami", "fixture_person"],
  },
};

const SITE_URL = "https://fixture.example.com";

describe("buildRootMetadata", () => {
  it("derives title and description from the profile", () => {
    const metadata = buildRootMetadata(FIXTURE_PROFILE, SITE_URL);

    expect(metadata.title).toContain("Fixture Person");
    expect(metadata.description).toBeTruthy();
    expect(String(metadata.description)).not.toBe("");
  });

  it("sets metadataBase and a canonical alternate from siteUrl", () => {
    const metadata = buildRootMetadata(FIXTURE_PROFILE, SITE_URL);

    expect(metadata.metadataBase?.toString()).toBe(`${SITE_URL}/`);
    expect(metadata.alternates?.canonical).toBe(SITE_URL);
  });

  it("includes an openGraph block with type, title, description, url, and images", () => {
    const metadata = buildRootMetadata(FIXTURE_PROFILE, SITE_URL);
    const openGraph = metadata.openGraph as Record<string, unknown>;

    expect(openGraph).toBeDefined();
    expect(openGraph.type).toBe("profile");
    expect(openGraph.title).toBeTruthy();
    expect(openGraph.description).toBeTruthy();
    expect(openGraph.url).toBe(SITE_URL);
    expect(openGraph.images).toBeTruthy();
  });

  it("includes a twitter summary_large_image card", () => {
    const metadata = buildRootMetadata(FIXTURE_PROFILE, SITE_URL);
    const twitter = metadata.twitter as Record<string, unknown>;

    expect(twitter.card).toBe("summary_large_image");
  });
});

describe("buildPersonJsonLd", () => {
  it("returns a valid Person node with sameAs derived from links", () => {
    const person = buildPersonJsonLd(FIXTURE_PROFILE, SITE_URL);

    expect(person["@context"]).toBe("https://schema.org");
    expect(person["@type"]).toBe("Person");
    expect(person.name).toBe("Fixture Person");
    expect(person.url).toBe(SITE_URL);
    expect(person.sameAs).toEqual(
      expect.arrayContaining([
        "https://www.linkedin.com/in/fixture",
        "https://github.com/fixture",
      ])
    );
    expect(person.sameAs).toHaveLength(2);
  });

  it("omits absent link fields from sameAs", () => {
    const minimalProfile: Profile = {
      ...FIXTURE_PROFILE,
      links: { linkedin: "https://www.linkedin.com/in/fixture" },
    };

    const person = buildPersonJsonLd(minimalProfile, SITE_URL);

    expect(person.sameAs).toEqual(["https://www.linkedin.com/in/fixture"]);
  });

  it("has no undefined or null required fields", () => {
    const person = buildPersonJsonLd(FIXTURE_PROFILE, SITE_URL);

    expect(person.name).not.toBeUndefined();
    expect(person.name).not.toBeNull();
    expect(person.url).not.toBeUndefined();
    expect(person.jobTitle ?? person.description).toBeTruthy();
  });
});

describe("buildProfilePageJsonLd", () => {
  it("returns a ProfilePage whose mainEntity is the Person", () => {
    const profilePage = buildProfilePageJsonLd(FIXTURE_PROFILE, SITE_URL);

    expect(profilePage["@context"]).toBe("https://schema.org");
    expect(profilePage["@type"]).toBe("ProfilePage");
    expect(profilePage.mainEntity["@type"]).toBe("Person");
    expect(profilePage.mainEntity.name).toBe("Fixture Person");
  });
});
