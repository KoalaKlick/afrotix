import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { PROJ_NAME, DOMAIN_NAME } from "@/lib/const/branding";

export const metadata: Metadata = {
  title: PROJ_NAME,
  description: "Create, Manage & Grow Events with Real-Time Power",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_DOMAIN_URL ?? `https://${DOMAIN_NAME}`),
  openGraph: {
    title: PROJ_NAME,
    description: "Create, Manage & Grow Events with Real-Time Power",
    url: '/',
    siteName: PROJ_NAME,
    images: [
      {
        url: '/og-1.webp',
        width: 1200,
        height: 630,
        alt: `${PROJ_NAME} - Event Management Platform`,
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: "summary_large_image",
    title: PROJ_NAME,
    description: "Create, Manage & Grow Events with Real-Time Power",
    images: ["/og-1.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster  position="top-right" />
      </body>
    </html>
  );
}