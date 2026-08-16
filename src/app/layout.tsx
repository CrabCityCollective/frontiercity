import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const TAGLINE =
  "De Frontier spaart niemand. De Geschiedenis blijft zich herhalen. Gaan we het ooit leren?";

export const metadata: Metadata = {
  title: "Frontier City",
  description: TAGLINE,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frontier City",
  },
  openGraph: {
    title: "Frontier City",
    description: TAGLINE,
  },
  twitter: {
    card: "summary",
    title: "Frontier City",
    description: TAGLINE,
  },
};

export const viewport: Viewport = {
  themeColor: "#3d2e26",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <head>
        {/*
          Handmatige manifest-link i.p.v. de Next.js manifest-file-convention:
          Next zet op die link altijd crossorigin="use-credentials" (hardcoded,
          niet uitzetbaar via de metadata-API). Dat laat de credentialed fetch
          van de manifest vaak falen, waardoor "Op homescherm zetten" terugvalt
          op een generiek icoon (effen theme-color vierkantje) i.p.v. het
          pixel-art icoon.
        */}
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Sancreek (titels/UI-chrome) + Vollkorn (leestekst). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sancreek&family=Vollkorn:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
