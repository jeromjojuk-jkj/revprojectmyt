// SAMPLE CATALOGUE — illustrative products for the Krip prototype.
// Images are generated illustrations (/art/*), not product photography.
// Measurements, materials and ingredients are placeholders that must be
// replaced with supplier-provided data before any real listing goes live.

import type {
  ArtKind, BeautyInfo, CategoryId, ProductRecord, ReturnPolicy, SizeGuide, Variant, VibeId,
} from "../lib/types.ts";
import * as G from "./size-guides.ts";
import { STORE_MODE } from "../lib/constants.ts";

const RET_7: ReturnPolicy = {
  type: "returnable",
  days: 7,
  note: "Return or exchange within 7 days of delivery if unused, unwashed and with tags attached.",
};
const RET_EXCHANGE: ReturnPolicy = {
  type: "exchange-only",
  days: 7,
  note: "Size exchange within 7 days of delivery. Not eligible for refund-based return.",
};
const RET_HYGIENE_BEAUTY: ReturnPolicy = {
  type: "non-returnable",
  days: 0,
  note: "Not returnable for hygiene reasons once delivered. If the item arrives damaged, leaking or wrong, report it within 48 hours of delivery with photos for a replacement.",
};
const RET_HYGIENE_EARRINGS: ReturnPolicy = {
  type: "non-returnable",
  days: 0,
  note: "Earrings can’t be returned for hygiene reasons. Damaged or wrong items reported within 48 hours of delivery will be replaced.",
};

const STOCK_PATTERN = [6, 12, 0, 9, 4, 15, 7, 3, 10, 0, 8, 5];

function variants(
  code: string,
  colors: [string, string][],
  sizes: string[] | null,
  seed: number,
  zeroAll = false,
): Variant[] {
  const out: Variant[] = [];
  let i = seed;
  for (const [color, hex] of colors) {
    for (const size of sizes ?? [null]) {
      const stock = zeroAll ? 0 : STOCK_PATTERN[i++ % STOCK_PATTERN.length];
      const sizePart = size ? "-" + size.replace(/\s+/g, "") : "";
      out.push({
        sku: `${code}-${color.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}${sizePart}`,
        color,
        colorHex: hex,
        size,
        stock,
      });
    }
  }
  return out;
}

const art = (kind: ArtKind, hex: string) => [`/art/${kind}-${hex.replace("#", "")}-1.svg`, `/art/${kind}-${hex.replace("#", "")}-2.svg`];

interface Def {
  id: string;
  slug: string;
  title: string;
  brand?: string;
  category: CategoryId;
  subcategory: string;
  kind: ArtKind;
  /** Real product photos (served from /public). When absent, generated art is used. */
  images?: string[];
  video?: string;
  features?: string[];
  howToUse?: string[];
  /** Units per variant. When absent, the sample stock pattern is used. */
  stock?: number[];
  seller?: string;
  description: string;
  price: number;
  mrp?: number;
  colors: [string, string][];
  sizes: string[] | null;
  sizeGuide?: SizeGuide;
  fit?: string;
  material?: string;
  care?: string[];
  packageContents?: string;
  origin?: string;
  tags: string[];
  vibes: VibeId[];
  collections?: string[];
  returns?: ReturnPolicy;
  beauty?: BeautyInfo;
  createdAt: string;
  status?: "draft" | "active" | "out-of-stock";
  allOut?: boolean;
  supplier: string;
  costPct: number;
}

const CARE_COTTON = ["Machine wash cold with similar colours", "Do not bleach", "Tumble dry low", "Warm iron inside out"];
const CARE_DELICATE = ["Hand wash cold", "Do not wring", "Dry in shade", "Low iron"];
const CARE_DENIM = ["Wash inside out in cold water", "Wash separately the first few times", "Line dry"];
const CARE_SHOES = ["Wipe with a damp cloth", "Air dry away from direct heat", "Do not machine wash"];
const CARE_JEWEL = ["Keep away from water, perfume and lotions", "Store in the pouch provided", "Wipe with a soft dry cloth"];
const CARE_BAG = ["Wipe clean with a damp cloth", "Stuff with paper when not in use to keep shape", "Avoid prolonged sun exposure"];

const TOPS = ["S", "M", "L", "XL", "XXL"];
const TOPS_OS = ["S", "M", "L", "XL"];
const WTOPS = ["XS", "S", "M", "L", "XL"];
const MB = ["28", "30", "32", "34", "36"];
const WB = ["26", "28", "30", "32", "34"];
const SHOES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"];
const WSHOES = ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7"];

