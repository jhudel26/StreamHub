// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Urbanist } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

// Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StreamHub",
    template: "%s | StreamHub",
  },
  description: "A unified streaming search dashboard for all your favorite platforms",
  keywords: ["streaming", "movies", "tv shows", "jellyfin", "youtube", "prime video", "hbo max"],
  authors: [{ name: "StreamHub Team" }],
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased bg-gray-50 dark:bg-gray-900",
          inter.variable,
          urbanist.variable
        )}
      >
        <AuthProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}