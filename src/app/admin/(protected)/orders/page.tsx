import Link from "next/link";
import { Download } from "lucide-react";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { formatDate, formatPrice } from "@/lib/format";
import { filterOrders, type OrderFilters } from "@/lib/orderQuery";
import { FULFILMENT_LABEL, PAYMENT_LABEL, STATUS_LABEL, fulfilmentStateOf, paymentStateOf } from "@/lib/orderflow";
import { Badge, Empty, PageHeader, Pagination, SortLink, Table, btn, field, label, paginate, td, th, withParams, type Tone } from "../../_components/ui";

export const metadata = { title: "Orders" };

const STATUS_TONE: Record<string, Tone> = { payment_pending: "yellow", payment_failed: "red", placed: "blue", confirmed: "blue", packed: "blue", shipped: "dark", delivered: "green", cancelled: "red" };
const PAY_TONE: Record<string, Tone> = { pending: "yellow", failed: "red", paid: "green", partially_refunded: "yellow", refunded: "neutral", cod_due: "yellow", cod_collected: "green", void: "neutral" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<OrderFilters & { page?: string }> }) {
  const ctx = await requirePerm("orders.view");
  const sp = await searchParams;
  const db = await readDb();
  const filtered = filterOrders(db.orders, sp);
  const { rows, page, pages, total } = paginate(filtered, sp.page);
  const params = sp as Record<string, string | undefined>;
  const tabs: [string, string | undefined][] = [["All", undefined], ["To confirm", "placed"], ["To pack", "confirmed"], ["To ship", "packed"], ["Shipped", "shipped"], ["Delivered", "delivered"], ["Awaiting payment", "payment_pending"], ["Cancelled", "cancelled"]];
  const filtersOn = ["q", "pay", "method", "from", "to", "min", "max", "flag"].some((k) => params[k]);

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Online orders move into fulfilment only after a verified payment event. Every action is checked against the order’s current state and recorded in the audit log."
        actions={ctx.can("orders.export") && <a href={withParams("/admin/orders/export", params, { page: null })} className={btn.secondary}><Download size={16} aria-hidden /> Export CSV</a>}
      />
      <nav aria-label="Order status" className="no-scrollbar -mx-1 mb-3 flex gap-1 overflow-x-auto px-1">
        {tabs.map(([l, s]) => {
          const n = s ? db.orders.filter((o) => o.status === s).length : db.orders.length;
          const on = (sp.status ?? undefined) === s;
          return (
            <Link key={l} href={withParams("/admin/orders", params, { status: s ?? null, page: null })} aria-current={on ? "page" : undefined}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ring-1 ${on ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:bg-paper"}`}>
              {l} <span className={`text-xs ${on ? "text-white/70" : "text-ink-soft"}`}>{n}</span>
            </Link>
          );
        })}
      </nav>
      <details className="mb-4 rounded-2xl bg-white ring-1 ring-line" open={filtersOn}>
        <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold">Search & filters {filtersOn && <Badge tone="green">on</Badge>}</summary>
        <form className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <div className="sm:col-span-2"><label className={label} htmlFor="q">Order ID, name, phone, email or AWB</label><input id="q" name="q" defaultValue={sp.q} className={field} /></div>
          <div><label className={label} htmlFor="pay">Payment status</label>
            <select id="pay" name="pay" defaultValue={sp.pay ?? ""} className={field}>
              <option value="">Any</option>
              {Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              <option value="refund_due">Refund due</option>
            </select>
          </div>
          <div><label className={label} htmlFor="method">Payment method</label>
            <select id="method" name="method" defaultValue={sp.method ?? ""} className={field}><option value="">Any</option><option value="online">Online</option><option value="cod">Cash on Delivery</option></select>
          </div>
          <div><label className={label} htmlFor="from">From (IST)</label><input id="from" name="from" type="date" defaultValue={sp.from} className={field} /></div>
          <div><label className={label} htmlFor="to">To (IST)</label><input id="to" name="to" type="date" defaultValue={sp.to} className={field} /></div>
          <div><label className={label} htmlFor="min">Min total ₹</label><input id="min" name="min" inputMode="numeric" defaultValue={sp.min} className={field} /></div>
          <div><label className={label} htmlFor="max">Max total ₹</label><input id="max" name="max" inputMode="numeric" defaultValue={sp.max} className={field} /></div>
          <div><label className={label} htmlFor="flag">Flag</label>
            <select id="flag" name="flag" defaultValue={sp.flag ?? ""} className={field}><option value="">Any</option><option value="hold">On hold</option><option value="review">Needs review</option></select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button className={btn.dark}>Apply</button>
            <Link href={sp.status ? `/admin/orders?status=${sp.status}` : "/admin/orders"} className={btn.secondary}>Clear</Link>
          </div>
        </form>
      </details>

      {rows.length === 0 ? (
        <Empty title={db.orders.length ? "No orders match these filters" : "No orders yet"}>{db.orders.length ? "Try clearing a filter." : "Place one from the storefront to see it here."}</Empty>
      ) : (
        <>
          <Table minWidth={960}>
            <thead className="bg-paper">
              <tr>
                <th className={th}>Order</th>
                <th className={th}><SortLink base="/admin/orders" params={params} col="date">Date</SortLink></th>
                <th className={th}><SortLink base="/admin/orders" params={params} col="customer">Customer</SortLink></th>
                <th className={`${th} text-right`}><SortLink base="/admin/orders" params={params} col="total">Total</SortLink></th>
                <th className={th}>Payment</th>
                <th className={th}>Fulfilment</th>
                <th className={th}>Status</th>
                <th className={th}>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const ps = paymentStateOf(o);
                const awb = o.shipments?.at(-1);
                return (
                  <tr key={o.id} className="border-t border-line hover:bg-paper/60">
                    <td className={td}>
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-leaf hover:underline">{o.id}</Link>
                      <div className="mt-0.5 flex gap-1">{o.demo && <Badge tone="yellow">Demo</Badge>}{o.onHold && <Badge tone="red">On hold</Badge>}</div>
                    </td>
                    <td className={`${td} whitespace-nowrap text-xs`}>{formatDate(o.createdAt, { day: "numeric", month: "short", year: "2-digit", hour: "numeric", minute: "2-digit" })}</td>
                    <td className={td}><span className="block">{o.address.name}</span><span className="text-xs text-ink-soft">{o.address.city}, {o.address.pincode}</span></td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>{formatPrice(o.total)}<span className="block text-xs font-normal text-ink-soft">{o.items.reduce((s, i) => s + i.qty, 0)} items</span></td>
                    <td className={td}><Badge tone={PAY_TONE[ps]}>{PAYMENT_LABEL[ps]}</Badge><span className="block text-xs text-ink-soft">{o.paymentMethod === "cod" ? "COD" : o.paymentProvider}</span></td>
                    <td className={`${td} text-xs`}>{FULFILMENT_LABEL[fulfilmentStateOf(o)]}</td>
                    <td className={td}><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
                    <td className={`${td} text-xs`}>{awb ? <>{awb.carrier}<span className="block font-mono">{awb.awb}</span></> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination base="/admin/orders" params={params} page={page} pages={pages} total={total} />
        </>
      )}
    </div>
  );
}
