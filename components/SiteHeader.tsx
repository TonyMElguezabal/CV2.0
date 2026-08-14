import { siteNavItems } from "./siteNavigation";
import {
  siteHeaderClass,
  siteHeaderTopRowClass,
  siteHeaderBrandClass,
  siteHeaderContactLinkClass,
  siteHeaderNavClass,
  siteHeaderNavListClass,
  siteHeaderNavLinkClass,
} from "./SiteHeaderStyles";

export interface SiteHeaderProps {
  brandName: string;
}

export function SiteHeader({ brandName }: SiteHeaderProps) {
  return (
    <header className={siteHeaderClass}>
      <div className={siteHeaderTopRowClass}>
        <a href="#main" className={siteHeaderBrandClass}>
          {brandName}
        </a>
        {/* Duplicates one of HeroCtas's "Contact" actions deliberately —
            the hero CTAs scroll away within the first viewport, the header
            persists, so this is what keeps the action continuously
            available (design.md Decision 7). */}
        <a href="#contact" className={siteHeaderContactLinkClass}>
          Contact
        </a>
      </div>
      <nav aria-label="Site sections" className={siteHeaderNavClass}>
        <ul className={siteHeaderNavListClass}>
          {siteNavItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} className={siteHeaderNavLinkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
