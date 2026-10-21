import type { CategoryId, ProductPublic, VibeId } from "./types.ts";
import { CATEGORY_NAME, COLLECTIONS, VIBES, isCategoryId, isVibeId } from "./constants.ts";

export type SortId = "relevance" | "newest" | "price-asc" | "price-desc";

export const SORTS: { id: SortId; label: string }[] = [
  { id: "relevance", label: "Relevance" },
  { id: "newest", label: "Newest first" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

export const PRICE_BANDS = [
  { id: "0-299", label: "Under ₹299", min: 0, max: 299 },
  { id: "300-499", label: "₹300 – ₹499", min: 300, max: 499 },
  { id: "500-999", label: "₹500 – ₹999", min: 500, max: 999 },
  { id: "1000-", label: "₹1,000 & above", min: 1000, max: Infinity },
] as const;

export interface SearchState {
  q: string;
  cats: CategoryId[];
  types: string[];
  sizes: string[];
  fits: string[];
  colors: string[];
  materials: string[];
  shades: string[];
  skin: string[];
  prices: string[];
  max: number | null;
  vibe: VibeId | null;
  collection: string | null;
  inStock: boolean;
  sort: SortId;
}

export const emptyState = (): SearchState => ({
  q: "", cats: [], types: [], sizes: [], fits: [], colors: [], materials: [], shades: [], skin: [], prices: [],
  max: null, vibe: null, collection: null, inStock: false, sort: "relevance",
});

const list = (v: string | null) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

export function parseSearch(sp: URLSearchParams): SearchState {
  const s = emptyState();
  s.q = (sp.get("q") ?? "").slice(0, 80);
  s.cats = list(sp.get("cat")).filter(isCategoryId);
  s.types = list(sp.get("type"));
  s.sizes = list(sp.get("size"));
  s.fits = list(sp.get("fit"));
  s.colors = list(sp.get("color"));
  s.materials = list(sp.get("material"));
  s.shades = list(sp.get("shade"));
  s.skin = list(sp.get("skin"));
  s.prices = list(sp.get("price")).filter((p) => PRICE_BANDS.some((b) => b.id === p));
  const max = Number(sp.get("max"));
  s.max = Number.isFinite(max) && max > 0 ? max : null;
  const vibe = sp.get("vibe");
  s.vibe = vibe && isVibeId(vibe) ? vibe : null;
  const col = sp.get("collection");
  s.collection = col && COLLECTIONS[col] ? col : null;
  s.inStock = sp.get("instock") === "1";
  const sort = sp.get("sort") as SortId | null;
  s.sort = sort && SORTS.some((x) => x.id === sort) ? sort : s.q ? "relevance" : "newest";
  return s;
}

export function serializeSearch(s: SearchState): string {
  const sp = new URLSearchParams();
  if (s.q) sp.set("q", s.q);
  const put = (k: string, v: string[]) => v.length && sp.set(k, v.join(","));
  put("cat", s.cats);
  put("type", s.types);
  put("size", s.sizes);
  put("fit", s.fits);
  put("color", s.colors);
  put("material", s.materials);
  put("shade", s.shades);
  put("skin", s.skin);
  put("price", s.prices);
  if (s.max) sp.set("max", String(s.max));
  if (s.vibe) sp.set("vibe", s.vibe);
  if (s.collection) sp.set("collection", s.collection);
  if (s.inStock) sp.set("instock", "1");
  const defaultSort = s.q ? "relevance" : "newest";
  if (s.sort !== defaultSort) sp.set("sort", s.sort);
  return sp.toString();
}

/** Applied attribute filters (things a user can clear). */
export function activeFilterCount(s: SearchState) {
  return (
    s.cats.length + s.types.length + s.sizes.length + s.fits.length + s.colors.length + s.materials.length +
    s.shades.length + s.skin.length + s.prices.length + (s.max ? 1 : 0) + (s.vibe ? 1 : 0) +
    (s.collection ? 1 : 0) + (s.inStock ? 1 : 0)
  );
}

// ---------- colour families ----------
const FAMILIES: [string, string[]][] = [
  ["Black", ["black", "charcoal", "jet", "onyx"]],
  ["White", ["white", "ivory", "off-white", "cream", "ecru", "pearl"]],
  ["Grey", ["grey", "gray", "ash", "melange", "slate"]],
  ["Blue", ["blue", "navy", "denim", "indigo", "sky", "teal", "cobalt", "azure"]],
  ["Green", ["green", "olive", "sage", "mint", "emerald", "forest", "khaki"]],
  ["Red", ["red", "maroon", "wine", "cherry", "brick", "crimson"]],
  ["Pink", ["pink", "rose", "blush", "fuchsia", "mauve", "nude"]],
  ["Yellow", ["yellow", "mustard", "lemon", "butter"]],
  ["Orange", ["orange", "rust", "peach", "coral", "terracotta", "tangerine"]],
  ["Brown", ["brown", "tan", "beige", "camel", "mocha", "chocolate", "coffee", "sand", "taupe"]],
  ["Purple", ["purple", "lilac", "lavender", "violet", "plum"]],
  ["Gold", ["gold", "brass"]],
  ["Silver", ["silver", "chrome", "steel"]],
  ["Multi", ["multi", "print", "floral", "check"]],
];

export function colorFamily(name: string): string {
  const n = name.toLowerCase();
  for (const [fam, keys] of FAMILIES) if (keys.some((k) => n.includes(k))) return fam;
  return "Other";
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];
export function compareSizes(a: string, b: string) {
  const ia = SIZE_ORDER.indexOf(a);
  const ib = SIZE_ORDER.indexOf(b);
  if (ia >= 0 && ib >= 0) return ia - ib;
  const na = parseFloat(a.replace(/[^0-9.]/g, ""));
  const nb = parseFloat(b.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b);
}

// ---------- text matching ----------
const SYNONYMS: Record<string, string[]> = {
  tshirt: ["tee", "t-shirt"],
  tee: ["t-shirt", "tshirt"],
  sneaker: ["shoe", "sneakers"],
  shoe: ["sneaker", "footwear", "slide", "heel", "boot"],
  kurta: ["kurti"],
  kurti: ["kurta"],
  jean: ["denim", "jeans"],
  denim: ["jean"],
  lipstick: ["lip"],
  makeup: ["beauty", "cosmetic"],
  purse: ["bag", "sling"],
  handbag: ["bag", "tote"],
  pant: ["trouser", "cargo", "jean"],
  trouser: ["pant"],
  earring: ["jhumka", "hoop"],
  chain: ["necklace"],
  shade: ["sunglass"],
  goggle: ["sunglass"],
  ethnic: ["festive", "kurti"],
};

export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[’']/g, "").replace(/[^a-z0-9₹\s-]/g, " ").replace(/\s+/g, " ").trim();

const stem = (w: string) => {
  let x = w.replace(/-/g, "");
  if (x.length > 4 && x.endsWith("es") && !x.endsWith("ses")) x = x.slice(0, -2);
  else if (x.length > 3 && x.endsWith("s") && !x.endsWith("ss")) x = x.slice(0, -1);
  return x;
};

function haystack(p: ProductPublic) {
  const parts = [
    p.title, p.brand, CATEGORY_NAME[p.category], p.category, p.subcategory, p.material ?? "", p.fit ?? "",
    ...p.styleTags, ...p.vibes.map((v) => VIBES.find((x) => x.id === v)?.name ?? v),
    ...p.variants.map((v) => v.color), ...p.variants.map((v) => colorFamily(v.color)),
    ...p.collections.map((c) => COLLECTIONS[c]?.name ?? c),
  ];
  const title = normalize(p.title).split(" ").map(stem);
  const all = normalize(parts.join(" ")).split(" ").map(stem);
  return { title: new Set(title), all: new Set(all), allList: all };
}

function tokenMatches(token: string, words: string[]): boolean {
  return words.some((w) => w === token || (token.length >= 2 && w.startsWith(token)));
}

/** Returns a relevance score, or 0 if the product doesn't match all query tokens. */
export function scoreProduct(p: ProductPublic, q: string): number {
  const tokens = normalize(q).split(" ").filter(Boolean).map(stem);
  if (!tokens.length) return 1;
  const h = haystack(p);
  const titleWords = [...h.title];
  let score = 0;
  for (const t of tokens) {
    const alts = [t, ...(SYNONYMS[t] ?? []).map(stem)];
    if (alts.some((a) => tokenMatches(a, titleWords))) score += 3;
    else if (alts.some((a) => tokenMatches(a, h.allList))) score += 1;
    else return 0;
  }
  return score;
}

// ---------- filtering ----------
type Group = "cats" | "types" | "sizes" | "fits" | "colors" | "materials" | "shades" | "skin" | "prices";

const productValues: Record<Group, (p: ProductPublic) => string[]> = {
  cats: (p) => [p.category],
  types: (p) => [p.subcategory],
  sizes: (p) => (p.category === "beauty" ? [] : p.variants.map((v) => v.size).filter((x): x is string => !!x)),
  fits: (p) => (p.fit && (p.category === "men" || p.category === "women") ? [p.fit] : []),
  colors: (p) => (p.category === "beauty" ? [] : p.variants.map((v) => colorFamily(v.color))),
  materials: (p) => (p.material && p.category !== "beauty" ? [p.material] : []),
  shades: (p) => (p.category === "beauty" && p.variants.length > 1 ? p.variants.map((v) => v.color) : []),
  skin: (p) => p.beauty?.skinTypes ?? [],
  prices: (p) => PRICE_BANDS.filter((b) => p.price >= b.min && p.price <= b.max).map((b) => b.id),
};

/** Sizes/colours should match the same in-stock variant when "in stock" is on. */
function passesGroup(p: ProductPublic, g: Group, selected: string[], inStock: boolean) {
  if (!selected.length) return true;
  if (inStock && (g === "sizes" || g === "colors" || g === "shades")) {
    return p.variants.some((v) => {
      if (v.stock <= 0) return false;
      const val = g === "sizes" ? v.size : g === "colors" ? colorFamily(v.color) : v.color;
      return val !== null && selected.includes(val);
    });
  }
  const vals = productValues[g](p);
  return vals.some((v) => selected.includes(v));
}

function baseMatches(p: ProductPublic, s: SearchState) {
  if (p.status === "draft" || p.status === "archived") return false;
  if (s.vibe && !p.vibes.includes(s.vibe)) return false;
  if (s.collection && !p.collections.includes(s.collection)) return false;
  if (s.max && p.price > s.max) return false;
  if (s.inStock && !p.variants.some((v) => v.stock > 0)) return false;
  return true;
}

const GROUPS: Group[] = ["cats", "types", "sizes", "fits", "colors", "materials", "shades", "skin", "prices"];

export interface Facet {
  group: Group;
  label: string;
  options: { value: string; label: string; count: number }[];
}

const GROUP_LABEL: Record<Group, string> = {
  cats: "Category", types: "Type", sizes: "Size", fits: "Fit", colors: "Colour", materials: "Material",
  shades: "Shade", skin: "Skin type", prices: "Price",
};

export interface SearchResult {
  items: ProductPublic[];
  facets: Facet[];
  total: number;
}

export function runSearch(products: ProductPublic[], s: SearchState): SearchResult {
  const scored = new Map<string, number>();
  const base = products.filter((p) => {
    if (!baseMatches(p, s)) return false;
    const sc = scoreProduct(p, s.q);
    if (sc <= 0) return false;
    scored.set(p.id, sc);
    return true;
  });

  const passesAllExcept = (p: ProductPublic, except: Group | null) =>
    GROUPS.every((g) => g === except || passesGroup(p, g, s[g], s.inStock));

  const items = base.filter((p) => passesAllExcept(p, null));

  // Facets: counts reflect every other active filter, so options never lead to dead ends.
  const facets: Facet[] = [];
  for (const g of GROUPS) {
    const pool = base.filter((p) => passesAllExcept(p, g));
    const counts = new Map<string, number>();
    for (const p of pool) for (const v of new Set(productValues[g](p))) counts.set(v, (counts.get(v) ?? 0) + 1);
    for (const sel of s[g]) if (!counts.has(sel)) counts.set(sel, 0);
    if (!counts.size) continue;
    let options = [...counts].map(([value, count]) => ({
      value,
      count,
      label:
        g === "cats" ? CATEGORY_NAME[value as CategoryId] ?? value
        : g === "prices" ? PRICE_BANDS.find((b) => b.id === value)?.label ?? value
        : value,
    }));
    if (g === "sizes") options.sort((a, b) => compareSizes(a.value, b.value));
    else if (g === "prices") options.sort((a, b) => PRICE_BANDS.findIndex((x) => x.id === a.value) - PRICE_BANDS.findIndex((x) => x.id === b.value));
    else if (g === "cats") options = options.sort((a, b) => a.label.localeCompare(b.label));
    else options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    // A single-option facet that's not selected adds noise.
    if (options.length < 2 && !s[g].length) continue;
    facets.push({ group: g, label: GROUP_LABEL[g], options });
  }

  const byNewest = (a: ProductPublic, b: ProductPublic) => b.createdAt.localeCompare(a.createdAt);
  const sorted = [...items];
  if (s.sort === "price-asc") sorted.sort((a, b) => a.price - b.price || byNewest(a, b));
  else if (s.sort === "price-desc") sorted.sort((a, b) => b.price - a.price || byNewest(a, b));
  else if (s.sort === "newest") sorted.sort(byNewest);
  else sorted.sort((a, b) => (scored.get(b.id) ?? 0) - (scored.get(a.id) ?? 0) || byNewest(a, b));

  // Keep out-of-stock items, but after in-stock ones.
  const inStock = (p: ProductPublic) => p.status === "active" && p.variants.some((v) => v.stock > 0);
  sorted.sort((a, b) => Number(inStock(b)) - Number(inStock(a)));

  return { items: sorted, facets, total: sorted.length };
}

export interface Suggestion {
  kind: "product" | "category" | "color" | "style";
  label: string;
  href: string;
}

export function suggest(products: ProductPublic[], q: string, limit = 8): Suggestion[] {
  const n = normalize(q);
  if (n.length < 2) return [];
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  const push = (s: Suggestion) => {
    if (seen.has(s.label.toLowerCase()) || out.length >= limit) return;
    seen.add(s.label.toLowerCase());
    out.push(s);
  };
  for (const [id, name] of Object.entries(CATEGORY_NAME)) {
    if (normalize(name).includes(n) || id.startsWith(n)) push({ kind: "category", label: name, href: `/search?cat=${id}` });
  }
  for (const v of VIBES) if (normalize(v.name).startsWith(n)) push({ kind: "style", label: `${v.name} vibe`, href: `/search?vibe=${v.id}` });
  const families = new Set(products.flatMap((p) => p.variants.map((v) => colorFamily(v.color))));
  for (const f of families) if (normalize(f).startsWith(n)) push({ kind: "color", label: `${f} colour`, href: `/search?color=${f}` });
  const matches = products
    .filter((p) => p.status !== "draft" && p.status !== "archived")
    .map((p) => ({ p, s: scoreProduct(p, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const tags = new Set<string>();
  for (const { p } of matches) for (const t of p.styleTags) if (normalize(t).startsWith(n)) tags.add(t);
  for (const t of tags) push({ kind: "style", label: t, href: `/search?q=${encodeURIComponent(t)}` });
  for (const { p } of matches) push({ kind: "product", label: p.title, href: `/product/${p.slug}` });
  return out;
}
