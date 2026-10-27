"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Settings } from "@/lib/types";
import { login, logout, requirePerm } from "@/lib/server/auth";
import { readDb, resetDb, withDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { moveStock } from "@/lib/server/inventory";
import { importCsv, validateProductInput, type FieldErrors, type RawProductInput, type CsvImportResult } from "@/lib/productInput";

export async function loginAction(_: unknown, fd: FormData): Promise<{ error: string; needCode?: boolean } | null> {
  const res = await login(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""), String(fd.get("code") ?? ""));
  if (!res.ok) return { error: res.error, needCode: res.needCode };
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
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
  const editing = !!String(fd.get("id") ?? "");
  const { actor } = await requirePerm(editing ? "products.edit" : "products.create");
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
      if (existing) {
        // Stock edits from the product form go through the ledger like any other change.
        const before = { title: existing.title, price: existing.price, mrp: existing.mrp, status: existing.status, stock: Object.fromEntries(existing.variants.map((v) => [v.sku, v.stock])) };
        const wanted = new Map(res.product.variants.map((v) => [v.sku, v.stock]));
        const oldStock = new Map(existing.variants.map((v) => [v.sku, v.stock]));
        res.product.variants = res.product.variants.map((v) => ({ ...v, stock: oldStock.get(v.sku) ?? 0 }));
        Object.assign(existing, res.product);
        for (const [sku, n] of wanted) moveStock(db, sku, n - (oldStock.get(sku) ?? 0), "product_edit", existing.id, actor.name);
        audit(db, actor, "product.update", "product", existing.id, { before, after: { title: existing.title, price: existing.price, mrp: existing.mrp, status: existing.status, stock: Object.fromEntries(wanted) } });
      } else {
        const wanted = res.product.variants.map((v) => [v.sku, v.stock] as const);
        res.product.variants = res.product.variants.map((v) => ({ ...v, stock: 0 }));
        db.products.push(res.product);
        for (const [sku, n] of wanted) moveStock(db, sku, n, "received", res.product.id, actor.name);
        audit(db, actor, "product.create", "product", res.product.id, { after: { title: res.product.title, price: res.product.price, status: res.product.status } });
      }
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
  const { actor } = await requirePerm("products.edit");
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  await withDb((db) => {
    const p = db.products.find((x) => x.id === id);
    if (!p) return;
    if (["draft", "active", "out-of-stock", "archived"].includes(status)) {
      if (status === "active" && !p.private.rightsConfirmed) return;
      const before = p.status;
      p.status = status as typeof p.status;
      audit(db, actor, "product.status", "product", p.id, { before: { status: before }, after: { status } });
    }
  });
  revalidatePath("/admin/products");
}

export async function importAction(_: unknown, fd: FormData): Promise<{ result: Omit<CsvImportResult, "products"> & { preview: { slug: string; title: string; variants: number; status: string }[] }; committed: boolean } | { error: string }> {
  const { actor } = await requirePerm("products.create");
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
        if (r.errors.length === 0) {
          for (const p of r.products) {
            const wanted = p.variants.map((v) => [v.sku, v.stock] as const);
            p.variants = p.variants.map((v) => ({ ...v, stock: 0 }));
            db.products.push(p);
            for (const [sku, n] of wanted) moveStock(db, sku, n, "import", p.id, actor.name);
          }
          audit(db, actor, "product.import", "product", r.products.map((p) => p.id).join(",").slice(0, 200), { after: { count: r.products.length } });
        }
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

export async function settingsAction(_: unknown, fd: FormData) {
  const { actor } = await requirePerm("finance.manage");
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
  if (errors.length) return { errors, ok: false };
  await withDb((db) => {
    const before = { ...db.settings, coupons: undefined };
    db.settings = { ...db.settings, deliveryFee, freeDeliveryAbove: free, codFee, codMaxOrderValue: codMax, returnAllowancePct: ret, channelFees };
    audit(db, actor, "settings.fees", "settings", "fees", { before, after: { ...db.settings, coupons: undefined } });
  });
  revalidatePath("/", "layout");
  return { ok: true, errors: [] as string[] };
}

export async function resetDemoAction() {
  const { actor } = await requirePerm("system.manage");
  await resetDb();
  await withDb((db) => audit(db, actor, "system.reset_demo", "system", "datastore"));
  revalidatePath("/", "layout");
  redirect("/admin?reset=1");
}

export type OfferFormState = { errors?: Record<string, string>; message?: string; values?: Record<string, string> } | null;

export async function saveOfferAction(_: OfferFormState, fd: FormData): Promise<OfferFormState> {
  const { actor } = await requirePerm(fd.get("id") ? "offers.edit" : "offers.create");
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const { validateOffer } = await import("@/lib/offers");
  const { toPublicProduct } = await import("@/lib/server/catalog");
  const db = await readDb();
  const res = validateOffer(raw, db.products.filter((p) => p.status !== "draft" && p.status !== "archived").map(toPublicProduct));
  if (!res.ok) return { errors: res.errors, values: raw, message: "Please fix the highlighted fields." };
  await withDb((d) => {
    const existing = raw.id ? d.offers.find((o) => o.id === raw.id) : undefined;
    if (existing) Object.assign(existing, res.offer);
    else d.offers.push({ id: `o-${Date.now().toString(36)}`, ...res.offer });
    audit(d, actor, existing ? "offer.update" : "offer.create", "offer", existing?.id ?? d.offers.at(-1)!.id, { after: res.offer });
  });
  revalidatePath("/", "layout");
  redirect("/admin/offers?saved=1");
}

export async function offerQuickAction(fd: FormData) {
  const id = String(fd.get("id"));
  const op = String(fd.get("op"));
  const { actor } = await requirePerm(op === "delete" ? "offers.delete" : "offers.edit");
  await withDb((d) => {
    const i = d.offers.findIndex((o) => o.id === id);
    if (i < 0) return;
    if (op === "toggle") d.offers[i].active = !d.offers[i].active;
    else if (op === "delete") d.offers.splice(i, 1);
    else if (op === "up" && i > 0) [d.offers[i - 1], d.offers[i]] = [d.offers[i], d.offers[i - 1]];
    else if (op === "down" && i < d.offers.length - 1) [d.offers[i + 1], d.offers[i]] = [d.offers[i], d.offers[i + 1]];
    audit(d, actor, `offer.${op}`, "offer", id);
  });
  revalidatePath("/", "layout");
}
