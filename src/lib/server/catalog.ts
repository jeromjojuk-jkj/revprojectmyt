import "server-only";
import type { ProductPublic, ProductRecord } from "../types";
import { readDb } from "./db";

/** Strips supplier, cost and channel-pricing data. Use for every shopper-facing response. */
export function toPublicProduct(p: ProductRecord): ProductPublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { private: _private, ...pub } = p;
  return { ...pub, variants: pub.variants.map((v) => ({ ...v })) };
}

const visible = (p: ProductRecord) => p.status !== "draft" && p.status !== "archived";

export async function getPublicProducts(): Promise<ProductPublic[]> {
  const db = await readDb();
  return db.products.filter(visible).map(toPublicProduct);
}

export async function getPublicProduct(slug: string): Promise<ProductPublic | null> {
  const db = await readDb();
  const p = db.products.find((x) => x.slug === slug && visible(x));
  return p ? toPublicProduct(p) : null;
}

export async function getPublicProductsByIds(ids: string[]): Promise<ProductPublic[]> {
  const db = await readDb();
  const set = new Set(ids);
  return db.products.filter((p) => set.has(p.id) && visible(p)).map(toPublicProduct);
}

export async function getSettings() {
  return (await readDb()).settings;
}

export async function getLiveOffers() {
  const { liveOffers } = await import("../offers");
  const db = await readDb();
  return liveOffers(db.offers, db.products.filter(visible).map(toPublicProduct));
}

/** Public store profile (contact details, social links, announcement). */
export async function getStore() {
  return (await readDb()).store;
}
