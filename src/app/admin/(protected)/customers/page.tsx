import Link from "next/link";
import { Download } from "lucide-react";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { deriveCustomers, HIGH_VALUE } from "@/lib/server/customers";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge, Empty, PageHeader, Pagination, SortLink, btn, field, label, paginate, td, th, withParams } from "@/app/admin/_components/ui";

export const metadata = { title: "Customers" };

const SEGMENTS = ["New", "Returning", "Frequent buyer", "High value", "Inactive 90d+", "Didn’t complete payment", "Refunded"];

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; segment?: string; group?: string; sort?: string; page?: string }> }) {
  const ctx = await requirePerm("customers.view");
  const sp = await searchParams;
  const db = await readDb();
  const all = deriveCustomers(db);
  const q = sp.q?.trim().toLowerCase();
  const digits = q?.replace(/\D/g, "") ?? "";
  let list = all.filter((c) =>
    (!sp.segment || c.segments.includes(sp.segment)) && (!sp.group || c.groups.includes(sp.group)) &&
    (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (digits.length >= 4 && c.phone.includes(digits))),
  );
  const [col, dir] = (sp.sort ?? "last:desc").split(":");
  const sign = dir === "asc" ? 1 : -1;
  list = list.sort((a, b) => sign * (col === "spend" ? a.spend - b.spend : col === "orders" ? a.bookedOrders - b.bookedOrders : col === "name" ? a.name.localeCompare(b.name) : a.lastOrderAt.localeCompare(b.lastOrderAt)));
  const pg = paginate(list, sp.page, 30);
  const params = sp as Record<string, string | undefined>;
  const groups = [...new Set(all.flatMap((c) => c.groups))].sort();
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Shoppers check out as guests, so customers are grouped by phone number. Lifetime spend is booked order totals minus refunds."
        actions={ctx.can("customers.export") && <a href={withParams("/admin/customers/export", params, { page: null })} className={btn.secondary}><Download size={16} aria-hidden /> Export CSV</a>}
      />
      <nav aria-label="Segments" className="no-scrollbar -mx-1 mb-3 flex gap-1 overflow-x-auto px-1">
        {[undefined, ...SEGMENTS].map((s) => {
          const on = sp.segment === s;
          const n = s ? all.filter((c) => c.segments.includes(s)).length : all.length;
          return (
            <Link key={s ?? "all"} href={withParams("/admin/customers", params, { segment: s ?? null, page: null })} aria-current={on ? "page" : undefined}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ring-1 ${on ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:bg-paper"}`}>
              {s ?? "All"} <span className={`text-xs ${on ? "text-white/70" : "text-ink-soft"}`}>{n}</span>
            </Link>
          );
        })}
      </nav>
      <form className="mb-4 flex flex-wrap items-end gap-2">
        {sp.segment && <input type="hidden" name="segment" value={sp.segment} />}
        <div className="min-w-0 flex-1"><label className={label} htmlFor="cq">Name, email or phone</label><input id="cq" name="q" defaultValue={sp.q} className={field} /></div>
        {groups.length > 0 && <div><label className={label} htmlFor="cg">Group</label><select id="cg" name="group" defaultValue={sp.group ?? ""} className={field}><option value="">Any</option>{groups.map((g) => <option key={g}>{g}</option>)}</select></div>}
        <button className={btn.dark}>Search</button>
      </form>
      <p className="mb-3 text-xs text-ink-soft">Segments: New = 1 order · Returning = 2+ · Frequent = 4+ · High value = {formatPrice(HIGH_VALUE)}+ lifetime · Inactive = no order in 90 days.</p>
      {pg.rows.length === 0 ? <Empty title={all.length ? "No customers match" : "No customers yet"}>Customers appear after their first order.</Empty> : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-paper"><tr>
              <th className={th}><SortLink base="/admin/customers" params={params} col="name">Customer</SortLink></th>
              <th className={`${th} text-right`}><SortLink base="/admin/customers" params={params} col="orders">Orders</SortLink></th>
              <th className={`${th} text-right`}><SortLink base="/admin/customers" params={params} col="spend">Lifetime spend</SortLink></th>
              <th className={`${th} text-right`}>AOV</th>
              <th className={th}><SortLink base="/admin/customers" params={params} col="last">Last order</SortLink></th>
              <th className={th}>Segments & groups</th>
            </tr></thead>
            <tbody>
              {pg.rows.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-paper/60">
                  <td className={td}><Link href={`/admin/customers/${c.id}`} className="font-medium hover:text-leaf hover:underline">{c.name}</Link><span className="block text-xs text-ink-soft">{c.phone}{c.email ? ` · ${c.email}` : ""}</span></td>
                  <td className={`${td} text-right tabular-nums`}>{c.bookedOrders}</td>
                  <td className={`${td} text-right font-semibold tabular-nums`}>{formatPrice(c.spend)}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatPrice(c.aov)}</td>
                  <td className={`${td} whitespace-nowrap text-xs`}>{formatDate(c.lastOrderAt, { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className={td}><div className="flex flex-wrap gap-1">{c.segments.map((s) => <Badge key={s} tone={s === "High value" ? "green" : s.startsWith("Didn") ? "yellow" : "neutral"}>{s}</Badge>)}{c.groups.map((g) => <Badge key={g} tone="blue">{g}</Badge>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination base="/admin/customers" params={params} page={pg.page} pages={pg.pages} total={pg.total} />
    </div>
  );
}
