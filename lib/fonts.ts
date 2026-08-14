import localFont from "next/font/local";

// Two pinned static instances rather than a variable-axis font. Archivo is
// a Google variable font with `wght` and `wdth` axes, but next/font/local's
// typed wrapper has no option to pin a single width value — `axes: ['wdth']`
// only ever yields the full variable-range file, measured at 73-90 KB
// combined (well over the ~60 KB budget). These two files, fetched from
// Google Fonts' CSS2 endpoint at fixed weight+width points (not a range)
// and self-hosted here, measure 14.5 KB + 14.6 KB = 28.4 KB combined raw —
// see design.md Decision 2 / tasks.md 1.3 in
// openspec/changes/site-typography-and-palette.
export const archivoDisplay = localFont({
  src: "../fonts/archivo-expanded-700.woff2",
  weight: "700",
  style: "normal",
  variable: "--font-archivo-display",
  display: "swap",
  preload: true,
});

export const archivoBody = localFont({
  src: "../fonts/archivo-regular-400.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-archivo-body",
  display: "swap",
  preload: true,
});

// Applied to <html> in both root layouts — the single shared source of the
// font-variable classes, so neither layout defines or fetches its own.
export const fontVariablesClassName = `${archivoDisplay.variable} ${archivoBody.variable}`;