const DEFS: Def[] = [
  // ---------------- Men ----------------
  {
    id: "p001", slug: "constellation-oversized-tee", title: "Constellation Oversized Tee", category: "men", subcategory: "T-Shirts",
    kind: "tee", price: 449, mrp: 799, colors: [["Washed Black", "1f1f1f"], ["Off-White", "f1ede4"], ["Sage Green", "8fa98b"]],
    sizes: TOPS_OS, sizeGuide: G.TOP_OVERSIZED, fit: "Oversized", material: "Cotton", care: CARE_COTTON,
    packageContents: "1 T-shirt", origin: "India", tags: ["oversized", "graphic", "drop shoulder", "tshirt"],
    vibes: ["streetwear", "campus"], collections: ["trending", "modern-legends"],
    description: "Heavyweight 220 GSM cotton tee with a small constellation print on the chest and a dropped shoulder. Boxy through the body, made for layering.",
    createdAt: "2026-10-14", supplier: "Sample Supplier — Tiruppur Knits", costPct: 0.42,
  },
  {
    id: "p002", slug: "everyday-pique-polo", title: "Everyday Piqué Polo", category: "men", subcategory: "T-Shirts",
    kind: "shirt", price: 399, colors: [["Navy", "1e2a4a"], ["White", "fafafa"], ["Maroon", "6b1d2a"]],
    sizes: TOPS, sizeGuide: G.TOP_REGULAR, fit: "Regular", material: "Cotton", care: CARE_COTTON,
    packageContents: "1 polo T-shirt", origin: "India", tags: ["polo", "collar", "basic"],
    vibes: ["everyday", "campus"], collections: ["trending"],
    description: "Breathable cotton piqué polo with a two-button placket and ribbed collar. A no-thought, every-week basic.",
    createdAt: "2026-09-02", supplier: "Sample Supplier — Tiruppur Knits", costPct: 0.45,
  },
  {
    id: "p003", slug: "linen-blend-resort-shirt", title: "Linen-Blend Resort Shirt", category: "men", subcategory: "Shirts",
    kind: "shirt", price: 749, mrp: 1299, colors: [["Sand Beige", "d8c3a0"], ["Sky Blue", "9cc3e6"]],
    sizes: TOPS, sizeGuide: G.TOP_REGULAR, fit: "Relaxed", material: "Linen blend", care: CARE_DELICATE,
    packageContents: "1 shirt", origin: "India", tags: ["linen", "camp collar", "short sleeve", "summer"],
    vibes: ["date-night", "everyday"], collections: ["aura-edit"],
    description: "Camp-collar shirt in a breezy linen-cotton blend. Short sleeves, straight hem — wear it open over a tee or buttoned up.",
    createdAt: "2026-09-21", supplier: "Sample Supplier — Jaipur Weaves", costPct: 0.44,
  },
  {
    id: "p004", slug: "street-cargo-joggers", title: "Street Cargo Joggers", category: "men", subcategory: "Trousers",
    kind: "cargo", price: 899, mrp: 1499, colors: [["Olive", "556b2f"], ["Charcoal", "36393d"]],
    sizes: MB, sizeGuide: G.BOTTOM_MEN, fit: "Relaxed", material: "Cotton twill", care: CARE_COTTON,
    packageContents: "1 pair of joggers", origin: "India", tags: ["cargo", "jogger", "utility", "pants"],
    vibes: ["streetwear", "campus"], collections: ["trending", "modern-legends"],
    description: "Six-pocket cargo joggers in soft cotton twill with an elastic drawcord waist and cuffed hems.",
    createdAt: "2026-10-06", supplier: "Sample Supplier — Delhi Garments", costPct: 0.46,
  },
  {
    id: "p005", slug: "straight-fit-indigo-jeans", title: "Straight-Fit Indigo Jeans", category: "men", subcategory: "Jeans",
    kind: "jeans", price: 999, colors: [["Indigo", "2c3e6b"], ["Light Blue", "8aa7c9"]],
    sizes: MB, sizeGuide: G.BOTTOM_MEN, fit: "Straight", material: "Denim", care: CARE_DENIM,
    packageContents: "1 pair of jeans", origin: "India", tags: ["denim", "jeans", "straight leg"],
    vibes: ["everyday", "campus"], collections: ["modern-legends"],
    description: "Mid-rise straight-leg jeans in 12 oz cotton-rich denim with a touch of stretch for all-day comfort.",
    createdAt: "2026-08-18", supplier: "Sample Supplier — Ahmedabad Denim", costPct: 0.48,
  },
  {
    id: "p006", slug: "halo-zip-hoodie", title: "Halo Zip Hoodie", category: "men", subcategory: "Sweatshirts",
    kind: "hoodie", price: 1199, mrp: 1799, colors: [["Grey Melange", "9ca3af"], ["Black", "18181b"]],
    sizes: TOPS, sizeGuide: G.TOP_REGULAR, fit: "Regular", material: "Cotton fleece", care: CARE_COTTON,
    packageContents: "1 hoodie", origin: "India", tags: ["hoodie", "zip", "fleece", "winter"],
    vibes: ["campus", "streetwear"], collections: ["aura-edit"],
    description: "Brushed-back fleece hoodie with a full zip, kangaroo pockets and a tonal halo embroidery on the back.",
    createdAt: "2026-10-16", supplier: "Sample Supplier — Ludhiana Knitwear", costPct: 0.47,
  },
  {
    id: "p007", slug: "festive-mandarin-kurta", title: "Festive Mandarin Kurta", category: "men", subcategory: "Ethnic Wear",
    kind: "kurti", price: 849, mrp: 1399, colors: [["Mustard", "d4a017"], ["Ivory", "f4efe1"]],
    sizes: TOPS, sizeGuide: G.TOP_REGULAR, fit: "Regular", material: "Cotton silk", care: CARE_DELICATE,
    packageContents: "1 kurta", origin: "India", tags: ["kurta", "ethnic", "mandarin collar", "festive"],
    vibes: ["festive"], collections: ["modern-legends"],
    description: "Mid-length kurta with a mandarin collar and subtle self-texture. Pairs with white pyjamas or straight jeans.",
    createdAt: "2026-10-10", supplier: "Sample Supplier — Lucknow Craft", costPct: 0.45,
  },
  {
    id: "p008", slug: "basic-crew-tee-pack", title: "Basic Crew Tee", category: "men", subcategory: "T-Shirts",
    kind: "tee", price: 249, colors: [["Black", "171717"], ["White", "fafafa"], ["Navy", "1e2a4a"], ["Olive", "556b2f"]],
    sizes: TOPS, sizeGuide: G.TOP_REGULAR, fit: "Regular", material: "Cotton", care: CARE_COTTON,
    packageContents: "1 T-shirt", origin: "India", tags: ["basic", "crew neck", "tshirt", "plain"],
    vibes: ["everyday", "campus"], collections: ["trending"],
    description: "Soft 180 GSM combed-cotton crew neck. Plain, regular fit, easy to stock up on.",
    createdAt: "2026-08-05", supplier: "Sample Supplier — Tiruppur Knits", costPct: 0.5,
  },

  // ---------------- Women ----------------
  {
    id: "p101", slug: "aura-slip-midi-dress", title: "Aura Satin Slip Midi Dress", category: "women", subcategory: "Dresses",
    kind: "dress", price: 999, mrp: 1799, colors: [["Champagne", "e6cfa4"], ["Wine", "5e1a2b"], ["Black", "171717"]],
    sizes: WTOPS, sizeGuide: G.DRESS, fit: "Regular", material: "Satin", care: CARE_DELICATE,
    packageContents: "1 dress", origin: "India", tags: ["slip dress", "satin", "midi", "party"],
    vibes: ["date-night"], collections: ["aura-edit", "trending"],
    description: "Bias-cut satin midi with adjustable straps and a cowl neckline. Fluid, light and quietly glowy.",
    createdAt: "2026-10-12", supplier: "Sample Supplier — Mumbai Studio", costPct: 0.43,
  },
  {
    id: "p102", slug: "ribbed-square-neck-crop-top", title: "Ribbed Square-Neck Crop Top", category: "women", subcategory: "Tops",
    kind: "top", price: 299, mrp: 499, colors: [["Butter Yellow", "f3dc8a"], ["Black", "171717"], ["Lilac", "c4b5fd"]],
    sizes: WTOPS, sizeGuide: G.WOMEN_TOP, fit: "Slim", material: "Cotton rib", care: CARE_COTTON,
    packageContents: "1 top", origin: "India", tags: ["crop top", "ribbed", "square neck"],
    vibes: ["campus", "everyday", "date-night"], collections: ["trending"],
    description: "Stretchy cotton-rib crop top with a square neckline and short sleeves. Sits just above the waist.",
    createdAt: "2026-09-28", supplier: "Sample Supplier — Tiruppur Knits", costPct: 0.44,
  },
  {
    id: "p103", slug: "wide-leg-high-rise-jeans", title: "Wide-Leg High-Rise Jeans", category: "women", subcategory: "Jeans",
    kind: "jeans", price: 949, mrp: 1599, colors: [["Mid Blue", "5b7db1"], ["Ecru", "efe8d8"]],
    sizes: WB, sizeGuide: G.BOTTOM_WOMEN, fit: "Wide leg", material: "Denim", care: CARE_DENIM,
    packageContents: "1 pair of jeans", origin: "India", tags: ["wide leg", "high rise", "denim", "jeans"],
    vibes: ["streetwear", "campus"], collections: ["modern-legends"],
    description: "High-rise jeans with a relaxed wide leg in rigid cotton denim. Full length with a clean hem.",
    createdAt: "2026-09-15", supplier: "Sample Supplier — Ahmedabad Denim", costPct: 0.47,
  },
  {
    id: "p104", slug: "block-print-a-line-kurti", title: "Block-Print A-Line Kurti", category: "women", subcategory: "Ethnic Wear",
    kind: "kurti", price: 549, mrp: 999, colors: [["Indigo Floral", "334b84"], ["Rust Floral", "b4532a"]],
    sizes: TOPS, sizeGuide: G.KURTI, fit: "A-line", material: "Cotton", care: CARE_DELICATE,
    packageContents: "1 kurti", origin: "India", tags: ["kurti", "block print", "ethnic", "floral"],
    vibes: ["festive", "everyday"], collections: ["modern-legends", "trending"],
    description: "Hand-block printed cotton kurti with three-quarter sleeves, a round neck and an A-line flare.",
    createdAt: "2026-10-08", supplier: "Sample Supplier — Jaipur Weaves", costPct: 0.42,
  },
  {
    id: "p105", slug: "pleated-mini-skirt", title: "Pleated Mini Skirt", category: "women", subcategory: "Skirts",
    kind: "skirt", price: 449, colors: [["Grey Check", "8b8f97"], ["Black", "171717"]],
    sizes: ["XS", "S", "M", "L"], sizeGuide: G.SKIRT, fit: "Regular", material: "Polyester blend", care: CARE_DELICATE,
    packageContents: "1 skirt with inner shorts", origin: "India", tags: ["pleated", "mini skirt", "y2k"],
    vibes: ["campus", "date-night"], collections: ["aura-edit"],
    description: "Knife-pleated mini skirt with built-in shorts and a side zip.",
    createdAt: "2026-09-10", supplier: "Sample Supplier — Delhi Garments", costPct: 0.45,
  },
  {
    id: "p106", slug: "boxy-graphic-tee-women", title: "Boxy Graphic Tee — Stardust", category: "women", subcategory: "Tops",
    kind: "tee", price: 349, colors: [["White", "fafafa"], ["Sage Green", "8fa98b"]],
    sizes: TOPS_OS, sizeGuide: G.TOP_OVERSIZED, fit: "Oversized", material: "Cotton", care: CARE_COTTON,
    packageContents: "1 T-shirt", origin: "India", tags: ["graphic", "oversized", "boxy", "tshirt"],
    vibes: ["streetwear", "campus", "everyday"], collections: ["trending"],
    description: "Boxy cotton tee with a hand-drawn stardust graphic on the back. Oversized, unisex sizing.",
    createdAt: "2026-10-17", supplier: "Sample Supplier — Tiruppur Knits", costPct: 0.45,
  },
  {
    id: "p107", slug: "co-ord-shirt-set", title: "Relaxed Co-ord Shirt Set", category: "women", subcategory: "Co-ords",
    kind: "coord", price: 1299, mrp: 2199, colors: [["Mint", "a7d7c5"], ["Peach", "f6c1a1"]],
    sizes: WTOPS, sizeGuide: G.WOMEN_TOP, fit: "Relaxed", material: "Viscose", care: CARE_DELICATE,
    packageContents: "1 shirt, 1 pair of trousers", origin: "India", tags: ["co-ord", "set", "matching set"],
    vibes: ["everyday", "date-night"], collections: ["aura-edit"],
    description: "Matching viscose shirt and elastic-waist trousers. Wear together or split them up.",
    createdAt: "2026-09-25", supplier: "Sample Supplier — Mumbai Studio", costPct: 0.46,
  },
  {
    id: "p108", slug: "festive-mirror-work-dupatta-set", title: "Mirror-Work Kurta & Dupatta Set", category: "women", subcategory: "Ethnic Wear",
    kind: "kurti", price: 1499, mrp: 2499, colors: [["Emerald", "1c6b4a"], ["Fuchsia", "c0267a"]],
    sizes: TOPS, sizeGuide: G.KURTI, fit: "Straight", material: "Rayon", care: CARE_DELICATE,
    packageContents: "1 kurta, 1 dupatta", origin: "India", tags: ["kurta set", "mirror work", "dupatta", "festive"],
    vibes: ["festive"], collections: ["modern-legends"],
    description: "Straight rayon kurta with mirror-work yoke and a matching chiffon dupatta.",
    createdAt: "2026-10-18", supplier: "Sample Supplier — Lucknow Craft", costPct: 0.44,
  },

  // ---------------- Footwear ----------------
  {
    id: "p201", slug: "cloud-chunky-sneakers", title: "Cloud Chunky Sneakers", category: "footwear", subcategory: "Sneakers",
    kind: "sneaker", price: 1299, mrp: 2199, colors: [["White", "f5f5f4"], ["Sage Green", "8fa98b"]],
    sizes: SHOES, sizeGuide: G.FOOTWEAR_UNISEX, material: "Synthetic leather", care: CARE_SHOES,
    packageContents: "1 pair of sneakers", origin: "India", tags: ["chunky", "sneakers", "platform"],
    vibes: ["streetwear", "campus"], collections: ["trending", "aura-edit"],
    description: "Lightweight chunky sneakers with a cushioned EVA sole and padded collar.",
    createdAt: "2026-10-03", supplier: "Sample Supplier — Agra Footwear", costPct: 0.48,
  },
  {
    id: "p202", slug: "everyday-canvas-low-tops", title: "Everyday Canvas Low-Tops", category: "footwear", subcategory: "Sneakers",
    kind: "sneaker", price: 699, colors: [["Black", "18181b"], ["Off-White", "f1ede4"], ["Navy", "1e2a4a"]],
    sizes: SHOES, sizeGuide: G.FOOTWEAR_UNISEX, material: "Canvas", care: CARE_SHOES,
    packageContents: "1 pair of shoes", origin: "India", tags: ["canvas", "sneakers", "low top"],
    vibes: ["everyday", "campus"], collections: ["modern-legends"],
    description: "Classic vulcanised canvas low-tops with a rubber toe cap. Breaks in quickly.",
    createdAt: "2026-08-22", supplier: "Sample Supplier — Agra Footwear", costPct: 0.5,
  },
  {
    id: "p203", slug: "comfy-sliders", title: "Comfy Sliders", category: "footwear", subcategory: "Sliders",
    kind: "slide", price: 249, colors: [["Black", "171717"], ["Lilac", "c4b5fd"], ["Olive", "556b2f"]],
    sizes: SHOES, sizeGuide: G.FOOTWEAR_UNISEX, material: "EVA", care: ["Rinse with water", "Air dry"],
    packageContents: "1 pair of sliders", origin: "India", tags: ["sliders", "flip flop", "home"],
    vibes: ["everyday"], collections: ["trending"],
    description: "Soft, contoured EVA sliders with a textured footbed. Light enough to pack anywhere.",
    createdAt: "2026-09-05", supplier: "Sample Supplier — Kolkata Rubber", costPct: 0.45,
  },
  {
    id: "p204", slug: "block-heel-mules", title: "Block Heel Mules", category: "footwear", subcategory: "Heels",
    kind: "heel", price: 899, mrp: 1499, colors: [["Nude", "d6b49a"], ["Black", "171717"]],
    sizes: WSHOES, sizeGuide: G.FOOTWEAR_WOMEN, material: "Synthetic leather", care: CARE_SHOES,
    packageContents: "1 pair of mules", origin: "India", tags: ["heels", "mules", "block heel"],
    vibes: ["date-night", "festive"], collections: ["aura-edit"],
    description: "Square-toe mules on a stable 2.5 in block heel with a padded insole.",
    createdAt: "2026-09-30", supplier: "Sample Supplier — Agra Footwear", costPct: 0.47,
  },
  {
    id: "p205", slug: "chelsea-ankle-boots", title: "Chelsea Ankle Boots", category: "footwear", subcategory: "Boots",
    kind: "boot", price: 1699, colors: [["Chocolate Brown", "4a2c1d"]],
    sizes: SHOES, sizeGuide: G.FOOTWEAR_UNISEX, material: "Synthetic suede", care: CARE_SHOES,
    packageContents: "1 pair of boots", origin: "India", tags: ["boots", "chelsea", "ankle boots"],
    vibes: ["streetwear", "date-night"], collections: ["modern-legends"], allOut: true, status: "out-of-stock",
    description: "Elastic-gusset Chelsea boots with a pull tab and a grippy rubber sole.",
    createdAt: "2026-08-12", supplier: "Sample Supplier — Agra Footwear", costPct: 0.5,
  },

  // ---------------- Beauty ----------------
  {
    id: "p301", slug: "velvet-matte-lipstick", title: "Velvet Matte Lipstick", brand: "Krip Glow", category: "beauty", subcategory: "Lips",
    kind: "lipstick", price: 249, mrp: 399, colors: [["Rosewood", "a0525a"], ["Brick Red", "9b2d20"], ["Nude Pink", "c98b84"], ["Cherry", "b5122b"]],
    sizes: null, packageContents: "1 lipstick", origin: "India", tags: ["lipstick", "matte", "lip"],
    vibes: ["date-night", "everyday", "festive"], collections: ["trending", "aura-edit"], returns: RET_HYGIENE_BEAUTY,
    beauty: {
      ingredients: "Sample listing — replace with the manufacturer’s full INCI list from the product carton before going live.",
      quantity: "4.2 g", skinTypes: ["All skin types"],
      usage: "Exfoliate and prep lips. Apply from the centre outward; line first for a sharper edge.",
      manufacturer: "Sample manufacturer — details to be added from the product label (name, address and licence number).",
      shelfLife: "Refer to the expiry date printed on the pack.", expiryNote: "Best before date is printed on the pack.",
    },
    description: "Creamy, long-wear matte lipstick with a soft-blur finish.",
    createdAt: "2026-10-01", supplier: "Sample Supplier — Contract cosmetics, Baddi", costPct: 0.4,
  },
  {
    id: "p302", slug: "niacinamide-glow-serum", title: "Niacinamide Glow Serum", brand: "Krip Glow", category: "beauty", subcategory: "Skincare",
    kind: "serum", price: 399, colors: [["30 ml", "f3dc8a"]], sizes: null,
    packageContents: "1 bottle with dropper", origin: "India", tags: ["serum", "niacinamide", "skincare", "glow"],
    vibes: ["everyday"], collections: ["aura-edit"], returns: RET_HYGIENE_BEAUTY,
    beauty: {
      ingredients: "Sample listing — replace with the manufacturer’s full INCI list (including the actual niacinamide percentage) from the carton.",
      quantity: "30 ml", skinTypes: ["Oily", "Combination", "Normal"],
      usage: "Apply 2–3 drops to clean skin, morning and night, before moisturiser. Patch test first.",
      manufacturer: "Sample manufacturer — details to be added from the product label.",
      shelfLife: "Refer to the expiry date and period-after-opening symbol on the pack.",
    },
    description: "Lightweight water-based serum for an even-looking, fresh complexion.",
    createdAt: "2026-09-18", supplier: "Sample Supplier — Contract cosmetics, Baddi", costPct: 0.38,
  },
  {
    id: "p303", slug: "nine-shade-eyeshadow-palette", title: "Constellation Eyeshadow Palette", brand: "Krip Glow", category: "beauty", subcategory: "Eyes",
    kind: "palette", price: 549, mrp: 899, colors: [["Warm Nudes", "c58a5c"], ["Berry Smoke", "6d2f4f"]], sizes: null,
    packageContents: "1 palette with mirror", origin: "India", tags: ["eyeshadow", "palette", "shimmer", "eye"],
    vibes: ["festive", "date-night"], collections: ["modern-legends"], returns: RET_HYGIENE_BEAUTY,
    beauty: {
      ingredients: "Sample listing — replace with the manufacturer’s full ingredient list from the carton.",
      quantity: "9 × 1.1 g", skinTypes: ["All skin types"],
      usage: "Build lighter shades with a fluffy brush; press shimmers on with a fingertip.",
      manufacturer: "Sample manufacturer — details to be added from the product label.",
      shelfLife: "Refer to the expiry date printed on the pack.",
    },
    description: "Nine blendable mattes and shimmers in a compact palette with a full-size mirror.",
    createdAt: "2026-10-11", supplier: "Sample Supplier — Contract cosmetics, Baddi", costPct: 0.4,
  },
  {
    id: "p304", slug: "smudge-proof-kajal", title: "Smudge-Proof Kajal", brand: "Krip Glow", category: "beauty", subcategory: "Eyes",
    kind: "kajal", price: 149, colors: [["Jet Black", "0a0a0a"], ["Deep Brown", "3b2418"]], sizes: null,
    packageContents: "1 twist-up kajal", origin: "India", tags: ["kajal", "kohl", "eyeliner", "eye"],
    vibes: ["everyday", "festive", "campus"], collections: ["trending"], returns: RET_HYGIENE_BEAUTY,
    beauty: {
      ingredients: "Sample listing — replace with the manufacturer’s full ingredient list from the carton.",
      quantity: "0.35 g", skinTypes: ["All skin types"],
      usage: "Glide along the waterline and lash line. Twist up — no sharpening needed.",
      manufacturer: "Sample manufacturer — details to be added from the product label.",
      shelfLife: "Refer to the expiry date printed on the pack.",
    },
    description: "Intense, twist-up kajal that glides on in a single stroke.",
    createdAt: "2026-08-28", supplier: "Sample Supplier — Contract cosmetics, Baddi", costPct: 0.42,
  },
  {
    id: "p305", slug: "dewy-tinted-moisturiser", title: "Dewy Tinted Moisturiser", brand: "Krip Glow", category: "beauty", subcategory: "Face",
    kind: "cream", price: 449, colors: [["Light", "ecc9a8"], ["Medium", "c99a6e"], ["Tan", "a87449"], ["Deep", "6f4a2e"]], sizes: null,
    packageContents: "1 tube", origin: "India", tags: ["tinted moisturiser", "base", "foundation", "dewy"],
    vibes: ["everyday", "date-night"], collections: ["aura-edit"], returns: RET_HYGIENE_BEAUTY,
    beauty: {
      ingredients: "Sample listing — replace with the manufacturer’s full INCI list from the carton.",
      quantity: "30 ml", skinTypes: ["Dry", "Normal", "Combination"],
      usage: "Warm a pea-sized amount between fingertips and press onto skin. Build where needed.",
      manufacturer: "Sample manufacturer — details to be added from the product label.",
      shelfLife: "Refer to the expiry date and period-after-opening symbol on the pack.",
    },
    description: "Sheer, hydrating tint that evens tone and leaves a soft dewy finish.",
    createdAt: "2026-10-15", supplier: "Sample Supplier — Contract cosmetics, Baddi", costPct: 0.39,
  },
  {
    id: "p306", slug: "lip-and-cheek-tint", title: "Lip & Cheek Tint", brand: "Krip Glow", category: "beauty", subcategory: "Lips",
    kind: "serum", price: 199, colors: [["Peach Pop", "f08a6c"], ["Berry", "9d2650"]], sizes: null,
    packageContents: "1 bottle", origin: "India", tags: ["tint", "blush", "lip", "cheek"],
    vibes: ["campus", "everyday"], collections: ["trending"], returns: RET_HYGIENE_BEAUTY,
    beauty: {
      ingredients: "Sample listing — replace with the manufacturer’s full ingredient list from the carton.",
      quantity: "8 ml", skinTypes: ["All skin types"],
      usage: "Dab on cheeks and blend with fingertips; tap onto lips for a stained look.",
      manufacturer: "Sample manufacturer — details to be added from the product label.",
      shelfLife: "Refer to the expiry date printed on the pack.",
    },
    description: "Water-light tint for a flushed, natural pop of colour on lips and cheeks.",
    createdAt: "2026-09-08", supplier: "Sample Supplier — Contract cosmetics, Baddi", costPct: 0.4,
  },

  // ---------------- Bags ----------------
  {
    id: "p401", slug: "everyday-canvas-tote", title: "Everyday Canvas Tote", category: "bags", subcategory: "Totes",
    kind: "tote", price: 349, colors: [["Natural", "e9dfc8"], ["Black", "171717"]], sizes: null,
    material: "Canvas", care: CARE_BAG, packageContents: "1 tote bag", origin: "India",
    tags: ["tote", "canvas", "college bag", "shopper"], vibes: ["campus", "everyday"], collections: ["trending"],
    description: "Sturdy 12 oz canvas tote with an inner zip pocket and a magnetic snap. Fits a 14 in laptop.",
    createdAt: "2026-09-12", supplier: "Sample Supplier — Kolkata Bags", costPct: 0.42,
  },
  {
    id: "p402", slug: "mini-crossbody-sling", title: "Mini Crossbody Sling", category: "bags", subcategory: "Sling Bags",
    kind: "sling", price: 599, mrp: 999, colors: [["Tan", "b07a4a"], ["Black", "171717"], ["Lilac", "c4b5fd"]], sizes: null,
    material: "Vegan leather", care: CARE_BAG, packageContents: "1 sling bag with adjustable strap", origin: "India",
    tags: ["sling", "crossbody", "mini bag", "purse"], vibes: ["date-night", "everyday"], collections: ["aura-edit"],
    description: "Compact crossbody in smooth vegan leather with a zip top and an adjustable strap.",
    createdAt: "2026-10-05", supplier: "Sample Supplier — Kolkata Bags", costPct: 0.44,
  },
  {
    id: "p403", slug: "campus-utility-backpack", title: "Campus Utility Backpack", category: "bags", subcategory: "Backpacks",
    kind: "backpack", price: 999, mrp: 1599, colors: [["Olive", "556b2f"], ["Black", "171717"]], sizes: null,
    material: "Polyester", care: CARE_BAG, packageContents: "1 backpack", origin: "India",
    tags: ["backpack", "laptop bag", "college bag"], vibes: ["campus", "streetwear"], collections: ["modern-legends"],
    description: "Water-resistant 24 L backpack with a padded 15.6 in laptop sleeve and side bottle pockets.",
    createdAt: "2026-08-25", supplier: "Sample Supplier — Delhi Bags", costPct: 0.48,
  },

  // ---------------- Jewellery ----------------
  {
    id: "p501", slug: "halo-hoop-earrings", title: "Halo Hoop Earrings", category: "jewellery", subcategory: "Earrings",
    kind: "earrings", price: 199, mrp: 349, colors: [["Gold Tone", "c9a24a"], ["Silver Tone", "c0c4c8"]], sizes: null,
    material: "Brass", care: CARE_JEWEL, packageContents: "1 pair of earrings, 1 pouch", origin: "India",
    tags: ["hoops", "earrings", "minimal"], vibes: ["everyday", "date-night", "campus"], collections: ["trending", "aura-edit"],
    returns: RET_HYGIENE_EARRINGS,
    description: "Lightweight 30 mm hoops with a hinged clasp. Gold- or silver-tone plating over brass.",
    createdAt: "2026-10-09", supplier: "Sample Supplier — Rajkot Jewels", costPct: 0.35,
  },
  {
    id: "p502", slug: "star-pendant-chain", title: "North Star Pendant Chain", category: "jewellery", subcategory: "Necklaces",
    kind: "necklace", price: 299, colors: [["Gold Tone", "c9a24a"]], sizes: null,
    material: "Stainless steel", care: CARE_JEWEL, packageContents: "1 necklace, 1 pouch", origin: "India",
    tags: ["pendant", "chain", "necklace", "layering"], vibes: ["everyday", "date-night"], collections: ["aura-edit"],
    returns: RET_7,
    description: "Fine 18 in chain with a small star pendant and a 2 in extender. Tarnish-resistant steel.",
    createdAt: "2026-09-22", supplier: "Sample Supplier — Rajkot Jewels", costPct: 0.36,
  },
  {
    id: "p503", slug: "oxidised-jhumkas", title: "Oxidised Jhumkas", category: "jewellery", subcategory: "Earrings",
    kind: "earrings", price: 249, mrp: 449, colors: [["Oxidised Silver", "8a8d91"]], sizes: null,
    material: "Brass", care: CARE_JEWEL, packageContents: "1 pair of earrings", origin: "India",
    tags: ["jhumka", "oxidised", "ethnic", "earrings"], vibes: ["festive"], collections: ["modern-legends", "trending"],
    returns: RET_HYGIENE_EARRINGS,
    description: "Classic bell jhumkas with an oxidised finish and tiny bead drops.",
    createdAt: "2026-10-13", supplier: "Sample Supplier — Rajkot Jewels", costPct: 0.38,
  },
  {
    id: "p504", slug: "beaded-charm-bracelet", title: "Beaded Charm Bracelet", category: "jewellery", subcategory: "Bracelets",
    kind: "bracelet", price: 179, colors: [["Pastel Mix", "f6c1a1"], ["Monochrome", "6b7280"]], sizes: null,
    material: "Glass beads", care: CARE_JEWEL, packageContents: "1 bracelet", origin: "India",
    tags: ["bracelet", "beads", "charm", "stackable"], vibes: ["campus", "everyday"], collections: ["trending"],
    returns: RET_7,
    description: "Stretch bracelet with glass beads and a tiny moon charm. Stack a few.",
    createdAt: "2026-09-03", supplier: "Sample Supplier — Rajkot Jewels", costPct: 0.35,
  },

  // ---------------- Accessories ----------------
  {
    id: "p601", slug: "retro-oval-sunglasses", title: "Retro Oval Sunglasses", category: "accessories", subcategory: "Sunglasses",
    kind: "sunglasses", price: 399, mrp: 699, colors: [["Black", "171717"], ["Tortoise Brown", "6b4423"]], sizes: null,
    material: "Polycarbonate", care: ["Clean with the microfibre pouch", "Store in the case"],
    packageContents: "1 pair of sunglasses, 1 pouch", origin: "China",
    tags: ["sunglasses", "oval", "retro", "uv"], vibes: ["streetwear", "date-night"], collections: ["trending", "modern-legends"],
    description: "Slim oval frames with tinted lenses. Lens protection rating is listed on the in-box tag.",
    createdAt: "2026-10-02", supplier: "Sample Supplier — Delhi Accessories", costPct: 0.35,
  },
  {
    id: "p602", slug: "washed-baseball-cap", title: "Washed Baseball Cap", category: "accessories", subcategory: "Caps",
    kind: "cap", price: 299, colors: [["Washed Black", "2b2b2b"], ["Sand", "d8c3a0"], ["Navy", "1e2a4a"]], sizes: ["Free Size"],
    material: "Cotton", care: ["Hand wash cold", "Reshape and air dry"], packageContents: "1 cap", origin: "India",
    tags: ["cap", "baseball cap", "dad cap"], vibes: ["streetwear", "campus"], collections: ["trending"],
    description: "Soft washed-cotton cap with a curved brim and an adjustable strap back.",
    createdAt: "2026-09-14", supplier: "Sample Supplier — Delhi Accessories", costPct: 0.4,
  },
  {
    id: "p603", slug: "minimal-analog-watch", title: "Minimal Analog Watch", category: "accessories", subcategory: "Watches",
    kind: "watch", price: 899, mrp: 1499, colors: [["Black Dial / Mesh", "1f2937"], ["White Dial / Tan", "b07a4a"]], sizes: null,
    material: "Stainless steel", care: ["Not water resistant — avoid splashes", "Wipe dial and strap with a dry cloth"],
    packageContents: "1 watch, 1 box", origin: "China",
    tags: ["watch", "analog", "minimal"], vibes: ["everyday", "date-night"], collections: ["modern-legends"],
    description: "38 mm case, clean dial, quartz movement. Battery details are listed on the warranty card.",
    createdAt: "2026-08-30", supplier: "Sample Supplier — Delhi Accessories", costPct: 0.45,
  },
  {
    id: "p604", slug: "reversible-belt", title: "Reversible Everyday Belt", category: "accessories", subcategory: "Belts",
    kind: "belt", price: 349, colors: [["Black / Brown", "171717"]], sizes: ["S", "M", "L"],
    sizeGuide: { unit: "in", headers: ["Size", "Fits waist", "Total length"], rows: [["S", "28–30", "38"], ["M", "32–34", "42"], ["L", "36–38", "46"]], howToMeasure: "Measure around the trousers where you wear the belt." },
    material: "PU leather", care: ["Wipe with a dry cloth"], packageContents: "1 belt", origin: "India",
    tags: ["belt", "reversible"], vibes: ["everyday"], collections: [],
    description: "Reversible black/brown belt with a rotating pin buckle.",
    createdAt: "2026-08-08", supplier: "Sample Supplier — Kanpur Leather", costPct: 0.4,
  },
  {
    id: "p605", slug: "satin-scrunchie-set", title: "Satin Scrunchie Set of 3", category: "accessories", subcategory: "Hair Accessories",
    kind: "scrunchie", price: 149, colors: [["Pastels", "f3c6d3"], ["Neutrals", "d8c3a0"]], sizes: null,
    material: "Satin", care: ["Hand wash", "Air dry"], packageContents: "3 scrunchies", origin: "India",
    tags: ["scrunchie", "hair", "satin"], vibes: ["campus", "everyday"], collections: ["aura-edit"],
    description: "Three soft satin scrunchies that are gentle on hair.",
    createdAt: "2026-10-07", supplier: "Sample Supplier — Delhi Accessories", costPct: 0.35,
  },
  {
    id: "p606", slug: "draft-silk-scarf", title: "Printed Silk-Feel Scarf (draft)", category: "accessories", subcategory: "Scarves",
    kind: "scrunchie", price: 399, colors: [["Multi Print", "c2410c"]], sizes: null,
    material: "Polyester satin", packageContents: "1 scarf", tags: ["scarf"], vibes: ["date-night"],
    description: "Draft listing — not visible to shoppers until marked active in admin.",
    createdAt: "2026-10-19", status: "draft", supplier: "Sample Supplier — Delhi Accessories", costPct: 0.4,
  },
];

