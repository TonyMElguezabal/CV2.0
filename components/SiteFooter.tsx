import type { Profile } from "@/lib/content/types.ts";
import { SectionReveal } from "./SectionReveal";
import { SocialIcon } from "./SocialIcons";
import { FooterIllustration } from "./FooterIllustration";
import { MotionProvider } from "./MotionProvider";
import {
  siteFooterClass,
  footerTextBlockClass,
  footerHeadlineClass,
  footerSublineClass,
  footerCtaClass,
  footerCtaLabelClass,
  footerCtaSubLabelClass,
  footerIconRowClass,
  footerIconLinkClass,
  footerDisclosureClass,
} from "./SiteFooterStyles";

export type SiteFooterProps = Pick<Profile, "footer" | "links" | "contact">;

// Fixed route, not profile data: the number lives server-side behind it (JOS-191 Decision 4).
const WHATSAPP_REDIRECT_HREF = "/go/whatsapp";

const EXTERNAL_LINK_REL = "noopener noreferrer";

function analyticsAttributes(target: string) {
  return {
    "data-analytics-event": "contact_click",
    "data-analytics-target": target,
  };
}

// The footer is mounted outside the layout's MotionProvider (which wraps only
// {children}), so it supplies its own. Without it, the SectionReveal below never
// animates and the text stays invisible.
export function SiteFooter({ footer, links, contact }: SiteFooterProps) {
  return (
    <MotionProvider>
    <footer className={siteFooterClass}>
      <FooterIllustration />
      <SectionReveal className={footerTextBlockClass}>
        <h2 className={footerHeadlineClass}>{footer.headline}</h2>
        <p className={footerSublineClass}>{footer.subline}</p>
        <a
          href={contact.scheduling}
          target="_blank"
          rel={EXTERNAL_LINK_REL}
          className={footerCtaClass}
          {...analyticsAttributes("scheduling")}
        >
          <span className={footerCtaLabelClass}>{footer.ctaLabel}</span>
          <span className={footerCtaSubLabelClass}>{footer.ctaSubLabel}</span>
        </a>
      </SectionReveal>

      <ul className={footerIconRowClass}>
        <li>
          <a
            href={links.linkedin}
            target="_blank"
            rel={EXTERNAL_LINK_REL}
            aria-label="LinkedIn"
            className={footerIconLinkClass}
            {...analyticsAttributes("linkedin")}
          >
            <SocialIcon name="linkedin" />
          </a>
        </li>
        {links.github ? (
          <li>
            <a
              href={links.github}
              target="_blank"
              rel={EXTERNAL_LINK_REL}
              aria-label="GitHub"
              className={footerIconLinkClass}
              {...analyticsAttributes("github")}
            >
              <SocialIcon name="github" />
            </a>
          </li>
        ) : null}
        <li>
          <a
            href={WHATSAPP_REDIRECT_HREF}
            rel="nofollow noopener noreferrer"
            aria-label="WhatsApp"
            className={footerIconLinkClass}
            {...analyticsAttributes("whatsapp")}
          >
            <SocialIcon name="whatsapp" />
          </a>
        </li>
        <li>
          <a
            href={contact.scheduling}
            target="_blank"
            rel={EXTERNAL_LINK_REL}
            aria-label="Book a meeting"
            className={footerIconLinkClass}
            {...analyticsAttributes("scheduling")}
          >
            <SocialIcon name="calendar" />
          </a>
        </li>
        <li>
          <a
            href={`mailto:${contact.email}`}
            aria-label="Email Jose"
            className={footerIconLinkClass}
            {...analyticsAttributes("email")}
          >
            <SocialIcon name="envelope" />
          </a>
        </li>
      </ul>

      <p className={footerDisclosureClass}>
        This site collects anonymous, cookieless usage analytics — no
        personal data, no cookies. Events are retained for 180 days.
      </p>
    </footer>
    </MotionProvider>
  );
}
