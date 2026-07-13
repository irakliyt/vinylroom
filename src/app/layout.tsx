import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vinyl Listening Rooms — Host unforgettable nights around the records you love",
  description:
    "Create intimate vinyl listening sessions, invite real music lovers, and turn your collection into a shared evening. Small rooms. Deep cuts. Real conversation.",
  openGraph: {
    title: "Vinyl Listening Rooms",
    description:
      "A room. A record. A few people who really listen. Discover, host, and book intimate vinyl-based music events.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full`}>
      <head>
        <link
          rel="preload"
          as="image"
          href="/assets/video/dj-hologram-poster.webp"
          media="(min-width: 768px)"
          fetchPriority="high"
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