const RET_HOME: ReturnPolicy = {
  type: "returnable",
  days: 7,
  note: "Return within 7 days of delivery if unused and in the original packaging. Damaged or wrong items reported within 48 hours with photos are replaced.",
};
const W = "Sample Supplier — Delhi Home Goods";

const RET_HYGIENE_HOME: ReturnPolicy = {
  type: "non-returnable",
  days: 0,
  note: "Not returnable once delivered (hygiene or chemical product). If it arrives damaged, leaking or wrong, report it within 48 hours of delivery with photos and we’ll replace it.",
};
const SUPPLIER = "Supplier (confirm in admin)";
const photos = (slug: string, n: number, prefix = "") => Array.from({ length: n }, (_, i) => `/products/${slug}/${prefix}${i + 1}.jpg`);

// Photos replaced with new files (new names, so no image cache serves the old ones).
// Existing stores get these swapped in once, via CATALOG_VERSION.
const REPLACED_PHOTOS: [slug: string, count: number, prefix: string][] = [
  ["drain-sink-cleaner-powder-pack-of-2", 4, "v2-"],
  ["caster-drainex-instant-drain-cleaner-pack-of-5", 4, "v2-"],
];
export const IMAGE_RENAMES: Record<string, string> = Object.fromEntries(
  REPLACED_PHOTOS.flatMap(([slug, n, prefix]) => photos(slug, n).map((old, i) => [old, photos(slug, n, prefix)[i]])),
);

