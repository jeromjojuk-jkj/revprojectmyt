import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { Toaster } from "@/components/Toaster";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: { default: `krip — ${BRAND.tagline}`, template: "%s · krip" },
  description: "Trending, affordable fashion, beauty and accessories. Trending looks. Your kind of price.",
  applicationName: "krip",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F8CB46",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only z-50 rounded-lg bg-leaf px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2">
          Skip to content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
