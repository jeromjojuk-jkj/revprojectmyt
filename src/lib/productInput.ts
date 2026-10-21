// Validation shared by the admin product form and CSV import. Pure, so it can
// be unit tested and reused by any future authorised integration.

import type { CategoryId, ChannelListing, ChannelPrice, ProductRecord, ReturnPolicy, SizeGuide, Variant, VibeId } from "./types.ts";
import { isCategoryId, isVibeId, COLLECTIONS } from "./constants.ts";
import { parseCsv } from "./csv.ts";

export type FieldErrors = Record<string, string>;

const SKU_RE = /^[A-Z0-9][A-Z0-9-]{1,39}$/;
const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function isAllowedImageUrl(u: string) {
  if (/^\/art\/[a-z]+-[0-9a-f]{6}-[12]\.svg$/i.test(u)) return true;
  // Images uploaded to the hosted demo's asset store.
  if (/^\/_blob\/[0-9a-f]{32}$/.test(u)) return true;
  try {
    const url = new URL(u);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

const num = (v: unknown) => {
  const s = String(v ?? "").trim().replace(/[₹,\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};
const lines = (v: unknown) => String(v ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const list = (v: unknown, sep = ",") => String(v ?? "").split(sep).map((x) => x.trim()).filter(Boolean);
const str = (v: unknown, max = 2000) => String(v ?? "").trim().slice(0, max);

export interface RawProductInput {
  id?: string;
  slug?: string;
  title?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  price?: string | number;
  mrp?: string | number;
  status?: string;
  images?: string; // newline separated
  variants?: string; // lines: SKU | Colour | #hex | Size | Stock
  fit?: string;
  material?: string;
  care?: string;
  packageContents?: string;
  origin?: string;
  seller?: string;
  styleTags?: string;
  vibes?: string;
  collections?: string;
  returnType?: string;
  returnDays?: string | number;
  returnNote?: string;
  sizeGuide?: string; // CSV block, first row headers
  sizeGuideUnit?: string;
  sizeGuideHow?: string;
  ingredients?: string;
  quantity?: string;
  skinTypes?: string;
  usage?: string;
  manufacturer?: string;
  shelfLife?: string;
  supplierName?: string;
  sourceRef?: string;
  purchaseCost?: string | number;
  shippingCost?: string | number;
  channelPrices?: string; // lines: Channel | price
  channelListings?: string; // lines: Channel | https://…
  rightsConfirmed?: string | boolean;
  createdAt?: string;
}

export function validateProductInput(
  raw: RawProductInput,
  ctx: { existingSlugs: Set<string>; existingSkus: Set<string>; id: string; createdAt: string; isSample?: boolean },
): { ok: true; product: ProductRecord } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};
  const title = str(raw.title, 120);
  if (title.length < 3) e.title = "Title is required (3+ characters).";
  const slug = str(raw.slug) || slugify(title);
  if (!SLUG_RE.test(slug)) e.slug = "Slug may contain lowercase letters, numbers and dashes.";
  else if (ctx.existingSlugs.has(slug)) e.slug = "Another product already uses this slug.";
  const category = str(raw.category);
  if (!isCategoryId(category)) e.category = "Choose a valid category.";
  const subcategory = str(raw.subcategory, 60);
  if (!subcategory) e.subcategory = "Subcategory is required (e.g. T-Shirts).";
  const description = str(raw.description, 2000);
  if (description.length < 10) e.description = "Add a short factual description (10+ characters).";

  const price = num(raw.price);
  if (price === null || Number.isNaN(price) || price <= 0 || !Number.isInteger(price)) e.price = "Selling price must be a whole number of rupees above 0.";
  const mrp = num(raw.mrp);
  if (mrp !== null && (Number.isNaN(mrp) || mrp <= 0)) e.mrp = "MRP must be a positive number, or leave blank.";
  else if (mrp !== null && price && mrp < price) e.mrp = "MRP can’t be lower than the selling price.";

  const status = str(raw.status) || "draft";
  if (!["draft", "active", "out-of-stock"].includes(status)) e.status = "Status must be draft, active or out-of-stock.";

  const images = lines(raw.images);
  if (!images.length) e.images = "Add at least one image URL.";
  else if (images.some((u) => !isAllowedImageUrl(u))) e.images = "Image URLs must be https:// links (or generated /art/ samples).";

  const variants: Variant[] = [];
  const seen = new Set<string>();
  const vlines = lines(raw.variants);
  if (!vlines.length) e.variants = "Add at least one variant.";
  vlines.forEach((l, i) => {
    const [sku = "", color = "", hex = "", size = "", stock = ""] = l.split("|").map((x) => x.trim());
    const SKU = sku.toUpperCase();
    const st = num(stock);
    const problems: string[] = [];
    if (!SKU_RE.test(SKU)) problems.push("SKU must be 2–40 chars A–Z, 0–9, dash");
    else if (seen.has(SKU) || ctx.existingSkus.has(SKU)) problems.push(`SKU ${SKU} is already used`);
    if (!color) problems.push("colour/shade name required");
    if (!HEX_RE.test(hex)) problems.push("swatch must be a 6-digit hex like #1f1f1f");
    if (st === null || Number.isNaN(st) || st < 0 || !Number.isInteger(st)) problems.push("stock must be a whole number ≥ 0");
    if (problems.length) {
      e.variants = `Variant line ${i + 1}: ${problems.join("; ")}.`;
      return;
    }
    seen.add(SKU);
    variants.push({ sku: SKU, color: color.slice(0, 40), colorHex: hex.replace("#", "").toLowerCase(), size: size ? size.slice(0, 20) : null, stock: st! });
  });
  if (variants.length) {
    const combos = new Set(variants.map((v) => `${v.color}|${v.size}`));
    if (combos.size !== variants.length) e.variants = "Each colour + size combination must appear only once.";
  }

  const vibes = list(raw.vibes).filter((v): v is VibeId => isVibeId(v));
  if (list(raw.vibes).length !== vibes.length) e.vibes = "Unknown vibe. Use: campus, streetwear, everyday, date-night, festive.";
  const collections = list(raw.collections);
  if (collections.some((c) => !COLLECTIONS[c])) e.collections = `Unknown collection. Use: ${Object.keys(COLLECTIONS).join(", ")}.`;

  const returnType = (str(raw.returnType) || "returnable") as ReturnPolicy["type"];
  if (!["returnable", "exchange-only", "non-returnable"].includes(returnType)) e.returnType = "Invalid return type.";
  const returnDays = num(raw.returnDays) ?? (returnType === "non-returnable" ? 0 : 7);
  if (Number.isNaN(returnDays) || returnDays < 0 || returnDays > 60) e.returnDays = "Return window must be 0–60 days.";
  const returnNote = str(raw.returnNote, 400);
  if (!returnNote) e.returnNote = "Describe the return/exchange conditions shown to shoppers.";

  let sizeGuide: SizeGuide | null = null;
  if (str(raw.sizeGuide)) {
    const rows = parseCsv(str(raw.sizeGuide, 4000)).map((r) => r.map((c) => c.trim()));
    if (rows.length < 2 || rows.some((r) => r.length !== rows[0].length)) e.sizeGuide = "Size guide needs a header row and rows with the same number of columns.";
    else sizeGuide = { unit: raw.sizeGuideUnit === "cm" ? "cm" : "in", headers: rows[0], rows: rows.slice(1), howToMeasure: str(raw.sizeGuideHow, 300) || "Garment measured flat." };
  }

  const isBeauty = category === "beauty";
  let beauty: ProductRecord["beauty"] = null;
  if (isBeauty) {
    const b = {
      ingredients: str(raw.ingredients, 3000),
      quantity: str(raw.quantity, 40),
      skinTypes: list(raw.skinTypes),
      usage: str(raw.usage, 1000),
      manufacturer: str(raw.manufacturer, 500),
      shelfLife: str(raw.shelfLife, 200),
    };
    if (!b.ingredients) e.ingredients = "Ingredients from the product label are required for cosmetics.";
    if (!b.quantity) e.quantity = "Net quantity is required for cosmetics.";
    if (!b.manufacturer) e.manufacturer = "Manufacturer/importer details are required for cosmetics.";
    if (!b.shelfLife) e.shelfLife = "Shelf life / expiry information is required for cosmetics.";
    beauty = b;
  }

  const purchaseCost = num(raw.purchaseCost);
  if (purchaseCost === null || Number.isNaN(purchaseCost) || purchaseCost < 0) e.purchaseCost = "Purchase cost is required (₹, can be 0).";
  const shippingCost = num(raw.shippingCost) ?? 0;
  if (Number.isNaN(shippingCost) || shippingCost < 0) e.shippingCost = "Shipping cost must be ≥ 0.";
  const supplierName = str(raw.supplierName, 120);
  if (!supplierName) e.supplierName = "Supplier name is required.";

  const channelPrices: ChannelPrice[] = [];
  for (const l of lines(raw.channelPrices)) {
    const [channel = "", p = ""] = l.split("|").map((x) => x.trim());
    const n = num(p);
    if (!channel || n === null || Number.isNaN(n) || n <= 0) {
      e.channelPrices = `Channel price line “${l}” should look like “Amazon | 549”.`;
      break;
    }
    channelPrices.push({ channel: channel.slice(0, 40), price: n });
  }
  const channelListings: ChannelListing[] = [];
  for (const l of lines(raw.channelListings)) {
    const [channel = "", url = ""] = l.split("|").map((x) => x.trim());
    let ok = false;
    try {
      ok = new URL(url).protocol === "https:";
    } catch {}
    if (!channel || !ok) {
      e.channelListings = `Listing line “${l}” should look like “Amazon | https://…” (a real Krip listing).`;
      break;
    }
    channelListings.push({ channel: channel.slice(0, 40), url });
  }

  const rightsConfirmed = raw.rightsConfirmed === true || ["on", "yes", "true", "1"].includes(String(raw.rightsConfirmed ?? "").toLowerCase());
  if (status === "active" && !rightsConfirmed) e.rightsConfirmed = "Confirm Krip is authorised to use these photos and descriptions before activating.";
  if (status === "active" && variants.length && variants.every((v) => v.stock === 0)) e.status = "All variants have 0 stock — use “out-of-stock” instead of active.";

  if (Object.keys(e).length) return { ok: false, errors: e };

  return {
    ok: true,
    product: {
      id: ctx.id,
      slug,
      title,
      brand: str(raw.brand, 60) || "Krip Studio",
      category: category as CategoryId,
      subcategory,
      description,
      price: price!,
      mrp: mrp ?? null,
      images,
      variants,
      sizeGuide,
      fit: str(raw.fit, 40) || null,
      material: str(raw.material, 60) || null,
      care: lines(raw.care),
      packageContents: str(raw.packageContents, 200) || null,
      origin: str(raw.origin, 60) || null,
      seller: str(raw.seller, 120) || null,
      styleTags: list(raw.styleTags).slice(0, 20),
      vibes,
      collections,
      returnPolicy: { type: returnType, days: returnDays!, note: returnNote },
      beauty,
      reviews: [],
      channelListings,
      createdAt: ctx.createdAt,
      status: status as ProductRecord["status"],
      isSample: ctx.isSample ?? false,
      private: {
        supplierName,
        sourceRef: str(raw.sourceRef, 120),
        purchaseCost: purchaseCost!,
        shippingCost,
        channelPrices: channelPrices.length ? channelPrices : [{ channel: "Krip", price: price! }],
        rightsConfirmed,
      },
    },
  };
}

/** Converts a stored product back into form/CSV-style raw input. */
export function toRawInput(p: ProductRecord): RawProductInput {
  return {
    id: p.id, slug: p.slug, title: p.title, brand: p.brand, category: p.category, subcategory: p.subcategory,
    description: p.description, price: String(p.price), mrp: p.mrp ? String(p.mrp) : "", status: p.status,
    images: p.images.join("\n"),
    variants: p.variants.map((v) => [v.sku, v.color, "#" + v.colorHex, v.size ?? "", v.stock].join(" | ")).join("\n"),
    fit: p.fit ?? "", material: p.material ?? "", care: p.care.join("\n"), packageContents: p.packageContents ?? "",
    origin: p.origin ?? "", seller: p.seller ?? "", styleTags: p.styleTags.join(", "), vibes: p.vibes.join(", "),
    collections: p.collections.join(", "), returnType: p.returnPolicy.type, returnDays: String(p.returnPolicy.days),
    returnNote: p.returnPolicy.note,
    sizeGuide: p.sizeGuide ? [p.sizeGuide.headers, ...p.sizeGuide.rows].map((r) => r.join(", ")).join("\n") : "",
    sizeGuideUnit: p.sizeGuide?.unit ?? "in", sizeGuideHow: p.sizeGuide?.howToMeasure ?? "",
    ingredients: p.beauty?.ingredients ?? "", quantity: p.beauty?.quantity ?? "", skinTypes: p.beauty?.skinTypes.join(", ") ?? "",
    usage: p.beauty?.usage ?? "", manufacturer: p.beauty?.manufacturer ?? "", shelfLife: p.beauty?.shelfLife ?? "",
    supplierName: p.private.supplierName, sourceRef: p.private.sourceRef, purchaseCost: String(p.private.purchaseCost),
    shippingCost: String(p.private.shippingCost),
    channelPrices: p.private.channelPrices.map((c) => `${c.channel} | ${c.price}`).join("\n"),
    channelListings: p.channelListings.map((c) => `${c.channel} | ${c.url}`).join("\n"),
    rightsConfirmed: p.private.rightsConfirmed ? "on" : "",
  };
}

// ---------- CSV import ----------
export const CSV_COLUMNS = [
  "slug", "title", "brand", "category", "subcategory", "description", "price", "mrp", "status",
  "image_urls", "sku", "color", "color_hex", "size", "stock",
  "fit", "material", "care", "package_contents", "origin", "seller", "style_tags", "vibes", "collections",
  "return_type", "return_days", "return_note",
  "ingredients", "quantity", "skin_types", "usage", "manufacturer", "shelf_life",
  "supplier_name", "source_ref", "purchase_cost", "shipping_cost", "rights_confirmed",
] as const;
export const CSV_REQUIRED = ["slug", "title", "category", "subcategory", "description", "price", "image_urls", "sku", "color", "color_hex", "stock", "return_note", "supplier_name", "purchase_cost"];

export interface CsvImportResult {
  products: ProductRecord[];
  errors: { row: number | null; slug: string | null; message: string }[];
  rowCount: number;
}

/**
 * One row per variant; rows sharing a slug become one product. Product-level
 * columns are read from the first row of each slug.
 */
export function importCsv(
  text: string,
  ctx: { existingSlugs: Set<string>; existingSkus: Set<string>; nextId: () => string; now: string },
): CsvImportResult {
  const rows = parseCsv(text);
  const errors: CsvImportResult["errors"] = [];
  if (rows.length < 2) return { products: [], errors: [{ row: null, slug: null, message: "The file needs a header row and at least one data row." }], rowCount: 0 };
  if (rows.length > 2001) return { products: [], errors: [{ row: null, slug: null, message: "Import up to 2,000 rows at a time." }], rowCount: rows.length - 1 };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = CSV_REQUIRED.filter((c) => !header.includes(c));
  const unknown = header.filter((h) => h && !(CSV_COLUMNS as readonly string[]).includes(h));
  if (missing.length) errors.push({ row: 1, slug: null, message: `Missing required column(s): ${missing.join(", ")}` });
  if (unknown.length) errors.push({ row: 1, slug: null, message: `Unknown column(s): ${unknown.join(", ")}` });
  if (errors.length) return { products: [], errors, rowCount: rows.length - 1 };

  const groups = new Map<string, { rowNo: number; rec: Record<string, string> }[]>();
  rows.slice(1).forEach((r, i) => {
    const rec: Record<string, string> = {};
    header.forEach((h, j) => (rec[h] = (r[j] ?? "").trim()));
    const slug = rec.slug || "";
    if (!slug) {
      errors.push({ row: i + 2, slug: null, message: "slug is empty" });
      return;
    }
    groups.set(slug, [...(groups.get(slug) ?? []), { rowNo: i + 2, rec }]);
  });

  const products: ProductRecord[] = [];
  const usedSkus = new Set(ctx.existingSkus);
  for (const [slug, group] of groups) {
    const first = group[0].rec;
    const raw: RawProductInput = {
      slug, title: first.title, brand: first.brand, category: first.category, subcategory: first.subcategory,
      description: first.description, price: first.price, mrp: first.mrp, status: first.status || "draft",
      images: (first.image_urls || "").split("|").map((s) => s.trim()).join("\n"),
      variants: group.map((g) => [g.rec.sku, g.rec.color, g.rec.color_hex, g.rec.size, g.rec.stock].join(" | ")).join("\n"),
      fit: first.fit, material: first.material, care: (first.care || "").split("|").join("\n"),
      packageContents: first.package_contents, origin: first.origin, seller: first.seller,
      styleTags: first.style_tags, vibes: first.vibes, collections: first.collections,
      returnType: first.return_type, returnDays: first.return_days, returnNote: first.return_note,
      ingredients: first.ingredients, quantity: first.quantity, skinTypes: first.skin_types, usage: first.usage,
      manufacturer: first.manufacturer, shelfLife: first.shelf_life,
      supplierName: first.supplier_name, sourceRef: first.source_ref, purchaseCost: first.purchase_cost,
      shippingCost: first.shipping_cost, rightsConfirmed: first.rights_confirmed,
    };
    const res = validateProductInput(raw, { existingSlugs: ctx.existingSlugs, existingSkus: usedSkus, id: "pending", createdAt: ctx.now });
    if (!res.ok) {
      for (const [field, msg] of Object.entries(res.errors)) errors.push({ row: group[0].rowNo, slug, message: `${field}: ${msg}` });
      continue;
    }
    res.product.variants.forEach((v) => usedSkus.add(v.sku));
    products.push({ ...res.product, id: ctx.nextId() });
  }
  return { products, errors, rowCount: rows.length - 1 };
}
