import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/app-context";
import { AppShell } from "@/components/AppShell";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pulse — Habit & Wellness",
  description:
    "Track habits, sit/stand intervals, and water intake. Fully private — data stays in your browser.",
  appleWebApp: {
    capable: true,
    title: "Pulse",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} ${fraunces.variable}`}>
      <head>
        <link
          rel="manifest"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`}
        />
      </head>
      <body className="font-[family-name:var(--font-figtree)] overflow-x-hidden">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
