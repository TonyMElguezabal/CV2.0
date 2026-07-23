import type { Profile } from "@/lib/content/types.ts";
import {
  contactSectionClass,
  contactHeadingClass,
  contactLinksListClass,
  contactLinkClass,
} from "./ContactSectionStyles";

export type ContactSectionProps = Pick<Profile, "contact" | "links">;

export function ContactSection({ contact, links }: ContactSectionProps) {
  return (
    <section id="contact" className={contactSectionClass}>
      <h2 className={contactHeadingClass}>Contact</h2>
      <div className={contactLinksListClass}>
        <a
          href={contact.scheduling}
          target="_blank"
          rel="noopener noreferrer"
          className={contactLinkClass}
        >
          Book a meeting
        </a>
        <a href={`mailto:${contact.email}`} className={contactLinkClass}>
          Email Jose
        </a>
        <a
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={contactLinkClass}
        >
          LinkedIn
        </a>
      </div>
    </section>
  );
}
