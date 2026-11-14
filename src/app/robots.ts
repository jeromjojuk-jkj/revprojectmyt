import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

/** Search engines may index the shop; private areas (admin, seller panel, bag, orders, APIs) are off limits. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/vendor", "/api/", "/cart", "/checkout", "/pay/", "/order/", "/orders", "/account", "/wishlist", "/offline"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
