import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frontier City",
  description: "De Eerste Vuren — Het Hertenpad-volk",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frontier City",
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
