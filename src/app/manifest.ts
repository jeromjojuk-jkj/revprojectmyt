import type { MetadataRoute } from "next";

// Web app manifest: lets phones install Krip as an app (home-screen icon, full screen).
// Also the basis for the Play Store package (PWABuilder / Trusted Web Activity).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Krip — Home gadgets & useful finds",
    short_name: "Krip",
    description: "Clever home gadgets and useful little things for every room, delivered across India.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#171717",
    theme_color: "#171717",
    lang: "en-IN",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search", url: "/search?source=app", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My orders", url: "/orders?source=app", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Bag", url: "/cart?source=app", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
