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

export const metadata: Metadata = {
  title: "AfroTix",
  description: "Create, Manage & Grow Events with Real-Time Power",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  metadataBase: new URL('https://sankofa-one.vercel.app/'), // Replace with your actual domain
  openGraph: {
    title: "AfroTix",
    description: "Create, Manage & Grow Events with Real-Time Power",
    url: '/',
    siteName: 'AfroTix',
    images: [
      {
        url: '/og-1.webp', // Create a proper OG image (1200x630px)
        width: 1200,
        height: 630,
        alt: 'AfroTix - Event Management Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: "summary_large_image", // Changed from "summary" for better preview
    title: "AfroTix",
    description: "Create, Manage & Grow Events with Real-Time Power",
    images: ["/og-1.webp"], // Use same OG image
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