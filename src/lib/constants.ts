import type { CategoryId, VibeId } from "./types.ts";

export const BRAND = {
  name: "krip",
  tagline: "Trending looks. Your kind of price.",
} as const;

/**
 * What Krip sells right now. "home" = home gadgets & small useful things (launch range);
 * "fashion" = the original fashion range, kept so it can be switched back on later.
 * Switching changes the categories, the sample catalogue and which shopping tools are shown.
 */
export const STORE_MODE: "home" | "fashion" = "home";
export const IS_FASHION = (STORE_MODE as string) === "fashion";

type Category = { id: CategoryId; name: string; short: string; art: string; hex: string; emoji?: string; image?: string };

export const HOME_CATEGORIES: Category[] = [
  { id: "kitchen", name: "Kitchen Helpers", short: "Kitchen", art: "chopper", hex: "166534", image: "/products/oil-sprayer-dispenser-2-in-1/1.jpg" },
  { id: "cleaning", name: "Cleaning & Laundry", short: "Cleaning", art: "cloth", hex: "0ea5e9", image: "/products/magic-eraser-cleaning-sponge-pack-of-4/1.jpg" },
  { id: "baby-safety", name: "Baby Safety", short: "Baby safety", art: "lock", hex: "f472b6", image: "/products/daluci-baby-safety-socket-covers/1.jpg" },
  { id: "personal-care", name: "Personal Care", short: "Self-care", art: "holder", hex: "e7f3f6", image: "/products/silicone-ice-face-roller-pack-of-3/1.jpg" },
];

export const FASHION_CATEGORIES: Category[] = [
  { id: "women", name: "Women’s Clothing", short: "Women", art: "dress", hex: "c2410c" },
  { id: "men", name: "Men’s Clothing", short: "Men", art: "shirt", hex: "1e3a8a" },
  { id: "footwear", name: "Footwear", short: "Footwear", art: "sneaker", hex: "f5f5f4" },
  { id: "beauty", name: "Cosmetics & Beauty", short: "Beauty", art: "lipstick", hex: "be123c" },
  { id: "bags", name: "Bags", short: "Bags", art: "tote", hex: "a16207" },
  { id: "jewellery", name: "Jewellery", short: "Jewellery", art: "earrings", hex: "b89548" },
  { id: "accessories", name: "Accessories", short: "Accessories", art: "sunglasses", hex: "171717" },
];

export const CATEGORIES: Category[] = IS_FASHION ? FASHION_CATEGORIES : HOME_CATEGORIES;

// Names for every category id, so older records still display correctly.
export const CATEGORY_NAME: Record<CategoryId, string> = Object.fromEntries(
  [...FASHION_CATEGORIES, ...HOME_CATEGORIES].map((c) => [c.id, c.name]),
) as Record<CategoryId, string>;

/** A category Krip currently sells in (used for new products and imports). */
export const isCategoryId = (v: string): v is CategoryId => CATEGORIES.some((c) => c.id === v);
/** Any category Krip has ever used, so old links and records still resolve. */
export const isKnownCategoryId = (v: string): v is CategoryId => Object.hasOwn(CATEGORY_NAME, v);

export const VIBES: { id: VibeId; name: string; line: string }[] = [
  { id: "campus", name: "Campus", line: "Easy layers for long days" },
  { id: "streetwear", name: "Streetwear", line: "Boxy fits, loud details" },
  { id: "everyday", name: "Everyday", line: "Comfy basics on repeat" },
  { id: "date-night", name: "Date Night", line: "A little extra, on purpose" },
  { id: "festive", name: "Festive", line: "Light, bright, celebration-ready" },
];

export const isVibeId = (v: string): v is VibeId => VIBES.some((x) => x.id === v);

export const COLLECTIONS: Record<string, { name: string; line: string }> = {
  trending: { name: "Trending Now", line: "Curated by the Krip team" },
  "aura-edit": { name: "Aura Edit", line: "Soft-glow pieces for every day" },
  "modern-legends": { name: "Modern Legends", line: "Classics, re-cut for now" },
};

export const BUDGETS = [
  { max: 299, label: "Under ₹299" },
  { max: 499, label: "Under ₹499" },
  { max: 999, label: "Under ₹999" },
] as const;

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

export const POLICY_LINKS = [
  { href: "/help/contact", label: "Contact Us" },
  { href: "/help/faq", label: "Help Center & FAQs" },
  { href: "/help/shipping", label: "Shipping & Delivery" },
  { href: "/help/returns", label: "Returns & Refunds" },
  { href: "/help/exchange", label: "Exchange Policy" },
  { href: "/help/cancellation", label: "Cancellation Policy" },
  { href: "/help/refunds", label: "Return & Refund Policy" },
  { href: "/help/privacy", label: "Privacy Policy" },
  { href: "/help/terms", label: "Terms & Conditions" },
  { href: "/help/cookies", label: "Cookie Policy" },
];
