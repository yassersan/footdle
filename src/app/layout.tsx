import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Footdle",
  description: "Wordle for football fans. Guess the footballer in 6 tries!",
  applicationName: "Footdle",
  themeColor: "#064e3b",
  openGraph: {
    title: "Footdle",
    description: "Guess the Footballer — a Wordle-style football game",
    type: "website",
  },
  appleWebApp: { statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pt-[env(safe-area-inset-top)]`}
      >
        {children}
      </body>
    </html>
  );
}
