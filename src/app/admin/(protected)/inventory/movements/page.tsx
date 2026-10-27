import Link from "next/link";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { formatDate } from "@/lib/format";
import { Empty, PageHeader, Pagination, btn, field, label, paginate, td, th } from "@/app/admin/_components/ui";

export const metadata = { title: "Stock ledger" };

const REASON: Record<string, string> = { order_reserved: "Order reserved", order_released: "Order released", received: "Received", returned: "Customer return", damaged: "Damaged", lost: "Lost", correction: "Correction", audit_count: "Stock count", product_edit: "Product edit", import: "CSV import" };

export default async function Movements({ searchParams }: { searchParams: Promise<{ q?: string; reason?: string; page?: string }> }) {
  await requirePerm("inventory.view");
  const sp = await searchParams;
  const db = await readDb();
  const titles = new Map(db.products.map((p) => [p.id, p.title]));
  const q = sp.q?.trim().toLowerCase();
  const list = db.movements.filter((m) => (!sp.reason || m.reason === sp.reason) && (!q || `${m.sku} ${m.ref} ${titles.get(m.productId) ?? ""} ${m.by}`.toLowerCase().includes(q))).reverse();
  const pg = paginate(list, sp.page, 50);
  return (
    <div>
      <PageHeader title="Stock ledger" description="Append-only record of every stock change. Balances are the sellable quantity after the change." actions={<Link href="/admin/inventory" className={btn.secondary}>← Inventory</Link>} />
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1"><label className={label} htmlFor="mq">SKU, product, reference or staff</label><input id="mq" name="q" defaultValue={sp.q} className={field} /></div>
        <div><label className={label} htmlFor="mr">Reason</label><select id="mr" name="reason" defaultValue={sp.reason ?? ""} className={field}><option value="">All</option>{Object.entries(REASON).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <button className={btn.dark}>Apply</button>
      </form>
      {pg.rows.length === 0 ? <Empty title="No stock movements yet">Movements appear as orders are placed and stock is adjusted.</Empty> : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-paper"><tr><th className={th}>When</th><th className={th}>Product / SKU</th><th className={`${th} text-right`}>Change</th><th className={`${th} text-right`}>Balance</th><th className={th}>Reason</th><th className={th}>Reference</th><th className={th}>By</th></tr></thead>
            <tbody>
              {pg.rows.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className={`${td} whitespace-nowrap text-xs`}>{formatDate(m.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                  <td className={td}>{titles.get(m.productId) ?? m.productId}<span className="block font-mono text-xs text-ink-soft">{m.sku}</span></td>
                  <td className={`${td} text-right font-semibold tabular-nums ${m.delta > 0 ? "text-leaf" : "text-danger"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className={`${td} text-right tabular-nums`}>{m.balanceAfter}</td>
                  <td className={`${td} text-xs`}>{REASON[m.reason] ?? m.reason}</td>
                  <td className={`${td} text-xs`}>{m.ref.startsWith("KRP-") ? <Link href={`/admin/orders/${m.ref}`} className="text-leaf underline">{m.ref}</Link> : m.ref}</td>
                  <td className={`${td} text-xs`}>{m.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination base="/admin/inventory/movements" params={sp as Record<string, string | undefined>} page={pg.page} pages={pg.pages} total={pg.total} />
    </div>
  );
}
