import { siteFooterClass } from "./SiteFooterStyles";

export function SiteFooter() {
  return (
    <footer className={siteFooterClass}>
      <p>
        This site collects anonymous, cookieless usage analytics — no
        personal data, no cookies. Events are retained for 180 days.
      </p>
    </footer>
  );
}
