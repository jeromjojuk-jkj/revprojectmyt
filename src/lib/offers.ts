import type { Offer, OfferTheme, ProductPublic } from "./types.ts";
import { parseSearch, runSearch } from "./search.ts";
import { discountPct } from "./format.ts";

// White text on each background is ≥ 4.5:1, so small print stays readable.
export const OFFER_THEMES: Record<OfferTheme, { bg: string; label: string }> = {
  saffron: { bg: "#C2410C", label: "Saffron" },
  red: { bg: "#B91C1C", label: "Festive red" },
  green: { bg: "#166534", label: "Krip green" },
  purple: { bg: "#86198F", label: "Purple" },
  pink: { bg: "#BE185D", label: "Pink" },
  ink: { bg: "#171717", label: "Charcoal" },
};

/** Today's date in India as yyyy-mm-dd. */
export const todayIST = (now = new Date()) =>
  new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

export type OfferState = "live" | "scheduled" | "ended" | "inactive" | "empty";

export interface OfferView {
  offer: Offer;
  state: OfferState;
  count: number;
  fromPrice: number | null;
  /** Largest real MRP discount among in-stock matches, if any have an MRP. */
  maxDiscount: number | null;
  images: { src: string; hex: string; alt: string }[];
}

export function evaluateOffer(offer: Offer, products: ProductPublic[], now = new Date()): OfferView {
  const s = parseSearch(new URLSearchParams(offer.query));
  s.inStock = true;
  const items = runSearch(products, s).items;
  const today = todayIST(now);
  const state: OfferState = !offer.active
    ? "inactive"
    : offer.startsOn && today < offer.startsOn
      ? "scheduled"
      : offer.endsOn && today > offer.endsOn
        ? "ended"
        : items.length === 0
          ? "empty"
          : "live";
  const discounts = items.map((p) => discountPct(p.price, p.mrp)).filter((d): d is number => d !== null);
  const images = offer.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is ProductPublic => !!p)
    .slice(0, 2)
    .map((p) => {
      const v = p.variants.find((x) => x.stock > 0) ?? p.variants[0];
      return { src: p.images[0], hex: v.colorHex, alt: p.title };
    });
  return {
    offer,
    state,
    count: items.length,
    fromPrice: items.length ? Math.min(...items.map((p) => p.price)) : null,
    maxDiscount: discounts.length ? Math.max(...discounts) : null,
    images,
  };
}

/** Offers to show shoppers right now: live, with at least one in-stock product. */
export function liveOffers(offers: Offer[], products: ProductPublic[], now = new Date()) {
  return offers.map((o) => evaluateOffer(o, products, now)).filter((v) => v.state === "live");
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateOffer(
  raw: Record<string, string | undefined>,
  products: ProductPublic[],
): { ok: true; offer: Omit<Offer, "id"> } | { ok: false; errors: Record<string, string> } {
  const e: Record<string, string> = {};
  const t = (k: string, max: number) => (raw[k] ?? "").trim().slice(0, max);
  const headline = t("headline", 32);
  const subhead = t("subhead", 48);
  const badge = t("badge", 28);
  const theme = t("theme", 20) as OfferTheme;
  const query = t("query", 300).replace(/^\/?search\?/, "");
  const productIds = (raw.productIds ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 2);
  const terms = t("terms", 400) || null;
  const startsOn = t("startsOn", 10) || null;
  const endsOn = t("endsOn", 10) || null;
  if (headline.length < 3) e.headline = "Add a short headline, e.g. “Under ₹299”.";
  if (!subhead) e.subhead = "Add what’s on offer, e.g. “Kurtas & kurtis”.";
  if (!badge) e.badge = "Add a season or campaign name, e.g. “Diwali Edit”.";
  if (!OFFER_THEMES[theme]) e.theme = "Pick a colour.";
  if (!query) e.query = "Add the search link this tile opens.";
  else if (runSearch(products, { ...parseSearch(new URLSearchParams(query)), inStock: true }).total === 0)
    e.query = "This link shows no in-stock products, so the tile would lead nowhere.";
  if (productIds.some((id) => !products.some((p) => p.id === id))) e.productIds = "Use product IDs from the Products list (e.g. p104).";
  if (!productIds.length) e.productIds = "Pick 1–2 products to picture on the tile.";
  if (startsOn && !DATE_RE.test(startsOn)) e.startsOn = "Use a date.";
  if (endsOn && !DATE_RE.test(endsOn)) e.endsOn = "Use a date.";
  if (startsOn && endsOn && endsOn < startsOn) e.endsOn = "End date must be on or after the start date.";
  // A price promise in the headline must be enforced by the link.
  const promise = /under\s*₹?\s*([\d,]+)/i.exec(headline);
  if (promise && query) {
    const cap = Number(promise[1].replace(/,/g, ""));
    const s = parseSearch(new URLSearchParams(query));
    if (!s.max || s.max > cap) e.query = `The headline promises under ₹${cap}, so the link must include max=${cap} (or lower).`;
  }
  if (Object.keys(e).length) return { ok: false, errors: e };
  return { ok: true, offer: { headline, subhead, badge, theme, query, productIds, terms, startsOn, endsOn, active: raw.active === "on" || raw.active === "true" } };
}
