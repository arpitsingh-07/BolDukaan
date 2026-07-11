import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Hanken_Grotesk,
  Noto_Sans_Devanagari,
  Noto_Sans_Gurmukhi,
} from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const deva = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari"],
  display: "swap",
});

const gurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-gurmukhi",
  subsets: ["gurmukhi"],
  display: "swap",
});

const description =
  "Speak your shop into existence. Describe your shop out loud in Hindi, Punjabi, or English and get a live storefront page.";

export const metadata: Metadata = {
  // Absolute base for resolving OpenGraph/Twitter image URLs (e.g. the
  // per-shop opengraph-image) and canonical links.
  metadataBase: new URL(siteUrl()),
  title: "BolDukaan — bol, aur dukaan taiyaar",
  description,
  openGraph: {
    title: "BolDukaan — bol, aur dukaan taiyaar",
    description,
    url: "/",
    siteName: "BolDukaan",
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary", title: "BolDukaan", description },
};

export const viewport: Viewport = {
  themeColor: "#0C3B38",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${deva.variable} ${gurmukhi.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
