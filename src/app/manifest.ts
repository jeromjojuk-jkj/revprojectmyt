import type { MetadataRoute } from "next";
import { activeFestival } from "@/lib/festival";

// Read per request so the app's opening screen follows the festival theme dates.
export const dynamic = "force-dynamic";

// Web app manifest: lets phones install Krip as an app (home-screen icon, full screen).
// Also the basis for the Play Store package (PWABuilder / Trusted Web Activity).
export default function manifest(): MetadataRoute.Manifest {
  const festival = activeFestival();
  return {
    id: "/",
    name: "Krip — Home gadgets & useful finds",
    short_name: "Krip",
    description: "Clever home gadgets and useful little things for every room, delivered across India.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Opening (splash) screen: festive maroon during a festival, white otherwise.
    background_color: festival ? festival.themeColor : "#ffffff",
    theme_color: festival ? festival.themeColor : "#171717",
    lang: "en-IN",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-white-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-white-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-white-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search", url: "/search?source=app", icons: [{ src: "/icons/icon-white-192.png", sizes: "192x192" }] },
      { name: "My orders", url: "/orders?source=app", icons: [{ src: "/icons/icon-white-192.png", sizes: "192x192" }] },
      { name: "Bag", url: "/cart?source=app", icons: [{ src: "/icons/icon-white-192.png", sizes: "192x192" }] },
    ],
  };
}