// Krip launch range: the products Krip actually sells, with the supplier's photos.
// Descriptions only state what the product photos and packs show.
// PRICES AND STOCK ARE PLACEHOLDERS until confirmed in Admin → Products.
const HOME_DEFS: Def[] = [
  {
    id: "k001", slug: "daluci-baby-safety-socket-covers", title: "DALUCI Baby Safety Socket Covers, Pack of 15", brand: "DALUCI",
    category: "baby-safety", subcategory: "Socket Covers", kind: "lock", images: photos("daluci-baby-safety-socket-covers", 4), video: "/reels/daluci-socket-covers.mp4",
    price: 199, colors: [["White", "f4f4f2"]], sizes: null, stock: [25], material: "Plastic",
    packageContents: "15 socket covers", tags: ["socket cover", "baby proofing", "child safety", "plug cover", "electrical safety"], vibes: [], collections: ["trending"],
    features: [
      "15 covers — enough for the low sockets around your home",
      "Made for Indian 3-pin (round-pin) wall sockets",
      "Push-in design: press into an unused socket, pull out when you need it",
      "Plain white finish that blends in with most switchboards",
    ],
    howToUse: [
      "Check that the socket is switched off and unused.",
      "Line up the three pins with the socket holes and press the cover in firmly.",
      "To use the socket, pull the cover straight out.",
    ],
    care: ["Covers reduce access to open sockets — they don’t replace supervision", "Check the fit on your socket type before relying on it", "Keep spare covers away from small children (small parts)"],
    description: "Socket covers that plug into unused Indian 3-pin wall sockets so curious little fingers can’t reach the holes. A simple, low-cost way to baby-proof the sockets at your child’s height.",
    createdAt: "2026-10-26", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k002", slug: "drain-sink-cleaner-powder-pack-of-2", title: "Powerful Drain & Sink Cleaner Powder, Pack of 2", brand: "Generic",
    category: "cleaning", subcategory: "Drain Cleaners", kind: "bottle", images: photos("drain-sink-cleaner-powder-pack-of-2", 4, "v2-"),
    price: 299, colors: [["Blue & White", "1e3a8a"]], sizes: null, stock: [25], material: "Powder",
    packageContents: "2 bottles of drain cleaner powder", returns: RET_HYGIENE_HOME,
    tags: ["drain cleaner", "sink", "blocked drain", "bathroom", "kitchen"], vibes: [], collections: ["trending"],
    features: [
      "Powder formula for kitchen sinks, washbasins, bathroom and floor drains",
      "The pack says it dissolves grease, hair, oil and soap scum",
      "Value pack of 2 bottles",
    ],
    howToUse: [
      "Remove standing water from the sink or drain.",
      "Pour the recommended amount of powder into the drain (see the pack).",
      "Add water as directed and wait for the time given on the pack.",
      "Flush with plenty of water.",
    ],
    care: ["Chemical product — keep out of reach of children and pets", "Wear gloves and avoid contact with skin and eyes", "Never mix with other cleaners or acids", "Read the full instructions on the bottle before use"],
    description: "A powder drain and sink cleaner for slow or blocked drains in the kitchen and bathroom. Two bottles, so you have one for each room.",
    createdAt: "2026-10-26", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k003", slug: "caster-drainex-instant-drain-cleaner-pack-of-5", title: "Caster Drainex Instant Drain Cleaner, Pack of 5", brand: "Caster",
    category: "cleaning", subcategory: "Drain Cleaners", kind: "cloth", images: photos("caster-drainex-instant-drain-cleaner-pack-of-5", 4, "v2-"),
    price: 149, colors: [["Blue", "1d4ed8"]], sizes: null, stock: [30], material: "Powder sachets",
    packageContents: "5 one-time-use sachets", returns: RET_HYGIENE_HOME,
    tags: ["drain cleaner", "drainex", "sachet", "shower drain", "sink"], vibes: [], collections: [],
    features: [
      "5 single-use sachets — one sachet per drain",
      "For kitchen sinks, shower drains and bathroom sinks",
      "The pack says it melts grease and hair in blocked drain pipes",
    ],
    howToUse: [
      "Remove excess water from the sink.",
      "Empty the entire sachet into the drain.",
      "Add a cup of water and leave it for 30 minutes.",
      "Pour water to flush the drain clean.",
    ],
    care: ["Chemical product — keep out of reach of children and pets", "Avoid contact with skin and eyes; wear gloves", "Do not mix with other cleaners"],
    description: "Instant drain cleaner in handy one-time sachets. Empty one into a slow drain, add a cup of water, wait 30 minutes and flush.",
    createdAt: "2026-10-25", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k004", slug: "reusable-laundry-washing-balls-12", title: "Reusable Laundry Washing Balls, Pack of 12", brand: "Generic",
    category: "cleaning", subcategory: "Laundry", kind: "cloth", images: photos("reusable-laundry-washing-balls-12", 4),
    price: 199, colors: [["Assorted colours", "22c55e"]], sizes: null, stock: [25], material: "Soft PVC",
    packageContents: "12 laundry balls (assorted colours)", tags: ["laundry balls", "washing machine", "dryer balls", "laundry"], vibes: [], collections: ["trending"],
    features: [
      "12 reusable balls in bright, easy-to-spot colours",
      "Spiky design that tumbles with your clothes in the wash",
      "Works in front-load and top-load machines or a bucket",
    ],
    howToUse: [
      "Put your clothes and 6–10 laundry balls in the machine.",
      "Add water and your usual detergent.",
      "Wash as normal, then take the balls out before drying.",
    ],
    care: ["Use together with your usual detergent", "Rinse the balls and let them air dry after use"],
    description: "Colourful reusable balls that go into the wash with your clothes. Use 6–10 per load along with your regular detergent.",
    createdAt: "2026-10-24", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k005", slug: "magic-eraser-cleaning-sponge-pack-of-4", title: "Magic Eraser Cleaning Sponge, Pack of 4", brand: "Generic",
    category: "cleaning", subcategory: "Sponges", kind: "cloth", images: photos("magic-eraser-cleaning-sponge-pack-of-4", 4),
    price: 149, colors: [["White", "fafafa"]], sizes: null, stock: [30], material: "Melamine foam",
    packageContents: "4 melamine sponges", tags: ["magic eraser", "melamine sponge", "stain remover", "shoe cleaner"], vibes: [], collections: ["trending"],
    features: [
      "Melamine foam that cleans with just water — no soap needed",
      "Multi-purpose: sinks, cups and dishes, white shoes, keyboards, sofas and grills",
      "Pack of 4",
    ],
    howToUse: [
      "Wet the sponge with water.",
      "Squeeze out the extra water.",
      "Rub the stain gently, like an eraser.",
      "Rinse the sponge and reuse until it wears down.",
    ],
    care: ["Test on a small hidden area first", "Avoid glossy, polished, painted or non-stick surfaces", "Not for use on skin"],
    description: "Melamine ‘magic eraser’ sponges that lift scuffs and stains with just water — great for white sneakers, cups, sinks and everyday marks.",
    createdAt: "2026-10-23", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k006", slug: "natuvera-hair-removal-cream-spray-100ml", title: "Natuvera Hair Removal Cream Spray, 100 ml", brand: "Natuvera",
    category: "personal-care", subcategory: "Hair Removal", kind: "serum", images: photos("natuvera-hair-removal-cream-spray-100ml", 2),
    price: 249, colors: [["100 ml", "171717"]], sizes: null, stock: [25], material: "Cream spray",
    packageContents: "1 spray bottle, 100 ml", returns: RET_HYGIENE_HOME,
    tags: ["hair removal", "body hair", "cream spray", "men", "women"], vibes: [], collections: [],
    features: [
      "Cream in a pump spray bottle for quick application",
      "Labelled for all skin types",
      "For body hair on chest, arms and legs",
    ],
    howToUse: [
      "Do a patch test on a small area 24 hours before first use.",
      "Spray an even layer over clean, dry skin.",
      "Leave on only for the time given on the bottle.",
      "Wipe off with a damp cloth and rinse the area with water.",
    ],
    care: ["Not for the face, private areas, or broken or irritated skin", "Stop and rinse immediately if you feel burning or irritation", "Keep out of reach of children"],
    description: "Natuvera hair removal cream in a 100 ml spray bottle for body hair. Ingredients, usage time and manufacturer details are printed on the bottle.",
    createdAt: "2026-10-22", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k007", slug: "collapsible-face-ice-bath-bowl", title: "Collapsible Face Ice Bath Bowl with Ice Tray", brand: "Generic",
    category: "personal-care", subcategory: "Face Care", kind: "holder", images: photos("collapsible-face-ice-bath-bowl", 3),
    price: 349, colors: [["Assorted colours", "a78bfa"]], sizes: null, stock: [20], material: "Silicone",
    packageContents: "1 collapsible bowl with ice-tray lid (colour as available)", tags: ["ice bath", "face ice bowl", "skin care", "ice facial"], vibes: [], collections: ["trending"],
    features: [
      "Built-in ice tray lid — make the ice in the same bowl, no extra trays",
      "Collapsible silicone that folds flat to store",
      "For quick ice-water face dips at home",
    ],
    howToUse: [
      "Fill the ice-tray lid with water and freeze it.",
      "Release the ice into the bowl.",
      "Add cold water and dip your face for a few seconds at a time.",
    ],
    care: ["Keep each dip short; stop if your skin feels numb or irritated", "Wash and dry the bowl after use"],
    description: "A foldable silicone bowl with its own ice-tray lid for at-home ice facials. Freeze, release the ice, add water and dip.",
    createdAt: "2026-10-21", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k008", slug: "silicone-ice-face-roller-pack-of-3", title: "Silicone Ice Face Roller, Pack of 3", brand: "Generic",
    category: "personal-care", subcategory: "Face Care", kind: "serum", images: photos("silicone-ice-face-roller-pack-of-3", 4),
    price: 299, colors: [["Pink, Purple & Blue", "f472b6"]], sizes: null, stock: [25], material: "Food-grade silicone (as stated by the supplier)",
    packageContents: "3 ice moulds: pink, purple and blue", tags: ["ice roller", "face ice", "skin care", "ice cube mould"], vibes: [], collections: ["trending"],
    features: [
      "Pack of 3 reusable ice moulds",
      "One-piece sealing cover and a thick sealing ring to stop leaks",
      "Freeze water or a herbal mix and glide the ice over your face",
    ],
    howToUse: [
      "Fill the mould with water (you can add flowers or cucumber slices) and close it.",
      "Freeze until solid.",
      "Peel back the silicone a little and glide the ice gently over your face.",
    ],
    care: ["Keep the ice moving; don’t hold it on one spot", "Stop if your skin feels numb or irritated", "Wash the mould before refilling"],
    description: "Capsule-shaped silicone ice moulds for a cool, refreshing face massage. Three colours in one pack.",
    createdAt: "2026-10-21", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k009", slug: "soap-dispenser-with-sponge-holder", title: "2-in-1 Soap Dispenser with Sponge Holder", brand: "Generic",
    category: "kitchen", subcategory: "Sink Organisers", kind: "organizer", images: photos("soap-dispenser-with-sponge-holder", 3),
    price: 249, colors: [["Teal Green", "0f766e"]], sizes: null, stock: [20], material: "Plastic",
    packageContents: "Dispenser base with 2-part liquid container, 2 pumps, draining tray and 1 scrub sponge",
    tags: ["soap dispenser", "dish wash", "sponge holder", "sink organiser", "hand wash"], vibes: [], collections: ["trending"],
    features: [
      "Two compartments: dish-wash liquid and hand-wash liquid",
      "Press the sponge down to pump dish soap straight onto it",
      "Draining tray keeps the sponge dry",
      "Size: 19.5 × 9 × 10.25 cm",
    ],
    howToUse: [
      "Fill one side with dish-wash liquid and the other with hand-wash.",
      "Fit the cover, pumps and draining tray, then place the sponge on top.",
      "Press the sponge down to get dish soap; use the side pump for hand wash.",
    ],
    care: ["Rinse the draining tray regularly", "Replace the sponge when worn"],
    description: "A tidy sink-side caddy that holds your scrub sponge, dispenses dish soap when you press the sponge, and has a separate pump for hand wash.",
    createdAt: "2026-10-26", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k010", slug: "rechargeable-electric-arc-lighter", title: "Rechargeable Electric Arc Lighter for Gas Stove", brand: "Generic",
    category: "kitchen", subcategory: "Lighters", kind: "stand", images: photos("rechargeable-electric-arc-lighter", 4),
    price: 299, colors: [["Assorted colours", "27272a"]], sizes: null, stock: [25], material: "Metal and plastic",
    packageContents: "1 lighter (colour as available), USB charging cable",
    tags: ["gas lighter", "arc lighter", "usb lighter", "candle lighter", "kitchen"], vibes: [], collections: ["trending"],
    features: [
      "Flameless electric arc — no gas or fuel refills",
      "USB Type-C rechargeable; the supplier states about 600 lights per full charge",
      "360° flexible neck reaches gas burners and deep candle jars",
      "LED battery indicator, safety on/off switch and hanging hook",
    ],
    howToUse: [
      "Charge fully using the USB cable before first use.",
      "Slide the safety switch to ON.",
      "Hold the tip near the burner or wick and press the button to create the arc.",
      "Switch it back OFF after use.",
    ],
    care: ["Keep away from children — this is not a toy", "Don’t touch the arc tip", "Keep away from water; charge away from heat"],
    description: "A long, rechargeable arc lighter for gas stoves, candles and diyas. Charge it by USB instead of buying matchboxes or refills.",
    createdAt: "2026-10-26", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k011", slug: "oil-sprayer-dispenser-2-in-1", title: "2-in-1 Oil Sprayer & Pourer Bottle", brand: "Generic",
    category: "kitchen", subcategory: "Oil Dispensers", kind: "bottle", images: photos("oil-sprayer-dispenser-2-in-1", 4),
    price: 349, colors: [["Assorted colours", "84cc16"]], sizes: null, stock: [20], material: "Glass bottle, plastic cap",
    packageContents: "1 oil bottle with spray-and-pour cap (colour as available)",
    tags: ["oil sprayer", "oil dispenser", "air fryer", "cooking spray", "kitchen"], vibes: [], collections: ["trending"],
    features: [
      "Spray or pour from one bottle",
      "Press lightly for a straight line, press fully for a fine mist",
      "Silicone gaskets at the outlet and bottle mouth to help prevent leaks",
      "Wide mouth makes refilling easy",
    ],
    howToUse: [
      "Fill the bottle with cooking oil through the wide mouth and close the cap.",
      "To spray, press the trigger — lightly for a line, fully for a mist.",
      "To pour, tilt the bottle.",
    ],
    care: ["Hand wash only", "Keep the nozzle clean so the spray stays even"],
    description: "A glass oil bottle that sprays or pours, so you use only as much oil as you need for salads, tawa cooking and air frying.",
    createdAt: "2026-10-25", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k012", slug: "compressed-face-towel-tablets", title: "Compressed Face Towel Tablets (pack size to confirm)", brand: "Generic",
    category: "personal-care", subcategory: "Face Care", kind: "cloth", images: photos("compressed-face-towel-tablets", 4),
    price: 149, colors: [["White", "fafafa"]], sizes: null, stock: [0], material: "Non-woven fabric",
    packageContents: "Individually wrapped compressed towels — confirm the count before listing", returns: RET_HYGIENE_HOME,
    tags: ["compressed towel", "coin tissue", "travel towel", "face mask sheet"], vibes: [], collections: [],
    features: ["Individually wrapped coin-size towels that expand in water", "Handy for travel, the gym and your bag", "Can also be soaked in toner for a DIY sheet mask"],
    howToUse: ["Unwrap a tablet and drop it into a little water.", "Wait a few seconds while it expands.", "Unroll it and use."],
    care: ["Single use", "Keep dry until use"],
    description: "Coin-size compressed towels that expand into a soft wipe when you add water. Draft until the pack size is confirmed.",
    createdAt: "2026-10-20", status: "draft", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k013", slug: "square-kitchen-storage-containers-black-lid", title: "Square Kitchen Storage Containers with Black Lids (pack size to confirm)", brand: "Generic",
    category: "kitchen", subcategory: "Storage Containers", kind: "bottle", images: photos("square-kitchen-storage-containers-black-lid", 4),
    price: 299, colors: [["Clear with black lid", "171717"]], sizes: null, stock: [0], material: "Clear plastic body, black plastic lid",
    packageContents: "Square containers with lids — confirm the number per pack before listing",
    tags: ["storage container", "kitchen container", "dal box", "spice jar", "pantry organiser", "stackable"], vibes: [], collections: [],
    features: [
      "Each container is about 10 cm wide and 8 cm tall",
      "Clear body so you can see what’s inside at a glance",
      "Square shape and flat lids stack neatly on a shelf",
      "Handy for dals, rice, pulses, dry fruits, pasta and spices",
    ],
    howToUse: [
      "Wash and dry the containers before first use.",
      "Fill with dry groceries and press the lid down all round.",
      "Stack them to save shelf space.",
    ],
    care: ["Hand wash with mild soap", "Dry fully before refilling", "For dry foods; don’t microwave"],
    description: "Clear square containers with black lids for keeping dals, pulses, dry fruits and snacks tidy in the kitchen. About 10 × 8 cm each. Draft until the number of containers in a pack is confirmed.",
    createdAt: "2026-10-28", status: "draft", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k014", slug: "floral-stainless-steel-knife-set-of-3", title: "Floral Print Stainless Steel Kitchen Knife Set of 3", brand: "Generic",
    category: "kitchen", subcategory: "Knives", kind: "lock", images: photos("floral-stainless-steel-knife-set-of-3", 4),
    price: 349, colors: [["Teal floral", "2dd4bf"]], sizes: null, stock: [20], material: "Stainless steel blades with printed coating, plastic handles",
    packageContents: "3 knives: fruit knife, chef knife, cleaver-style kitchen knife",
    tags: ["knife set", "kitchen knife", "chef knife", "fruit knife", "vegetable knife", "cleaver"], vibes: [], collections: ["trending"],
    features: [
      "Fruit knife — 19.5 cm long, 2.5 cm blade, about 30 g",
      "Chef knife — 26 cm long, 3.5 cm blade, about 65 g",
      "Kitchen (cleaver-style) knife — 26 cm long, 5.5 cm blade, about 105 g",
      "Stainless steel blades with a bright orange-and-flower print",
      "Textured handles for a steady grip",
    ],
    howToUse: [
      "Use the fruit knife for peeling and small cuts.",
      "Use the chef knife for slicing vegetables, fruit and herbs.",
      "Use the wide kitchen knife for chopping and for scooping chopped food off the board.",
      "Always cut on a chopping board.",
    ],
    care: ["Hand wash and dry straight away", "Store safely, away from children", "Don’t use on glass, stone or metal surfaces"],
    description: "A colourful set of three stainless steel knives — fruit knife, chef knife and a wide kitchen knife — for everyday cutting, slicing and chopping. Sizes and weights as listed by the supplier.",
    createdAt: "2026-10-28", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k015", slug: "stainless-steel-sink-strainer-11cm", title: "Stainless Steel Kitchen Sink Strainer, 11 cm (Size No. 3)", brand: "Generic",
    category: "kitchen", subcategory: "Sink Accessories", kind: "lock", images: photos("stainless-steel-sink-strainer-11cm", 4),
    price: 99, colors: [["Steel", "a3a3a3"]], sizes: null, stock: [30], material: "Stainless steel mesh (supplier lists 18-10 grade)",
    packageContents: "1 sink strainer",
    tags: ["sink strainer", "sink jali", "drain mesh", "kitchen sink", "basin strainer"], vibes: [], collections: ["trending"],
    features: [
      "Outer ring 11 cm, inner mesh 8 cm, depth 3.5 cm (Size No. 3)",
      "Fine mesh catches food scraps before they block the drain",
      "Wide rim rests on the drain opening — just drop it in",
      "Lift out, empty and rinse",
    ],
    howToUse: [
      "Measure your sink drain — this fits openings up to about 11 cm across.",
      "Place the strainer in the drain hole.",
      "Empty the scraps into the bin and rinse the mesh after use.",
    ],
    care: ["Rinse after each use", "Scrub the mesh with a brush now and then"],
    description: "A stainless steel mesh strainer that sits in your kitchen sink drain and catches food bits so the drain stays clear. 11 cm outer ring, 8 cm mesh, 3.5 cm deep. Pack of 1.",
    createdAt: "2026-10-28", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k016", slug: "black-garbage-bags-medium-60-bags", title: "Black Garbage Bags, Medium 19 × 21 in, 60 Bags (2 Rolls)", brand: "Generic",
    category: "cleaning", subcategory: "Garbage Bags", kind: "cloth", images: photos("black-garbage-bags-medium-60-bags", 3),
    price: 149, colors: [["Black", "111111"]], sizes: null, stock: [40], material: "Plastic",
    packageContents: "2 rolls, 60 bags in total", returns: RET_HYGIENE_HOME,
    tags: ["garbage bag", "dustbin bag", "trash bag", "bin liner", "kachra bag"], vibes: [], collections: [],
    features: [
      "Medium size: 19 × 21 inches",
      "60 bags on 2 tear-off rolls",
      "Black, so the contents aren’t on show",
      "Fits small and medium home dustbins",
    ],
    howToUse: [
      "Tear one bag off the roll along the perforation.",
      "Open it and fold the top over the rim of the dustbin.",
      "When full, gather the top and tie a knot.",
    ],
    care: ["Don’t overfill or put sharp objects in loose", "Store away from children"],
    description: "Medium black garbage bags for home dustbins — 19 × 21 inches, 60 bags on 2 rolls.",
    createdAt: "2026-10-28", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k017", slug: "derma-roller-540-titanium-needles", title: "Derma Roller, 540 Needles (needle length to confirm)", brand: "Generic",
    category: "personal-care", subcategory: "Skin & Hair Tools", kind: "lock", images: photos("derma-roller-540-titanium-needles", 4),
    price: 299, colors: [["Black & pink", "be185d"]], sizes: null, stock: [0], material: "Titanium alloy needles, plastic handle",
    packageContents: "1 derma roller in box", returns: RET_HYGIENE_HOME,
    tags: ["derma roller", "microneedle roller", "face roller", "scalp roller", "skin care tool"], vibes: [], collections: [],
    features: [
      "540 titanium-alloy needles on the roller (as labelled on the box)",
      "Curved, non-slip handle",
      "For home use, on the face or scalp",
    ],
    howToUse: [
      "Clean your skin first.",
      "Sterilise the roller head with 70% isopropyl alcohol and let it dry.",
      "Roll gently over the area 4–5 times in each direction — don’t press hard.",
      "Rinse and sterilise the roller again after use, then store it in its case.",
    ],
    care: [
      "Never share your roller",
      "Don’t use on cuts, active acne, rashes, sunburn or infected skin",
      "Do a patch test first; stop if irritation lasts. Check with a dermatologist if you have a skin condition",
      "Replace the roller when the needles look bent or blunt",
    ],
    description: "A 540-needle derma roller for home skincare and scalp-care routines. Draft until the needle length (e.g. 0.25 mm, 0.5 mm, 1.0 mm) is confirmed from the box.",
    createdAt: "2026-10-28", status: "draft", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k018", slug: "clazkit-ice-pop-mould-6-slots", title: "Clazkit Ice Pop & Kulfi Mould, 6 Slots", brand: "Clazkit",
    category: "kitchen", subcategory: "Ice & Kulfi Moulds", kind: "bottle", images: photos("clazkit-ice-pop-mould-6-slots", 2),
    price: 199, colors: [["Blue & red", "38bdf8"]], sizes: null, stock: [25], material: "Plastic",
    packageContents: "1 stand with 6 moulds and 6 stick lids",
    tags: ["ice pop mould", "kulfi mould", "popsicle maker", "ice cream mould", "summer", "kids"], vibes: [], collections: ["trending"],
    features: [
      "Makes 6 ice pops or kulfis at a time",
      "Each mould has its own lid with a built-in stick",
      "Stand keeps the moulds upright in the freezer",
      "About 10 × 10 cm, weighs about 100 g",
    ],
    howToUse: [
      "Wash the moulds and lids before first use.",
      "Fill each mould with juice, milkshake, kulfi mix or fruit purée, leaving a little space at the top.",
      "Press the stick lids on and stand the set in the freezer until frozen solid.",
      "To release, hold the mould under running water for a few seconds and pull the stick.",
    ],
    care: ["Hand wash with warm, soapy water", "Don’t use in the microwave or dishwasher"],
    description: "A 6-slot ice pop mould with a stand and stick lids — make homemade kulfi, juice pops and fruit ice lollies for the family.",
    createdAt: "2026-10-29", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k019", slug: "clear-corner-guards-pack-of-4", title: "Clear Table Corner Guards for Baby Safety, Pack of 4", brand: "Generic",
    category: "baby-safety", subcategory: "Corner Guards", kind: "lock", images: photos("clear-corner-guards-pack-of-4", 4),
    price: 149, colors: [["Transparent", "e5e7eb"]], sizes: null, stock: [30], material: "Soft PVC with adhesive stickers",
    packageContents: "4 corner guards with adhesive stickers",
    tags: ["corner guard", "corner protector", "baby proofing", "child safety", "table edge"], vibes: [], collections: ["trending"],
    features: [
      "Soft, flexible PVC cushions sharp table and furniture corners",
      "Clear, so it doesn’t hide your furniture",
      "Sticks on with adhesive — no screws or tools",
      "Fits corners on wood, glass, marble and plastic tables",
      "Pack of 4 — enough for one table",
    ],
    howToUse: [
      "Clean and dry the corner.",
      "Peel and apply the 2 adhesive stickers inside the guard.",
      "Place it on the corner and adjust the fit.",
      "Press and hold for 30 seconds. Let it set for a few hours before little ones play nearby.",
    ],
    care: ["Wipe with a damp cloth", "Check now and then that the guards are still firmly stuck", "Corner guards reduce knocks but don’t replace supervision"],
    description: "Clear, soft PVC guards that stick onto sharp table and furniture corners to soften bumps for crawling babies and toddlers. Pack of 4.",
    createdAt: "2026-10-29", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k020", slug: "manual-hand-juicer-2-in-1-with-jug", title: "2-in-1 Manual Hand Juicer with Jug", brand: "Generic",
    category: "kitchen", subcategory: "Juicers", kind: "bottle", images: photos("manual-hand-juicer-2-in-1-with-jug", 4),
    price: 199, colors: [["Assorted colours", "f97316"]], sizes: null, stock: [25], material: "Plastic",
    packageContents: "1 jug with lid, 1 juicer top with strainer, 1 press (colour as available)",
    tags: ["hand juicer", "manual juicer", "citrus squeezer", "lemon squeezer", "orange juicer", "pomegranate juicer"], vibes: [], collections: ["trending"],
    features: [
      "Two ways to juice: twist halved oranges, mosambi and lemons on the cone",
      "Or put pomegranate seeds or watermelon pieces in the cup and press down with the lid",
      "Strainer holds back seeds and pulp",
      "Juice collects in a clear jug with a handle, spout and measuring marks",
      "No electricity needed",
    ],
    howToUse: [
      "Citrus: cut the fruit in half, press it onto the cone and twist.",
      "Pomegranate or watermelon: put the seeds or pieces in the strainer cup, fit the press on top and push down firmly.",
      "Lift off the top and pour the juice from the jug.",
    ],
    care: ["Hand wash all parts straight after use", "Dry fully before storing"],
    description: "A manual juicer that sits on its own jug — twist citrus fruits on the cone, or press pomegranate seeds and watermelon through the strainer for fresh juice without a mixer. Colour as available.",
    createdAt: "2026-10-29", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k021", slug: "washbag-toiletry-pouch-set-of-3", title: "Frosted Washbag Toiletry Pouch Set of 3", brand: "Generic",
    category: "personal-care", subcategory: "Travel & Toiletry Bags", kind: "holder", images: photos("washbag-toiletry-pouch-set-of-3", 3),
    price: 299, colors: [["Light blue", "bfdbfe"]], sizes: null, stock: [20], material: "Frosted see-through panel with zip",
    packageContents: "3 zip pouches: large with handles, medium and small with wrist straps",
    tags: ["washbag", "toiletry bag", "travel pouch", "cosmetic pouch", "makeup bag", "organiser"], vibes: [], collections: ["trending"],
    features: [
      "Large: about 30 × 22 × 11 cm, with two carry handles",
      "Medium: about 26 × 16 × 9 cm, with a wrist strap",
      "Small: about 21 × 12 × 7 cm, with a wrist strap",
      "Frosted see-through front, so you can spot what’s inside",
      "Zip closure on all three",
    ],
    howToUse: [
      "Use the large bag for towels, bottles and bigger toiletries.",
      "Keep makeup, skincare or chargers in the medium pouch.",
      "Use the small pouch for brushes, razors, medicines or small items.",
    ],
    care: ["Wipe clean with a damp cloth", "Let it dry fully before zipping"],
    description: "A set of three frosted zip pouches in different sizes for toiletries, makeup and travel essentials — the large one has carry handles, the two smaller ones have wrist straps. Sizes as listed by the supplier.",
    createdAt: "2026-11-02", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k022", slug: "adhesive-wall-shelf-figurine-supports", title: "Adhesive Wall Shelf with Figure Supports, No Drilling", brand: "Generic",
    category: "kitchen", subcategory: "Wall Shelves", kind: "holder", images: photos("adhesive-wall-shelf-figurine-supports", 4),
    price: 249, colors: [["Colour as available", "e5e7eb"]], sizes: null, stock: [20], material: "Plastic shelf, adhesive wall pads",
    packageContents: "1 shelf with 2 figure-shaped supports and adhesive wall pads (colour as available)",
    tags: ["wall shelf", "bathroom shelf", "kitchen shelf", "adhesive shelf", "no drill", "spice rack"], vibes: [], collections: ["trending"],
    features: [
      "Sticks to the wall — no drilling or screws",
      "About 33 cm long, 13.5 cm deep and 14.5 cm high",
      "Two playful figure-shaped supports hold the shelf",
      "For bathrooms, kitchens and bedside — toiletries, spice jars, small plants",
    ],
    howToUse: [
      "Clean and dry the wall where the shelf will go.",
      "Clip the supports into the adhesive pads.",
      "Peel off the backing film and press the pads firmly onto the wall.",
      "Wait a few hours before placing items, and keep loads light.",
    ],
    care: ["Use on smooth tiles, glass or painted walls — not on rough, damp or peeling surfaces", "Don’t overload; heavy items can pull the pads off"],
    description: "A no-drill wall shelf held up by two cute figure-shaped supports. Stick it on bathroom or kitchen tiles for toiletries, spice jars or small décor. About 33 × 13.5 × 14.5 cm. Colour as available.",
    createdAt: "2026-11-02", supplier: SUPPLIER, costPct: 0,
  },
  {
    id: "k023", slug: "wooden-india-map-puzzle-states-capitals", title: "Wooden India Map Puzzle — States, Capitals & Union Territories", brand: "Generic",
    category: "kids-learning", subcategory: "Educational Puzzles", kind: "holder", images: photos("wooden-india-map-puzzle-states-capitals", 4),
    price: 349, colors: [["Multicolour", "f59e0b"]], sizes: null, stock: [15], material: "Wood",
    packageContents: "1 wooden board with removable state pieces and knobs",
    returns: RET_HOME,
    tags: ["india map puzzle", "wooden puzzle", "educational toy", "geography", "states and capitals", "kids"], vibes: [], collections: ["trending"],
    features: [
      "Colourful wooden map of India with the states, capitals and union territories marked",
      "Pieces lift out by their wooden knobs and fit back in place",
      "Board about 30 cm tall",
      "Shows neighbouring countries, seas and landmarks",
    ],
    howToUse: [
      "Lift the pieces out by their knobs and mix them up.",
      "Fit each state back in its place, reading its name and capital.",
      "Play together and quiz each other on states and capitals.",
    ],
    care: ["Contains small pieces — not for children under 3; play under adult supervision", "Wipe with a dry cloth; keep away from water"],
    description: "A wooden India map puzzle with removable state pieces and knobs — a hands-on way for children to learn states, capitals and union territories. The board is about 30 cm tall.",
    createdAt: "2026-11-02", supplier: SUPPLIER, costPct: 0,
  },
];

