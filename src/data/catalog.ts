// SAMPLE CATALOGUE — illustrative products for the Krip prototype.
// Images are generated illustrations (/art/*), not product photography.
// Measurements, materials and ingredients are placeholders that must be
// replaced with supplier-provided data before any real listing goes live.

import type {
  ArtKind, BeautyInfo, CategoryId, ProductRecord, ReturnPolicy, SizeGuide, Variant, VibeId,
} from "../lib/types.ts";
import * as G from "./size-guides.ts";

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

function shippingFor(cat: CategoryId) {
  return cat === "footwear" ? 70 : cat === "bags" ? 60 : cat === "jewellery" || cat === "beauty" ? 40 : 50;
}

export function buildSeedProducts(): ProductRecord[] {
  return DEFS.map((d, idx) => {
    const code = d.id.toUpperCase();
    const vs = variants(code, d.colors, d.sizes, idx * 3, d.allOut);
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      brand: d.brand ?? (d.category === "beauty" ? "Krip Glow" : "Krip Studio"),
      category: d.category,
      subcategory: d.subcategory,
      description: d.description,
      price: d.price,
      mrp: d.mrp ?? null,
      images: art(d.kind, d.colors[0][1]),
      variants: vs,
      sizeGuide: d.sizeGuide ?? null,
      fit: d.fit ?? null,
      material: d.material ?? null,
      care: d.care ?? [],
      packageContents: d.packageContents ?? null,
      origin: d.origin ?? null,
      seller: "Krip (sample seller details)",
      styleTags: d.tags,
      vibes: d.vibes,
      collections: d.collections ?? [],
      returnPolicy: d.returns ?? (d.category === "footwear" || d.category === "men" || d.category === "women" ? RET_7 : d.category === "accessories" && d.kind === "cap" ? RET_EXCHANGE : RET_7),
      beauty: d.beauty ?? null,
      reviews: [],
      channelListings: [],
      createdAt: new Date(d.createdAt + "T10:00:00+05:30").toISOString(),
      status: d.status ?? "active",
      isSample: true,
      private: {
        supplierName: d.supplier,
        sourceRef: `SRC-${code}`,
        purchaseCost: Math.round(d.price * d.costPct),
        shippingCost: shippingFor(d.category),
        channelPrices: [{ channel: "Krip", price: d.price }],
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

export const LOOKS: Look[] = [
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
