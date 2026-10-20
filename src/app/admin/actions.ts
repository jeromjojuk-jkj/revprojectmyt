"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderStatus, Settings } from "@/lib/types";
import { login, logout, requireAdmin } from "@/lib/server/auth";
import { readDb, resetDb, withDb } from "@/lib/server/db";
import { adminSetStatus, OrderError } from "@/lib/server/orders";
import { importCsv, validateProductInput, type FieldErrors, type RawProductInput, type CsvImportResult } from "@/lib/productInput";

export async function loginAction(_: unknown, fd: FormData) {
  const res = await login(String(fd.get("password") ?? ""));
  if (!res.ok) return { error: res.error };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

function nextProductId(ids: string[]) {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, "")) || 0), 0);
  return `p${String(max + 1).padStart(3, "0")}`;
}

export type SaveProductState = { errors?: FieldErrors; message?: string; values?: RawProductInput } | null;

export async function saveProductAction(_: SaveProductState, fd: FormData): Promise<SaveProductState> {
  await requireAdmin();
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as RawProductInput;
  const editingId = String(fd.get("id") ?? "");
  let savedId = "";
  try {
    await withDb((db) => {
      const existing = editingId ? db.products.find((p) => p.id === editingId) : undefined;
      if (editingId && !existing) throw new Error("Product not found");
      const others = db.products.filter((p) => p.id !== editingId);
      const res = validateProductInput(raw, {
        existingSlugs: new Set(others.map((p) => p.slug)),
        existingSkus: new Set(others.flatMap((p) => p.variants.map((v) => v.sku))),
        id: existing?.id ?? nextProductId(db.products.map((p) => p.id)),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        isSample: existing?.isSample ?? false,
      });
      if (!res.ok) throw Object.assign(new Error("validation"), { fieldErrors: res.errors });
      res.product.reviews = existing?.reviews ?? [];
      if (existing) Object.assign(existing, res.product);
      else db.products.push(res.product);
      savedId = res.product.id;
    });
  } catch (e) {
    const fe = (e as { fieldErrors?: FieldErrors }).fieldErrors;
    if (fe) return { errors: fe, values: raw, message: "Please fix the highlighted fields." };
    return { message: (e as Error).message, values: raw };
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products/${savedId}?saved=1`);
}

export async function quickStockAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  await withDb((db) => {
    const p = db.products.find((x) => x.id === id);
    if (!p) return;
    if (["draft", "active", "out-of-stock"].includes(status)) {
      if (status === "active" && !p.private.rightsConfirmed) return;
      p.status = status as typeof p.status;
    }
  });
  revalidatePath("/admin/products");
}

export async function importAction(_: unknown, fd: FormData): Promise<{ result: Omit<CsvImportResult, "products"> & { preview: { slug: string; title: string; variants: number; status: string }[] }; committed: boolean } | { error: string }> {
  await requireAdmin();
  const file = fd.get("file");
  let text = String(fd.get("csv") ?? "");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2_000_000) return { error: "File is larger than 2 MB." };
    text = await file.text();
  }
  if (!text.trim()) return { error: "Choose a CSV file or paste CSV text." };
  const commit = fd.get("mode") === "commit";
  const run = (db: Awaited<ReturnType<typeof readDb>>) => {
    let counter = db.products.length;
    const ids = db.products.map((p) => p.id);
    return importCsv(text, {
      existingSlugs: new Set(db.products.map((p) => p.slug)),
      existingSkus: new Set(db.products.flatMap((p) => p.variants.map((v) => v.sku))),
      nextId: () => {
        const id = nextProductId(ids);
        ids.push(id);
        counter++;
        return id;
      },
      now: new Date().toISOString(),
    });
  };
  const result = commit
    ? await withDb((db) => {
        const r = run(db);
        // All-or-nothing: only commit when every row is valid.
        if (r.errors.length === 0) db.products.push(...r.products);
        return r;
      })
    : run(await readDb());
  if (commit && result.errors.length === 0) revalidatePath("/", "layout");
  return {
    committed: commit && result.errors.length === 0,
    result: {
      errors: result.errors,
      rowCount: result.rowCount,
      preview: result.products.map((p) => ({ slug: p.slug, title: p.title, variants: p.variants.length, status: p.status })),
    },
  };
}

export async function orderStatusAction(fd: FormData) {
  await requireAdmin();
  try {
    await adminSetStatus(String(fd.get("id")), String(fd.get("status")) as OrderStatus, String(fd.get("note") ?? "").slice(0, 200) || undefined);
  } catch (e) {
    if (!(e instanceof OrderError)) throw e;
  }
  revalidatePath("/admin/orders");
}

export async function settingsAction(_: unknown, fd: FormData) {
  await requireAdmin();
  const n = (k: string) => Number(String(fd.get(k) ?? "").trim());
  const errors: string[] = [];
  const deliveryFee = n("deliveryFee");
  const freeRaw = String(fd.get("freeDeliveryAbove") ?? "").trim();
  const free = freeRaw === "" ? null : Number(freeRaw);
  const codFee = n("codFee");
  const codMax = n("codMaxOrderValue");
  const ret = n("returnAllowancePct");
  if (!(deliveryFee >= 0)) errors.push("Delivery fee must be ≥ 0.");
  if (free !== null && !(free > 0)) errors.push("Free-delivery threshold must be blank or > 0.");
  if (!(codFee >= 0)) errors.push("COD fee must be ≥ 0.");
  if (!(codMax > 0)) errors.push("COD max order value must be > 0.");
  if (!(ret >= 0 && ret <= 100)) errors.push("Return allowance must be 0–100%.");

  const channelFees: Settings["channelFees"] = [];
  for (const line of String(fd.get("channelFees") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const [channel, mp, pay, fixed] = line.split("|").map((x) => x.trim());
    const v = [Number(mp), Number(pay), Number(fixed ?? 0)];
    if (!channel || v.some((x) => !Number.isFinite(x) || x < 0)) {
      errors.push(`Channel fee line “${line}” should look like “Amazon | 15 | 0 | 40”.`);
      continue;
    }
    channelFees.push({ channel, marketplaceFeePct: v[0], paymentFeePct: v[1], fixedFee: v[2] });
  }
  const coupons: Settings["coupons"] = [];
  for (const line of String(fd.get("coupons") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const [code, amount, min, active, ...desc] = line.split("|").map((x) => x.trim());
    const a = Number(amount), m = Number(min);
    if (!/^[A-Z0-9]{3,20}$/i.test(code ?? "") || !(a > 0) || !(m >= 0)) {
      errors.push(`Coupon line “${line}” should look like “CODE | 50 | 699 | active | description”.`);
      continue;
    }
    coupons.push({ code: code.toUpperCase(), amountOff: a, minSubtotal: m, active: active !== "inactive", description: desc.join(" | ") || `₹${a} off orders of ₹${m}+` });
  }
  if (errors.length) return { errors, ok: false };
  await withDb((db) => {
    db.settings = { deliveryFee, freeDeliveryAbove: free, codFee, codMaxOrderValue: codMax, returnAllowancePct: ret, channelFees, coupons };
  });
  revalidatePath("/", "layout");
  return { ok: true, errors: [] as string[] };
}

export async function resetDemoAction() {
  await requireAdmin();
  await resetDb();
  revalidatePath("/", "layout");
  redirect("/admin?reset=1");
}

export type OfferFormState = { errors?: Record<string, string>; message?: string; values?: Record<string, string> } | null;

export async function saveOfferAction(_: OfferFormState, fd: FormData): Promise<OfferFormState> {
  await requireAdmin();
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const { validateOffer } = await import("@/lib/offers");
  const { toPublicProduct } = await import("@/lib/server/catalog");
  const db = await readDb();
  const res = validateOffer(raw, db.products.filter((p) => p.status !== "draft").map(toPublicProduct));
  if (!res.ok) return { errors: res.errors, values: raw, message: "Please fix the highlighted fields." };
  await withDb((d) => {
    const existing = raw.id ? d.offers.find((o) => o.id === raw.id) : undefined;
    if (existing) Object.assign(existing, res.offer);
    else d.offers.push({ id: `o-${Date.now().toString(36)}`, ...res.offer });
  });
  revalidatePath("/", "layout");
  redirect("/admin/offers?saved=1");
}

export async function offerQuickAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const op = String(fd.get("op"));
  await withDb((d) => {
    const i = d.offers.findIndex((o) => o.id === id);
    if (i < 0) return;
    if (op === "toggle") d.offers[i].active = !d.offers[i].active;
    else if (op === "delete") d.offers.splice(i, 1);
    else if (op === "up" && i > 0) [d.offers[i - 1], d.offers[i]] = [d.offers[i], d.offers[i - 1]];
    else if (op === "down" && i < d.offers.length - 1) [d.offers[i + 1], d.offers[i]] = [d.offers[i], d.offers[i + 1]];
  });
  revalidatePath("/", "layout");
}