/** Bump when products are added to HOME_DEFS so existing stores pick them up. */
export const CATALOG_VERSION = 6;

function shippingFor(cat: CategoryId) {
  return cat === "footwear" ? 70 : cat === "bags" ? 60 : cat === "jewellery" || cat === "beauty" ? 40 : 50;
}

/** Sample catalogue for the current store mode (or the one asked for). */
export function buildSeedProducts(mode: "home" | "fashion" = STORE_MODE): ProductRecord[] {
  const defs = mode === "fashion" ? DEFS : HOME_DEFS;
  return defs.map((d, idx) => {
    const code = d.id.toUpperCase();
    const vs = variants(code, d.colors, d.sizes, idx * 3, d.allOut).map((v, i) => (d.stock ? { ...v, stock: d.stock[i] ?? d.stock[0] } : v));
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      brand: d.brand ?? (d.category === "beauty" ? "Krip Glow" : mode === "home" ? "Krip Home" : "Krip Studio"),
      category: d.category,
      subcategory: d.subcategory,
      description: d.description,
      price: d.price,
      mrp: d.mrp ?? null,
      images: d.images ?? art(d.kind, d.colors[0][1]),
      video: d.video ?? null,
      features: d.features ?? [],
      howToUse: d.howToUse ?? [],
      variants: vs,
      sizeGuide: d.sizeGuide ?? null,
      fit: d.fit ?? null,
      material: d.material ?? null,
      care: d.care ?? [],
      packageContents: d.packageContents ?? null,
      origin: d.origin ?? null,
      seller: d.seller ?? (mode === "home" ? "Krip" : "Krip (sample seller details)"),
      styleTags: d.tags,
      vibes: d.vibes,
      collections: d.collections ?? [],
      returnPolicy: d.returns ?? (mode === "home" ? RET_HOME : d.category === "footwear" || d.category === "men" || d.category === "women" ? RET_7 : d.category === "accessories" && d.kind === "cap" ? RET_EXCHANGE : RET_7),
      beauty: d.beauty ?? null,
      reviews: [],
      channelListings: [],
      createdAt: new Date(d.createdAt + "T10:00:00+05:30").toISOString(),
      status: d.status ?? "active",
      isSample: !d.images,
      private: {
        supplierName: d.supplier,
        sourceRef: `SRC-${code}`,
        purchaseCost: Math.round(d.price * d.costPct),
        shippingCost: shippingFor(d.category),
        channelPrices: [{ channel: "Krip", price: d.price }],
        // Supplier photos: Krip must have the supplier's permission to use them.
        rightsConfirmed: true,
      },
    };
  });
}

