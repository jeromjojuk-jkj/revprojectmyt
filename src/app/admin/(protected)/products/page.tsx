import Link from "next/link";
import { readDb } from "@/lib/server/db";
import { productEstimates } from "@/lib/server/estimates";
import { formatPrice } from "@/lib/format";
import { CATEGORY_NAME } from "@/lib/constants";
import { quickStockAction } from "../../actions";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const db = await readDb();
  let list = db.products;
  if (status) list = list.filter((p) => p.status === status || (status === "out-of-stock" && p.variants.every((v) => v.stock === 0)));
  if (q) list = list.filter((p) => `${p.title} ${p.slug} ${p.private.supplierName} ${p.variants.map((v) => v.sku).join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Products ({list.length})</h1>
        <div className="flex gap-2">
          <a href="/admin/export" className="flex h-11 items-center rounded-xl px-4 text-sm font-semibold ring-1 ring-line">Export CSV</a>
          <Link href="/admin/products/new" className="flex h-11 items-center rounded-xl bg-leaf px-4 text-sm font-semibold text-white">Add product</Link>
        </div>
      </div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search title, SKU, supplier" className="h-11 min-w-0 flex-1 rounded-xl border-2 border-line bg-white px-3" />
        <select name="status" defaultValue={status ?? ""} className="h-11 rounded-xl border-2 border-line bg-white px-2">
          <option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="out-of-stock">Out of stock</option>
        </select>
        <button className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white">Filter</button>
      </form>
      <p className="text-xs text-ink-soft">Purchase costs, suppliers and contribution estimates are visible to signed-in admins only and are never sent to the storefront.</p>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-paper text-left text-xs text-ink-soft">
            <tr>
              <th className="px-3 py-2">Product</th><th className="px-3 py-2">Supplier / ref</th><th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Cost</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Est. contribution / unit</th><th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              const est = productEstimates(p, db.settings);
              return (
                <tr key={p.id} className="border-t border-line align-top">
                  <td className="px-3 py-2">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-leaf underline">{p.title}</Link>
                    <p className="text-xs text-ink-soft">{p.id} · {CATEGORY_NAME[p.category]} · {p.variants.length} variants{p.isSample ? " · sample" : ""}</p>
                  </td>
                  <td className="px-3 py-2 text-xs">{p.private.supplierName}<br /><span className="text-ink-soft">{p.private.sourceRef}</span></td>
                  <td className={`px-3 py-2 ${stock === 0 ? "font-semibold text-danger" : ""}`}>{stock}</td>
                  <td className="px-3 py-2">{formatPrice(p.private.purchaseCost)}</td>
                  <td className="px-3 py-2">{formatPrice(p.price)}{p.mrp ? <span className="block text-xs text-ink-soft">MRP {formatPrice(p.mrp)}</span> : null}</td>
                  <td className="px-3 py-2 text-xs">
                    {est.map((e) => (
                      <div key={e.channel}>{e.channel}: {e.contribution === null ? "no price set" : <b className={e.contribution < 0 ? "text-danger" : ""}>{formatPrice(e.contribution)} ({e.marginPct}%)</b>}</div>
                    ))}
                  </td>
                  <td className="px-3 py-2">
                    <form action={quickStockAction} className="flex gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <select name="status" defaultValue={p.status} aria-label={`Status for ${p.title}`} className="h-9 rounded-lg border border-line bg-white px-1 text-xs">
                        <option value="draft">Draft</option><option value="active">Active</option><option value="out-of-stock">Out of stock</option>
                      </select>
                      <button className="h-9 rounded-lg px-2 text-xs font-semibold ring-1 ring-line">Set</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-soft">Estimates use the channel fees and return allowance in <Link href="/admin/settings" className="underline">Fees & settings</Link>. They are estimates, not accounting results.</p>
    </div>
  );
}
