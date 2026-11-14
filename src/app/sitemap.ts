import type { MetadataRoute } from "next";
import { getPublicProducts } from "@/lib/server/catalog";
import { CATEGORIES } from "@/lib/constants";
import { siteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

const HELP = ["about", "contact", "faq", "shipping", "returns", "refunds", "exchange", "cancellation", "privacy", "terms", "cookies"];

/** Public pages for search engines: home, categories, live products, Sell on Krip and the policy pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await getPublicProducts();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/drops`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/sell`, changeFrequency: "monthly", priority: 0.5 },
    ...CATEGORIES.map((c) => ({ url: `${base}/search?cat=${c.id}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: `${base}/help`, changeFrequency: "monthly", priority: 0.3 },
    ...HELP.map((t) => ({ url: `${base}/help/${t}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
