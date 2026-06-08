import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SecurityGate from "@/components/SecurityGate";
import ClientProviders from "@/components/ClientProviders";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anime Portal - Watch & Sync",
  description: "The ultimate platform for anime recommendations and synchronized watching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-950 text-white selection:bg-blue-500/30">
        <ClientProviders>
          <SecurityGate>
            <Navbar />
            <main className="flex-grow pt-24">
              {children}
            </main>
          </SecurityGate>
        </ClientProviders>
      </body>
    </html>
  );
}



