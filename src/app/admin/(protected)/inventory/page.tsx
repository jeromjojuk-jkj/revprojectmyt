import Link from "next/link";
import { History } from "lucide-react";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { commitments } from "@/lib/server/inventory";
import { formatPrice } from "@/lib/format";
import { Badge, Empty, PageHeader, Pagination, btn, field, label, paginate, td, th } from "@/app/admin/_components/ui";
import { AdjustStock } from "./AdjustStock";

export const metadata = { title: "Inventory" };

export default async function Inventory({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  const ctx = await requirePerm("inventory.view");
  const sp = await searchParams;
  const db = await readDb();
  const { held, allocated } = commitments(db);
  const t = db.store.lowStockThreshold;
  const q = sp.q?.trim().toLowerCase();
  const all = db.products.filter((p) => p.status !== "archived").flatMap((p) => p.variants.map((v) => ({ p, v })));
  const rows = all.filter(({ p, v }) => {
    if (sp.filter === "low" && !(v.stock > 0 && v.stock <= t)) return false;
    if (sp.filter === "out" && v.stock !== 0) return false;
    if (q && !`${p.title} ${v.sku} ${v.color} ${v.size ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => a.v.stock - b.v.stock);
  const pg = paginate(rows, sp.page, 40);
  const units = all.reduce((s, x) => s + x.v.stock, 0);
  const value = ctx.can("finance.view") ? all.reduce((s, x) => s + x.v.stock * x.p.private.purchaseCost, 0) : null;
  const params = sp as Record<string, string | undefined>;
  const stat = (l: string, v: string | number, href?: string) => {
    const body = <><p className="text-xs text-ink-soft">{l}</p><p className="text-xl font-bold tabular-nums">{v}</p></>;
    return href ? <Link href={href} className="rounded-2xl bg-white p-4 ring-1 ring-line hover:ring-leaf">{body}</Link> : <div className="rounded-2xl bg-white p-4 ring-1 ring-line">{body}</div>;
  };
  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Sellable stock per variant. Every change — orders, releases, adjustments, imports and product edits — is written to the stock ledger with who, why and the resulting balance."
        actions={<Link href="/admin/inventory/movements" className={btn.secondary}><History size={16} aria-hidden /> Stock ledger</Link>}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stat("Units available to sell", units)}
        {stat(`Low stock (≤ ${t})`, all.filter((x) => x.v.stock > 0 && x.v.stock <= t).length, "/admin/inventory?filter=low")}
        {stat("Sold out variants", all.filter((x) => x.v.stock === 0).length, "/admin/inventory?filter=out")}
        {stat("Stock value at cost", value === null ? "—" : formatPrice(value))}
      </div>
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1"><label className={label} htmlFor="iq">Search product, SKU, colour or size</label><input id="iq" name="q" defaultValue={sp.q} className={field} /></div>
        <div><label className={label} htmlFor="if">Show</label><select id="if" name="filter" defaultValue={sp.filter ?? ""} className={field}><option value="">All variants</option><option value="low">Low stock</option><option value="out">Sold out</option></select></div>
        <button className={btn.dark}>Apply</button>
      </form>
      {pg.rows.length === 0 ? <Empty title="Nothing to show">No variants match.</Empty> : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-paper"><tr>
              <th className={th}>Variant</th><th className={th}>SKU</th>
              <th className={`${th} text-right`} title="Units that can be sold now">Available</th>
              <th className={`${th} text-right`} title="Held by online orders awaiting payment (released automatically after 15 minutes)">Held</th>
              <th className={`${th} text-right`} title="Sold and not yet shipped">Allocated</th>
              <th className={th}>Status</th>
              {ctx.can("inventory.edit") && <th className={th}>Adjust</th>}
            </tr></thead>
            <tbody>
              {pg.rows.map(({ p, v }) => (
                <tr key={v.sku} className="border-t border-line align-middle">
                  <td className={td}><Link href={`/admin/products/${p.id}`} className="font-medium hover:text-leaf">{p.title}</Link><span className="block text-xs text-ink-soft"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle ring-1 ring-line" style={{ background: `#${v.colorHex}` }} aria-hidden />{v.color}{v.size ? ` · ${v.size}` : ""}</span></td>
                  <td className={`${td} font-mono text-xs`}>{v.sku}</td>
                  <td className={`${td} text-right text-base font-bold tabular-nums ${v.stock === 0 ? "text-danger" : v.stock <= t ? "text-amber-700" : ""}`}>{v.stock}</td>
                  <td className={`${td} text-right tabular-nums text-ink-soft`}>{held[v.sku] ?? 0}</td>
                  <td className={`${td} text-right tabular-nums text-ink-soft`}>{allocated[v.sku] ?? 0}</td>
                  <td className={td}>{v.stock === 0 ? <Badge tone="red">Sold out</Badge> : v.stock <= t ? <Badge tone="yellow">Low</Badge> : <Badge tone="green">In stock</Badge>}</td>
                  {ctx.can("inventory.edit") && <td className={td}><AdjustStock sku={v.sku} current={v.stock} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination base="/admin/inventory" params={params} page={pg.page} pages={pg.pages} total={pg.total} />
      <p className="mt-3 text-xs text-ink-soft">Single warehouse. Multi-warehouse stock, transfers and purchase orders are on the <Link href="/admin/roadmap" className="underline">roadmap</Link>.</p>
    </div>
  );
}
