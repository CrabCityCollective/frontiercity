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
