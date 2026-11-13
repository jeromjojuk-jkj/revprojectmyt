import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { productEstimates } from "@/lib/server/estimates";
import { CATEGORIES } from "@/lib/constants";
import { BOOKED } from "@/lib/orderflow";
import { PageHeader, Pagination, btn, field, label, paginate } from "@/app/admin/_components/ui";
import { ProductTable, type ProductRow } from "./ProductTable";

export const metadata = { title: "Products" };

type SP = { q?: string; status?: string; category?: string; stock?: string; sort?: string; page?: string; deleted?: string };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requirePerm("products.view");
  const sp = await searchParams;
  const db = await readDb();
  const sold = new Map<string, number>();
  for (const o of db.orders) if (BOOKED(o.status) && o.status !== "cancelled") for (const it of o.items) sold.set(it.productId, (sold.get(it.productId) ?? 0) + it.qty);
  const t = db.store.lowStockThreshold;
  const q = sp.q?.trim().toLowerCase();
  let list = db.products.filter((p) => {
    const stock = p.variants.reduce((s, v) => s + v.stock, 0);
    if (sp.status ? p.status !== sp.status : p.status === "archived") return false;
    if (sp.category && p.category !== sp.category) return false;
    if (sp.stock === "out" && stock > 0) return false;
    if (sp.stock === "low" && !p.variants.some((v) => v.stock > 0 && v.stock <= t)) return false;
    if (q && !`${p.title} ${p.slug} ${p.brand} ${p.id} ${p.private.supplierName} ${p.variants.map((v) => v.sku).join(" ")}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const [col, dir] = (sp.sort ?? "created:desc").split(":");
  const sign = dir === "asc" ? 1 : -1;
  const stockOf = (p: (typeof list)[number]) => p.variants.reduce((s, v) => s + v.stock, 0);
  list = list.sort((a, b) => sign * (
    col === "title" ? a.title.localeCompare(b.title) : col === "price" ? a.price - b.price : col === "stock" ? stockOf(a) - stockOf(b) : col === "sold" ? (sold.get(a.id) ?? 0) - (sold.get(b.id) ?? 0) : a.createdAt.localeCompare(b.createdAt)
  ));
  const pg = paginate(list, sp.page, 30);
  const rows: ProductRow[] = pg.rows.map((p) => {
    const krip = ctx.can("finance.view") ? productEstimates(p, db.settings).find((e) => e.channel === "Krip") : undefined;
    return {
      id: p.id, slug: p.slug, title: p.title, brand: p.brand, category: p.category, image: p.images[0] ?? "", price: p.price, mrp: p.mrp,
      stock: stockOf(p), variants: p.variants.length, firstSku: p.variants[0]?.sku ?? "", status: p.status, sold: sold.get(p.id) ?? 0,
      createdAt: p.createdAt, sample: p.isSample, rights: !!p.private.rightsConfirmed, low: p.variants.some((v) => v.stock > 0 && v.stock <= t),
      cost: ctx.can("finance.view") ? p.private.purchaseCost : null,
      shippingCost: ctx.can("finance.view") ? p.private.shippingCost : null, otherCost: ctx.can("finance.view") ? p.private.otherCost ?? 0 : null,
      contribution: krip?.contribution ?? null, margin: krip?.marginPct ?? null,
    };
  });
  const params = sp as Record<string, string | undefined>;
  const krip = db.settings.channelFees.find((c) => c.channel === "Krip");
  const fees = { marketplaceFeePct: krip?.marketplaceFeePct ?? 0, paymentFeePct: krip?.paymentFeePct ?? 0, fixedFee: krip?.fixedFee ?? 0, returnAllowancePct: db.settings.returnAllowancePct };
  return (
    <div>
      <PageHeader
        title="Products"
        description="Purchase costs, suppliers and contribution estimates are visible to finance roles only and are never sent to the storefront."
        actions={<>
          {ctx.can("products.export") && <a href="/admin/export" className={btn.secondary}><Download size={16} aria-hidden /> Export CSV</a>}
          {ctx.can("products.create") && <Link href="/admin/import" className={btn.secondary}>Import CSV</Link>}
          {ctx.can("products.create") && <Link href="/admin/products/new" className={btn.primary}><Plus size={16} aria-hidden /> Add product</Link>}
        </>}
      />
      {sp.deleted && <p role="status" className="mb-4 rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Deleted “{sp.deleted}”. Past orders keep their copy of the item.</p>}
      <form className="mb-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-line sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2"><label className={label} htmlFor="pq">Search</label><input id="pq" name="q" defaultValue={sp.q} placeholder="Title, SKU, brand, supplier" className={field} /></div>
        <div><label className={label} htmlFor="ps">Status</label>
          <select id="ps" name="status" defaultValue={sp.status ?? ""} className={field}><option value="">All except archived</option><option value="active">Active</option><option value="draft">Draft</option><option value="out-of-stock">Out of stock</option><option value="archived">Archived</option></select>
        </div>
        <div><label className={label} htmlFor="pc">Category</label>
          <select id="pc" name="category" defaultValue={sp.category ?? ""} className={field}><option value="">All</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}</select>
        </div>
        <div><label className={label} htmlFor="pst">Stock</label>
          <select id="pst" name="stock" defaultValue={sp.stock ?? ""} className={field}><option value="">Any</option><option value="low">Low stock</option><option value="out">Sold out</option></select>
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5"><button className={btn.dark}>Apply</button><Link href="/admin/products" className={btn.secondary}>Clear</Link></div>
      </form>
      <ProductTable rows={rows} params={params} canEdit={ctx.can("products.edit")} canEditStock={ctx.can("inventory.edit")} canArchive={ctx.can("products.delete")} canCreate={ctx.can("products.create")} showFinance={ctx.can("finance.view")} fees={fees} />
      <Pagination base="/admin/products" params={params} page={pg.page} pages={pg.pages} total={pg.total} />
    </div>
  );
}