export interface Look {
  id: string;
  name: string;
  vibe: VibeId;
  line: string;
  /** Product id + preferred colour (optional). */
  items: { productId: string; color?: string }[];
}

const FASHION_LOOKS: Look[] = [
  {
    id: "campus-uniform", name: "The Campus Uniform", vibe: "campus", line: "Oversized tee, cargos, chunky kicks.",
    items: [{ productId: "p001", color: "Washed Black" }, { productId: "p004", color: "Olive" }, { productId: "p201", color: "White" }, { productId: "p401", color: "Natural" }],
  },
  {
    id: "aura-date-night", name: "Aura After Dark", vibe: "date-night", line: "Satin, soft gold and a little shine.",
    items: [{ productId: "p101", color: "Champagne" }, { productId: "p204", color: "Nude" }, { productId: "p402", color: "Tan" }, { productId: "p501", color: "Gold Tone" }],
  },
  {
    id: "modern-legend-festive", name: "Modern Legend — Festive", vibe: "festive", line: "Block print, jhumkas, a pop of berry.",
    items: [{ productId: "p104", color: "Indigo Floral" }, { productId: "p503" }, { productId: "p204", color: "Black" }, { productId: "p303", color: "Berry Smoke" }],
  },
  {
    id: "street-signal", name: "Street Signal", vibe: "streetwear", line: "Boxy, utility, retro shades.",
    items: [{ productId: "p106", color: "Sage Green" }, { productId: "p103", color: "Mid Blue" }, { productId: "p602", color: "Washed Black" }, { productId: "p601", color: "Black" }],
  },
  {
    id: "everyday-easy", name: "Everyday Easy", vibe: "everyday", line: "Repeat-worthy basics, done right.",
    items: [{ productId: "p008", color: "White" }, { productId: "p005", color: "Indigo" }, { productId: "p202", color: "Black" }, { productId: "p603" }],
  },
];

// Looks are a fashion feature; the home range has none.
export const LOOKS: Look[] = (STORE_MODE as string) === "fashion" ? FASHION_LOOKS : [];
