"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProductRecord } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { validateVendorProduct } from "@/lib/vendorInput";
import { planOf } from "@/lib/vendorPlans";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { withDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { moveStock } from "@/lib/server/inventory";
import { deleteProductRecords } from "@/lib/server/catalog";

export type ProductFormState = { errors?: Record<string, string>; message?: string; values?: Record<string, string> } | null;

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/** Create or edit a seller's product. New products and content edits go to Krip for review; price and stock changes apply straight away. */
export async function saveVendorProductAction(_: ProductFormState, fd: FormData): Promise<ProductFormState> {
  const v = await requireApprovedVendor();
  const raw = Object.fromEntries([...fd.entries()].filter(([, x]) => typeof x === "string")) as Record<string, string>;
  const res = validateVendorProduct(raw, CATEGORIES.map((c) => c.id));
  if (!res.ok) return { errors: res.errors, values: raw };
  const p = res.value;
  const id = raw.id;
  let outId = id;
  try {
    await withDb((db) => {
      const actor = { id: v.id, name: `Seller: ${v.businessName}` };
      const seller = `${v.businessName}, ${v.city}`;
      const verified = v.verified && planOf(v.plan).verifiedBadge;
      const now = new Date().toISOString();
      if (!id) {
        const limit = planOf(v.plan).productLimit;
        const count = db.products.filter((x) => x.vendorId === v.id && x.status !== "archived").length;
        if (limit !== null && count >= limit) throw Object.assign(new Error(`Your ${planOf(v.plan).name} plan allows ${limit} products.`), { form: true });
        const code = v.id.slice(4);
        outId = `v${code.toLowerCase()}-${crypto.randomBytes(2).toString("hex")}`;
        const slugs = new Set(db.products.map((x) => x.slug));
        let slug = `${slugify(p.title)}-${code.toLowerCase()}`;
        for (let n = 2; slugs.has(slug); n++) slug = `${slugify(p.title)}-${code.toLowerCase()}-${n}`;
        const sku = `${code}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
        const rec: ProductRecord = {
          id: outId, slug, title: p.title, brand: v.businessName, category: p.category as ProductRecord["category"], subcategory: p.subcategory || "General",
          description: p.description, price: p.price, mrp: p.mrp, images: p.images, video: null, features: p.features, howToUse: p.howToUse,
          variants: [{ sku, color: p.colour, colorHex: "e5e7eb", size: null, stock: 0 }],
          sizeGuide: null, fit: null, material: p.material || null, care: [], packageContents: p.packageContents || null, origin: null, seller,
          styleTags: [], vibes: [], collections: [], returnPolicy: p.returnType === "returnable"
            ? { type: "returnable", days: 7, note: "Return within 7 days of delivery if unused and in the original packaging. Damaged or wrong items reported within 48 hours with photos are replaced." }
            : { type: "non-returnable", days: 0, note: "Not returnable once delivered. If it arrives damaged or wrong, report it within 48 hours of delivery with photos for a replacement." },
          beauty: null, reviews: [], channelListings: [], createdAt: now, status: "draft", isSample: false, vendorId: v.id, sellerVerified: verified,
          private: { supplierName: v.businessName, sourceRef: v.id, purchaseCost: 0, shippingCost: 0, otherCost: 0, channelPrices: [], rightsConfirmed: false, review: { status: "pending", note: "", at: now }, featured: false },
        };
        db.products.push(rec);
        if (p.stock > 0) moveStock(db, sku, p.stock, "received", "seller listing", actor.name);
        audit(db, actor, "vendor.product.create", "product", outId);
        return;
      }
      const rec = db.products.find((x) => x.id === id && x.vendorId === v.id);
      if (!rec) throw Object.assign(new Error("Product not found."), { form: true });
      const content = JSON.stringify([rec.title, rec.category, rec.subcategory, rec.description, rec.features, rec.howToUse, rec.images, rec.packageContents, rec.material, rec.returnPolicy.type, rec.variants[0]?.color]);
      Object.assign(rec, {
        title: p.title, category: p.category, subcategory: p.subcategory || "General", description: p.description, features: p.features, howToUse: p.howToUse,
        images: p.images, packageContents: p.packageContents || null, material: p.material || null, price: p.price, mrp: p.mrp, seller, sellerVerified: verified,
      });
      if (rec.variants[0]) rec.variants[0].color = p.colour;
      if (p.returnType !== rec.returnPolicy.type) rec.returnPolicy = p.returnType === "returnable"
        ? { type: "returnable", days: 7, note: "Return within 7 days of delivery if unused and in the original packaging. Damaged or wrong items reported within 48 hours with photos are replaced." }
        : { type: "non-returnable", days: 0, note: "Not returnable once delivered. If it arrives damaged or wrong, report it within 48 hours of delivery with photos for a replacement." };
      const changed = content !== JSON.stringify([rec.title, rec.category, rec.subcategory, rec.description, rec.features, rec.howToUse, rec.images, rec.packageContents, rec.material, rec.returnPolicy.type, rec.variants[0]?.color]);
      if (changed || rec.private.review?.status === "rejected") {
        rec.private.review = { status: "pending", note: "", at: now };
        if (rec.status === "active" || rec.status === "out-of-stock") rec.status = "draft";
      }
      const sku = rec.variants[0]?.sku;
      if (sku && rec.variants[0].stock !== p.stock) moveStock(db, sku, p.stock - rec.variants[0].stock, "correction", "seller update", actor.name);
      audit(db, actor, "vendor.product.update", "product", rec.id, { after: { reviewAgain: changed } });
    });
  } catch (e) {
    if ((e as { form?: boolean }).form) return { errors: { form: (e as Error).message }, values: raw };
    throw e;
  }
  revalidatePath("/vendor/products");
  revalidatePath("/", "layout");
  redirect(`/vendor/products?saved=${encodeURIComponent(outId)}`);
}

/** Featured on the homepage, within the plan's allowance. Only live products. */
export async function toggleFeaturedAction(fd: FormData) {
  const v = await requireApprovedVendor();
  const id = String(fd.get("id"));
  await withDb((db) => {
    const rec = db.products.find((x) => x.id === id && x.vendorId === v.id);
    if (!rec || rec.status !== "active") return;
    const slots = planOf(v.plan).featuredSlots;
    const used = db.products.filter((x) => x.vendorId === v.id && x.private.featured && x.id !== id).length;
    rec.private.featured = !rec.private.featured && used < slots;
  });
  revalidatePath("/vendor/products");
  revalidatePath("/", "layout");
}

/** A seller permanently deletes one of their own products. Past orders keep their copy of the item. */
export async function deleteVendorProductAction(fd: FormData) {
  const v = await requireApprovedVendor();
  const id = String(fd.get("id") ?? "");
  await withDb((db) => {
    const gone = deleteProductRecords(db, [id], v.id);
    if (gone[0]) audit(db, { id: v.id, name: `Seller: ${v.businessName}` }, "vendor.product.delete", "product", id, { before: { title: gone[0].title } });
  });
  revalidatePath("/vendor/products");
  revalidatePath("/", "layout");
  redirect("/vendor/products?deleted=1");
}
