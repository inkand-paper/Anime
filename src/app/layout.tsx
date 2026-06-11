import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SecurityGate from "@/components/SecurityGate";
import ClientProviders from "@/components/ClientProviders";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "AniStream — Watch Anime Free", template: "%s | AniStream" },
  description:
    "Stream thousands of anime titles in HD. Subbed and dubbed. Watch together with friends in real time.",
  keywords: ["anime", "streaming", "watch anime", "dubbed anime", "subbed anime"],
  authors: [{ name: "AniStream" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "AniStream",
    title: "AniStream — Watch Anime Free",
    description: "Stream thousands of anime titles in HD. Subbed and dubbed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AniStream",
    description: "Stream thousands of anime titles in HD.",
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ClientProviders>
          <SecurityGate>
            <Navbar />
            <main className="min-h-dvh pt-16">{children}</main>
            <Footer />
          </SecurityGate>
        </ClientProviders>
      </body>
    </html>
  );
}
