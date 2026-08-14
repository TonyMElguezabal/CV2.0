import "../globals.css";
import { getFaq, getProfile } from "@/lib/content/read.ts";
import { resolveSiteUrl } from "@/lib/seo/siteUrl.ts";
import { buildRootMetadata } from "@/lib/seo/metadata.ts";
import { fontVariablesClassName } from "@/lib/fonts.ts";
import { ChatWidgetProvider } from "@/components/ChatWidgetContext";
import { ChatWidget } from "@/components/ChatWidget";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { SiteFooter } from "@/components/SiteFooter";
import { StructuredData } from "@/components/StructuredData";
import { SkipToContentLink } from "@/components/SkipToContentLink";
import { SiteHeader } from "@/components/SiteHeader";
import { GridOverlay } from "@/components/GridOverlay";
import { HeroLaptop } from "@/components/HeroLaptop";

export const metadata = buildRootMetadata(getProfile(), resolveSiteUrl());

const STARTER_QUESTION_COUNT = 5;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const starterQuestions = getFaq()
    .slice(0, STARTER_QUESTION_COUNT)
    .map((entry) => entry.question);
  const { name, contact, chat, hero } = getProfile();

  return (
    <html
      lang="en"
      className={`h-full antialiased ${fontVariablesClassName}`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SkipToContentLink />
        <SiteHeader brandName={name} />
        {/* Fixed, whole-page background layer (z-index behind normal-flow
            content) — the signature scroll-driven laptop, per
            hero-signature-motion / openspec/changes/hero-laptop-scroll-motion. */}
        <HeroLaptop terminalLines={hero.terminalLines} />
        {/* Decorative grid — vertical hairlines plus the rule under the
            header, both drawn from --hair. `-z-10`, same stacking
            approach as HeroLaptop above, mounted after it so the grid
            paints on top of the laptop layer while both stay behind all
            normal content — editorial-frame design.md Decision 6. */}
        <GridOverlay />
        <StructuredData />
        <ChatWidgetProvider>
          {children}
          <SiteFooter />
          <ChatWidget
            starterQuestions={starterQuestions}
            contact={contact}
            tooltipLabel={chat.tooltipLabel}
            greeting={chat.greeting}
          />
        </ChatWidgetProvider>
        <AnalyticsTracker />
      </body>
    </html>
  );
}
