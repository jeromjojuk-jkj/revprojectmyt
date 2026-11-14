"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CategoryId, MovementReason, ProductStatus } from "@/lib/types";
import { getStaff, requirePerm } from "@/lib/server/auth";
import { withDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { moveStock } from "@/lib/server/inventory";
import { applyVendorOp, FulfilmentError, type VendorOp } from "@/lib/vendorFulfilment";
import { deleteProductRecords } from "@/lib/server/catalog";
import { adminOrderAction, OrderError } from "@/lib/server/orders";
import type { OrderOp } from "@/lib/orderflow";
import { validateCouponInput } from "@/lib/coupons";
import { validateFestivalOffer } from "@/lib/festivalOffers";
import { validateStoreProfile } from "@/lib/storeProfile";
import { CATEGORIES } from "@/lib/constants";
import type { Permission } from "@/lib/rbac";

export async function markNotificationsReadAction() {
  const ctx = await getStaff();
  if (!ctx) return;
  await withDb((db) => {
    const u = db.staff.find((s) => s.id === ctx.staff.id);
    if (u) u.notificationsSeenAt = new Date().toISOString();
  });
  revalidatePath("/admin", "layout");
}

// ---------- Orders ----------

const OP_PERM: Record<OrderOp, Permission> = {
  confirm: "orders.approve", pack: "orders.edit", ship: "orders.edit", deliver: "orders.edit", tracking: "orders.edit",
  cancel: "orders.approve", hold: "orders.edit", release: "orders.approve", cod_collected: "orders.edit", refund: "orders.refund", note: "orders.view",
};

export type ActionState = { ok?: boolean; error?: string; message?: string; values?: Record<string, string> } | null;

export async function orderAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const op = String(fd.get("op")) as OrderOp;
  if (!(op in OP_PERM)) return { error: "Unknown action." };
  const { actor } = await requirePerm(OP_PERM[op]);
  const id = String(fd.get("id"));
  const str = (k: string) => String(fd.get(k) ?? "");
  try {
    await adminOrderAction(id, { op, note: str("note"), carrier: str("carrier"), awb: str("awb"), trackingUrl: str("trackingUrl"), amount: Number(str("amount")), reason: str("reason"), reference: str("reference"), update: str("update") }, actor);
  } catch (e) {
    // Hand the input back so the form can show it again (React resets forms after an action).
    if (e instanceof OrderError) return { error: e.message, values: Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string> };
    throw e;
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Saved." };
}

// ---------- Products (bulk) ----------

export async function bulkProductsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const ids = fd.getAll("ids").map(String).slice(0, 500);
  const op = String(fd.get("bulkOp"));
  if (!ids.length) return { error: "Select at least one product." };
  const perm: Permission = op === "archive" || op === "delete" ? "products.delete" : "products.edit";
  const { actor } = await requirePerm(perm);
  let message = "";
  try {
    await withDb((db) => {
      const list = db.products.filter((p) => ids.includes(p.id));
      const status = (s: ProductStatus) => {
        let skipped = 0;
        for (const p of list) {
          if (s === "active" && !p.private.rightsConfirmed) {
            skipped++;
            continue;
          }
          p.status = s;
        }
        message = `${list.length - skipped} product(s) set to ${s}.` + (skipped ? ` ${skipped} skipped: image rights not confirmed.` : "");
      };
      switch (op) {
        case "activate": status("active"); break;
        case "draft": status("draft"); break;
        case "archive": status("archived"); break;
        case "delete": {
          if (String(fd.get("confirmDelete")) !== "DELETE") throw new Error("Type DELETE to confirm permanent deletion.");
          const gone = deleteProductRecords(db, ids);
          message = `Deleted ${gone.length} product(s) permanently. Past orders keep their copy of each item.`;
          break;
        }
        case "category": {
          const c = String(fd.get("category"));
          if (!CATEGORIES.some((x) => x.id === c)) throw new Error("Choose a category.");
          for (const p of list) p.category = c as CategoryId;
          message = `Moved ${list.length} product(s) to ${c}.`;
          break;
        }
        case "price": {
          const mode = String(fd.get("priceMode"));
          const val = Number(fd.get("priceValue"));
          if (!Number.isFinite(val) || val === 0) throw new Error("Enter a price change, e.g. -10 for 10% or ₹10 lower.");
          for (const p of list) {
            const next = Math.round(mode === "percent" ? p.price * (1 + val / 100) : p.price + val);
            if (next < 1) throw new Error(`${p.title} would drop below ₹1.`);
            if (p.mrp !== null && next > p.mrp) throw new Error(`${p.title} would be priced above its MRP (₹${p.mrp}).`);
            p.price = next;
          }
          message = `Updated prices on ${list.length} product(s).`;
          break;
        }
        default:
          throw new Error("Choose a bulk action.");
      }
      audit(db, actor, `product.bulk.${op}`, "product", ids.join(",").slice(0, 200), { after: { count: list.length, category: fd.get("category"), priceMode: fd.get("priceMode"), priceValue: fd.get("priceValue") } });
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return { ok: true, message };
}

/**
 * Sets one product's selling price (and optionally its MRP, which drives the
 * "% off" shoppers see) from the product list's quick editor. mrp: undefined
 * keeps the current MRP, null removes it.
 */
export async function setProductPriceAction(id: string, price: number, mrp?: number | null): Promise<{ ok: true; price: number } | { ok: false; error: string }> {
  const { actor } = await requirePerm("products.edit");
  if (!Number.isInteger(price) || price < 1 || price > 1_000_000) return { ok: false, error: "Enter a whole rupee amount of ₹1 or more." };
  if (mrp !== undefined && mrp !== null && (!Number.isInteger(mrp) || mrp < 1 || mrp > 1_000_000)) return { ok: false, error: "MRP must be a whole rupee amount, or blank." };
  try {
    await withDb((db) => {
      const p = db.products.find((x) => x.id === id);
      if (!p) throw new Error("Product not found.");
      const nextMrp = mrp === undefined ? p.mrp : mrp;
      if (nextMrp !== null && price > nextMrp) throw new Error(`Price can’t be above the MRP (₹${nextMrp}).`);
      if (p.price === price && p.mrp === nextMrp) return;
      audit(db, actor, "product.price", "product", id, { before: { price: p.price, mrp: p.mrp }, after: { price, mrp: nextMrp } });
      p.price = price;
      p.mrp = nextMrp;
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return { ok: true, price };
}

/** Sets one product's private per-unit costs (used only for profit estimates) from the product list. */
export async function quickCostsAction(id: string, costs: { purchaseCost: number; shippingCost: number; otherCost: number }): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requirePerm("products.edit");
  if (!ctx.can("finance.view")) return { ok: false, error: "Editing costs needs finance access." };
  for (const [k, v] of Object.entries(costs)) {
    if (!Number.isFinite(v) || v < 0 || v > 1_000_000) return { ok: false, error: `${k === "purchaseCost" ? "Purchase cost" : k === "shippingCost" ? "Shipping cost" : "Other costs"} must be 0 or more.` };
  }
  try {
    await withDb((db) => {
      const p = db.products.find((x) => x.id === id);
      if (!p) throw new Error("Product not found.");
      const before = { purchaseCost: p.private.purchaseCost, shippingCost: p.private.shippingCost, otherCost: p.private.otherCost ?? 0 };
      const round = (n: number) => Math.round(n * 100) / 100;
      Object.assign(p.private, { purchaseCost: round(costs.purchaseCost), shippingCost: round(costs.shippingCost), otherCost: round(costs.otherCost) });
      audit(db, ctx.actor, "product.costs", "product", id, { before, after: costs });
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function duplicateProductAction(fd: FormData) {
  const { actor } = await requirePerm("products.create");
  const id = String(fd.get("id"));
  let newId = "";
  await withDb((db) => {
    const p = db.products.find((x) => x.id === id);
    if (!p) throw new Error("Product not found");
    const max = db.products.reduce((m, x) => Math.max(m, Number(x.id.replace(/\D/g, "")) || 0), 0);
    newId = `p${String(max + 1).padStart(3, "0")}`;
    const slugs = new Set(db.products.map((x) => x.slug));
    let slug = `${p.slug}-copy`;
    for (let n = 2; slugs.has(slug); n++) slug = `${p.slug}-copy-${n}`;
    const skus = new Set(db.products.flatMap((x) => x.variants.map((v) => v.sku)));
    const copy = structuredClone(p);
    Object.assign(copy, { id: newId, slug, title: `${p.title} (copy)`, status: "draft", isSample: false, reviews: [], createdAt: new Date().toISOString() });
    copy.variants = copy.variants.map((v) => {
      let sku = `${v.sku}-C`;
      for (let n = 2; skus.has(sku); n++) sku = `${v.sku}-C${n}`;
      skus.add(sku);
      return { ...v, sku, stock: 0 };
    });
    db.products.push(copy);
    audit(db, actor, "product.duplicate", "product", newId, { after: { from: id } });
  });
  redirect(`/admin/products/${newId}`);
}

// ---------- Inventory ----------

const ADJUST_REASONS: MovementReason[] = ["received", "returned", "damaged", "lost", "correction", "audit_count"];

export async function stockAdjustAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { actor } = await requirePerm("inventory.edit");
  const sku = String(fd.get("sku"));
  const reason = String(fd.get("reason")) as MovementReason;
  const mode = String(fd.get("mode"));
  const qty = Number(fd.get("qty"));
  const ref = String(fd.get("ref") ?? "").trim().slice(0, 80);
  if (!ADJUST_REASONS.includes(reason)) return { error: "Choose a reason." };
  if (!["add", "remove", "set"].includes(mode)) return { error: "Choose add, remove or set." };
  if (!Number.isInteger(qty) || qty < 0 || (mode !== "set" && qty === 0) || qty > 100_000) return { error: "Enter a whole number of units." };
  try {
    await withDb((db) => {
      const v = db.products.flatMap((p) => p.variants).find((x) => x.sku === sku);
      if (!v) throw new Error("Unknown SKU.");
      const delta = mode === "set" ? qty - v.stock : mode === "add" ? qty : -qty;
      if (delta === 0) throw new Error("That’s already the stock level.");
      const before = v.stock;
      moveStock(db, sku, delta, reason, ref || "manual", actor.name);
      audit(db, actor, "inventory.adjust", "sku", sku, { before: { stock: before }, after: { stock: v.stock, reason, ref } });
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin/inventory");
  revalidatePath("/", "layout");
  return { ok: true, message: `Stock for ${sku} updated.` };
}

/**
 * Quick stock edit from the product list. "set" records a stock count; "add"
 * records received stock (positive) or a correction (negative).
 */
export async function quickStockAction(sku: string, mode: "set" | "add", qty: number): Promise<{ ok: true; stock: number } | { ok: false; error: string }> {
  const { actor } = await requirePerm("inventory.edit");
  if (!Number.isInteger(qty) || Math.abs(qty) > 100_000 || (mode === "set" && qty < 0)) return { ok: false, error: "Enter a whole number of units." };
  let stock = 0;
  try {
    await withDb((db) => {
      const v = db.products.flatMap((p) => p.variants).find((x) => x.sku === sku);
      if (!v) throw new Error("Unknown SKU.");
      const delta = mode === "set" ? qty - v.stock : qty;
      const before = v.stock;
      if (delta !== 0) {
        const reason: MovementReason = mode === "set" ? "audit_count" : delta > 0 ? "received" : "correction";
        moveStock(db, sku, delta, reason, "quick edit", actor.name);
        audit(db, actor, "inventory.adjust", "sku", sku, { before: { stock: before }, after: { stock: v.stock, reason } });
      }
      stock = v.stock;
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/admin/inventory");
  revalidatePath("/", "layout");
  return { ok: true, stock };
}

// ---------- Customers ----------

export async function customerNoteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { actor } = await requirePerm("customers.edit");
  const id = String(fd.get("id"));
  const text = String(fd.get("note") ?? "").trim().slice(0, 500);
  const groups = String(fd.get("groups") ?? "").split(",").map((g) => g.trim().slice(0, 30)).filter(Boolean).slice(0, 10);
  if (!/^[0-9a-f]{16}$/.test(id)) return { error: "Unknown customer." };
  await withDb((db) => {
    const m = (db.customers[id] ??= { notes: [], groups: [] });
    if (fd.has("groups")) {
      audit(db, actor, "customer.groups", "customer", id, { before: m.groups, after: groups });
      m.groups = groups;
    }
    if (text) {
      m.notes.push({ at: new Date().toISOString(), by: actor.name, text });
      audit(db, actor, "customer.note", "customer", id);
    }
  });
  revalidatePath(`/admin/customers/${id}`);
  return { ok: true, message: "Saved." };
}

// ---------- Coupons ----------

export type CouponFormState = { errors?: Record<string, string>; message?: string; values?: Record<string, string> } | null;

export async function saveCouponAction(_: CouponFormState, fd: FormData): Promise<CouponFormState> {
  const original = String(fd.get("original") ?? "");
  const { actor } = await requirePerm(original ? "coupons.edit" : "coupons.create");
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  raw.categories = fd.getAll("categories").map(String).join(",");
  const res = validateCouponInput(raw, CATEGORIES.map((c) => c.id));
  if (!res.ok) return { errors: res.errors, values: raw, message: "Please fix the highlighted fields." };
  try {
    await withDb((db) => {
      const list = db.settings.coupons;
      const clash = list.find((c) => c.code === res.coupon.code && c.code !== original);
      if (clash) throw Object.assign(new Error("dup"), { field: "code" });
      const i = list.findIndex((c) => c.code === original);
      const before = i >= 0 ? list[i] : undefined;
      if (i >= 0) list[i] = res.coupon;
      else list.push(res.coupon);
      audit(db, actor, before ? "coupon.update" : "coupon.create", "coupon", res.coupon.code, { before, after: res.coupon });
    });
  } catch (e) {
    if ((e as { field?: string }).field) return { errors: { code: "A coupon with this code already exists." }, values: raw };
    throw e;
  }
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons?saved=1");
}

export async function couponQuickAction(fd: FormData) {
  const op = String(fd.get("op"));
  const { actor } = await requirePerm(op === "delete" ? "coupons.delete" : "coupons.edit");
  const code = String(fd.get("code"));
  await withDb((db) => {
    const i = db.settings.coupons.findIndex((c) => c.code === code);
    if (i < 0) return;
    if (op === "toggle") db.settings.coupons[i].active = !db.settings.coupons[i].active;
    else if (op === "delete") db.settings.coupons.splice(i, 1);
    audit(db, actor, `coupon.${op}`, "coupon", code);
  });
  revalidatePath("/admin/coupons");
}

// ---------- Store settings ----------

export type StoreFormState = { errors?: Record<string, string>; ok?: boolean; values?: Record<string, string> } | null;

export async function storeSettingsAction(_: StoreFormState, fd: FormData): Promise<StoreFormState> {
  const { actor } = await requirePerm("storefront.manage");
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const res = validateStoreProfile(raw, { acceptedPayments: fd.getAll("acceptedPayments").map(String) });
  if (!res.ok) return { errors: res.errors, values: raw };
  await withDb((db) => {
    audit(db, actor, "store.update", "store", "profile", { before: db.store, after: res.value });
    db.store = res.value;
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------- Festival offers ----------

export async function saveFestivalOfferAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { actor } = await requirePerm("coupons.edit");
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const res = validateFestivalOffer(raw);
  if (!res.ok) return { error: res.error };
  const id = raw.id || `${res.value.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${res.value.date.slice(0, 4)}-${Date.now().toString(36).slice(-4)}`;
  await withDb((db) => {
    const list = (db.settings.festivalOffers ??= []);
    const i = list.findIndex((f) => f.id === id);
    const before = i >= 0 ? list[i] : undefined;
    const next = { ...res.value, id };
    if (i >= 0) list[i] = next;
    else list.push(next);
    list.sort((a, b) => a.date.localeCompare(b.date));
    audit(db, actor, before ? "festival_offer.update" : "festival_offer.create", "festival_offer", id, { before, after: next });
  });
  revalidatePath("/", "layout");
  return { ok: true, message: `${res.value.name} saved.` };
}

export async function deleteFestivalOfferAction(fd: FormData) {
  const { actor } = await requirePerm("coupons.delete");
  const id = String(fd.get("id"));
  await withDb((db) => {
    const list = db.settings.festivalOffers ?? [];
    const i = list.findIndex((f) => f.id === id);
    if (i < 0) return;
    audit(db, actor, "festival_offer.delete", "festival_offer", id, { before: list[i] });
    list.splice(i, 1);
  });
  revalidatePath("/", "layout");
}

/** Permanently deletes one product from its edit page. */
export async function deleteProductAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { actor } = await requirePerm("products.delete");
  const id = String(fd.get("id") ?? "");
  if (String(fd.get("confirmDelete")) !== "DELETE") return { error: "Type DELETE to confirm." };
  let title = "";
  await withDb((db) => {
    const gone = deleteProductRecords(db, [id]);
    title = gone[0]?.title ?? "";
    if (gone[0]) audit(db, actor, "product.delete", "product", id, { before: { title, vendorId: gone[0].vendorId ?? null } });
  });
  if (!title) return { error: "Product not found (maybe already deleted)." };
  revalidatePath("/", "layout");
  redirect(`/admin/products?deleted=${encodeURIComponent(title.slice(0, 80))}`);
}

/** Krip staff update a seller's part of an order on the seller's behalf (same steps as the seller panel). */
export async function adminVendorPartAction(_: { ok?: string; error?: string } | null, fd: FormData): Promise<{ ok?: string; error?: string }> {
  const { actor } = await requirePerm("orders.edit");
  const id = String(fd.get("orderId") ?? "");
  const vendorId = String(fd.get("vendorId") ?? "");
  const op = String(fd.get("op") ?? "") as VendorOp;
  if (!["accept", "pack", "ship", "tracking", "deliver"].includes(op)) return { error: "Unknown action." };
  const s = (k: string) => String(fd.get(k) ?? "");
  try {
    await withDb((db) => {
      const o = db.orders.find((x) => x.id === id);
      if (!o) throw new FulfilmentError("Order not found.");
      const vendor = db.vendors.find((v) => v.id === vendorId)?.businessName ?? vendorId;
      const what = applyVendorOp(o, vendorId, op, { carrier: s("carrier"), awb: s("awb"), trackingUrl: s("trackingUrl"), update: s("update"), note: s("note") }, `Krip (${actor.name}) for ${vendor}`);
      audit(db, actor, `order.seller_part.${op}`, "order", o.id, { after: { vendorId, what } });
    });
  } catch (e) {
    if (e instanceof FulfilmentError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/vendor/orders");
  revalidatePath("/admin", "layout");
  const done: Record<string, string> = { accept: "Accepted for the seller.", pack: "Marked as packed for the seller.", ship: "Marked as shipped — the customer can track it.", tracking: "Tracking update posted.", deliver: "Marked as delivered — the seller’s wallet is credited." };
  return { ok: done[op] };
}
