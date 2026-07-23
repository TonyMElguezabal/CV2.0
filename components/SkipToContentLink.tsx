const skipLinkClass =
  "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:border focus:border-zinc-700 focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-100";

export function SkipToContentLink() {
  return (
    <a href="#main" className={skipLinkClass}>
      Skip to content
    </a>
  );
}
