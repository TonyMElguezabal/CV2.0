import type { Metadata } from "next";
import type { Profile } from "../content/types.ts";

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

export interface PersonJsonLd {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  jobTitle?: string;
  description?: string;
  url: string;
  sameAs: string[];
}

export interface ProfilePageJsonLd {
  "@context": "https://schema.org";
  "@type": "ProfilePage";
  mainEntity: PersonJsonLd;
}

export function buildRootMetadata(profile: Profile, siteUrl: string): Metadata {
  const title = `${profile.name} — ${profile.positioning}`;
  const description = profile.summary;
  const ogImageUrl = `${siteUrl}/opengraph-image`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: "profile",
      title,
      description,
      url: siteUrl,
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

function sameAsFromLinks(links: Profile["links"]): string[] {
  return [links.linkedin, links.github, links.website].filter(
    (url): url is string => Boolean(url)
  );
}

export function buildPersonJsonLd(
  profile: Profile,
  siteUrl: string
): PersonJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.positioning,
    description: profile.summary,
    url: siteUrl,
    sameAs: sameAsFromLinks(profile.links),
  };
}

export function buildProfilePageJsonLd(
  profile: Profile,
  siteUrl: string
): ProfilePageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: buildPersonJsonLd(profile, siteUrl),
  };
}
