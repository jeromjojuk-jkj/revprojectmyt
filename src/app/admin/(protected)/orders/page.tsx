import { readDb } from "@/lib/server/db";
import { orderEstimate } from "@/lib/server/estimates";
import { formatDate, formatPrice } from "@/lib/format";
import { orderStatusAction } from "../../actions";
import type { OrderStatus } from "@/lib/types";

const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  payment_pending: ["cancelled"],
};

export default async function AdminOrders() {
  const db = await readDb();
  const orders = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Orders ({orders.length})</h1>
      <p className="text-xs text-ink-soft">Online orders move to fulfilment only after a verified payment event. Contribution figures are estimates.</p>
      {orders.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-sm ring-1 ring-line">No orders yet. Place one from the storefront to see it here.</p>}
      <ul className="space-y-3">
        {orders.map((o) => {
          const est = orderEstimate(o, db.products, db.settings);
          const next = NEXT[o.status] ?? [];
          return (
            <li key={o.id} className="rounded-2xl bg-white p-4 text-sm ring-1 ring-line">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{o.id} {o.demo && <span className="ml-1 rounded bg-sun px-1.5 py-0.5 text-[11px]">DEMO</span>}</p>
                <p className="text-xs text-ink-soft">{formatDate(o.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
              </div>
              <p className="mt-1"><b>Status:</b> {o.status} · <b>Payment:</b> {o.paymentMethod === "cod" ? "COD" : o.paymentProvider} · <b>Total:</b> {formatPrice(o.total)}</p>
              <p className="text-xs text-ink-soft">{o.address.name}, {o.address.city} {o.address.pincode} · {o.address.phone}</p>
              <ul className="mt-2 text-xs">{o.items.map((i) => <li key={i.sku}>{i.qty} × {i.title} ({i.sku}) @ {formatPrice(i.unitPrice)}</li>)}</ul>
              <p className="mt-2 text-xs">
                <b>Est. contribution:</b> {formatPrice(est.contribution)} = revenue {formatPrice(est.revenue)} − cost {formatPrice(est.cost)} − shipping {formatPrice(est.shipping)} − fees {formatPrice(est.fees)} − returns {formatPrice(est.returns)} <span className="text-ink-soft">(estimate)</span>
              </p>
              <details className="mt-2 text-xs"><summary className="cursor-pointer text-ink-soft">History & payment events</summary>
                <ul className="mt-1 space-y-0.5">{o.statusHistory.map((h, i) => <li key={i}>{formatDate(h.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} — {h.status}{h.note ? `: ${h.note}` : ""}</li>)}</ul>
                <ul className="mt-1 space-y-0.5">{o.paymentEvents.map((e) => <li key={e.id}>{e.type} · {e.provider} · {formatPrice(e.amount)} · {e.reference}</li>)}</ul>
              </details>
              {next.length > 0 && (
                <form action={orderStatusAction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={o.id} />
                  <input name="note" placeholder="Note (e.g. AWB number)" className="h-10 min-w-0 flex-1 rounded-lg border border-line px-2 text-xs" />
                  {next.map((s) => (
                    <button key={s} name="status" value={s} className={`h-10 rounded-lg px-3 text-xs font-semibold ${s === "cancelled" ? "text-danger ring-1 ring-danger" : "bg-leaf text-white"}`}>
                      Mark {s}
                    </button>
                  ))}
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
