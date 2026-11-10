import "server-only";
import type { ProductPublic, ProductRecord } from "../types";
import { readDb, type DB } from "./db";

/** Strips supplier, cost and channel-pricing data. Use for every shopper-facing response. */
export function toPublicProduct(p: ProductRecord): ProductPublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { private: _private, ...pub } = p;
  return { ...pub, variants: pub.variants.map((v) => ({ ...v })) };
}

const visible = (p: ProductRecord) => p.status !== "draft" && p.status !== "archived";

/** Krip's own products plus those of sellers whose account is approved (a suspended seller's products disappear). */
export function sellableProducts(db: Pick<DB, "products" | "vendors">): ProductRecord[] {
  const ok = new Set(db.vendors.filter((v) => v.status === "approved" && !v.shipping?.onHoliday).map((v) => v.id));
  return db.products.filter((p) => !p.vendorId || ok.has(p.vendorId));
}

export async function getPublicProducts(): Promise<ProductPublic[]> {
  const db = await readDb();
  return sellableProducts(db).filter(visible).map(toPublicProduct);
}

export async function getPublicProduct(slug: string): Promise<ProductPublic | null> {
  const db = await readDb();
  const p = sellableProducts(db).find((x) => x.slug === slug && visible(x));
  return p ? toPublicProduct(p) : null;
}

export async function getPublicProductsByIds(ids: string[]): Promise<ProductPublic[]> {
  const db = await readDb();
  const set = new Set(ids);
  return sellableProducts(db).filter((p) => set.has(p.id) && visible(p)).map(toPublicProduct);
}

export async function getSettings() {
  return (await readDb()).settings;
}

export async function getLiveOffers() {
  const { liveOffers } = await import("../offers");
  const db = await readDb();
  return liveOffers(db.offers, sellableProducts(db).filter(visible).map(toPublicProduct));
}

/** Public store profile (contact details, social links, announcement). */
export async function getStore() {
  return (await readDb()).store;
}

/** Live products sellers chose to feature (within their plan's slots), for the homepage. */
export async function getFeaturedSellerProducts(): Promise<ProductPublic[]> {
  const db = await readDb();
  return sellableProducts(db).filter((p) => p.vendorId && p.private.featured && p.status === "active" && p.variants.some((v) => v.stock > 0)).slice(0, 12).map(toPublicProduct);
}
