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
import { HeroLaptop } from "@/components/HeroLaptop";
import { AmbientSparkleLayer } from "@/components/AmbientSparkleLayer";
import { MotionProvider } from "@/components/MotionProvider";
import { revealNoscriptOverrideCss } from "@/components/RevealStyles";
import { ArrivalSequenceProvider } from "@/components/ArrivalSequenceProvider";
import { arrivalNoscriptOverrideCss } from "@/components/ArrivalStyles";

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
        {/* One shared override for every scroll-reveal instance on the
            page (SectionReveal, RevealHeading), rather than duplicating a
            per-instance <noscript> block the way HeroFramer.tsx does for
            its own single entrance — framer-motion's `initial` prop bakes
            opacity:0 into the SSR HTML for every reveal target, so without
            this, a no-JS visitor would see a page of invisible sections.
            The ghost (ambient blur copy inside RevealHeading) is forced
            the opposite way — hidden, not shown — or a no-JS visitor would
            see permanently blurred text behind the sharp copy. See
            openspec/changes/scroll-reveal-motion design.md Decision 2. */}
        <noscript>
          <style>{revealNoscriptOverrideCss}</style>
        </noscript>
        {/* One shared override for every page-load arrival-sequence
            participant (the laptop, the ambient layer, the hero text and
            CTAs), mirroring the scroll-reveal override immediately above
            it — openspec/changes/arrival-sequence design.md Decision 5
            (fail-visible). */}
        <noscript>
          <style>{arrivalNoscriptOverrideCss}</style>
        </noscript>
        <SkipToContentLink />
        <SiteHeader brandName={name} />
        {/* Wraps every arrival-sequence participant (HeroLaptop,
            AmbientSparkleLayer, and — inside {children} — HeroFramer/
            HeroCtas) so they all read from one shared `arrived`/`skip`
            state rather than each independently detecting the deep-link
            fragment on its own tick. StructuredData falls inside this
            boundary incidentally (it doesn't consume the context) rather
            than being deliberately excluded from it. */}
        <ArrivalSequenceProvider>
          {/* Fixed, whole-page background layer (z-index behind normal-flow
              content) — the signature scroll-driven laptop, per
              hero-signature-motion / openspec/changes/hero-laptop-scroll-motion. */}
          <HeroLaptop terminalLines={hero.terminalLines} />
          {/* Ambient particle field — mounted after HeroLaptop (and its
              scrim) so it paints above them, not beneath: placing it inside
              the hero layer would cut its contribution by ~80% (measured —
              ambient-sparkle-layer design.md Decision 2). `-z-10`, same
              stacking approach as the layers around it, so it still stays
              behind all normal content regardless of DOM order. */}
          <AmbientSparkleLayer />
          <StructuredData />
          <ChatWidgetProvider>
            {/* Scroll-reveal components below <main> (SectionReveal,
                RevealHeading) use framer-motion's `m.*` components, which
                require a LazyMotion boundary — HeroFramer.tsx/HeroLaptop.tsx
                already provide their own for their own subtrees, but
                {children} (everything below the hero) has none. Nested
                LazyMotion providers are safe (the same domAnimation feature
                set loads once, cached) — see MotionProvider.tsx. */}
            <MotionProvider>{children}</MotionProvider>
            <SiteFooter />
            <ChatWidget
              starterQuestions={starterQuestions}
              contact={contact}
              tooltipLabel={chat.tooltipLabel}
              greeting={chat.greeting}
              idleInvitation={chat.idleInvitation}
            />
          </ChatWidgetProvider>
        </ArrivalSequenceProvider>
        <AnalyticsTracker />
      </body>
    </html>
  );
}
