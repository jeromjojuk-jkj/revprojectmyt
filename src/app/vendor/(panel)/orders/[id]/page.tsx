import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/server/db";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { allowedVendorOps, dispatchState, orderOpenForVendor, PART_LABEL, TRACKING_UPDATES } from "@/lib/vendorFulfilment";
import { shippingOf, vendorShares } from "@/lib/vendorPlans";
import { formatPrice } from "@/lib/format";
import { VendorOrderActions } from "./VendorOrderActions";

export const metadata = { title: "Seller order", robots: { index: false } };

const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default async function VendorOrder({ params }: { params: Promise<{ id: string }> }) {
  const v = await requireApprovedVendor();
  const { id } = await params;
  const db = await readDb();
  const o = db.orders.find((x) => x.id === id);
  const part = o?.vendorParts?.find((p) => p.vendorId === v.id);
  if (!o || !part || o.status === "payment_pending" || o.status === "payment_failed") notFound();
  const items = o.items.filter((i) => i.vendorId === v.id);
  const share = vendorShares(o, o.commissionPerUnit ?? db.settings.vendorCommissionPerUnit ?? 10).get(v.id)!;
  const shipment = o.shipments?.find((s) => s.id === part.shipmentId);
  const ops = allowedVendorOps(o, part);
  const closed = orderOpenForVendor(o);
  const ds = dispatchState(part);
  const a = o.address;
  const card = "rounded-2xl bg-white p-4 ring-1 ring-line";
  const mixed = o.items.some((i) => i.vendorId !== v.id);
  return (
    <div className="space-y-4">
      <Link href="/vendor/orders" className="text-sm text-leaf underline">← All orders</Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-mono text-xl font-bold">{o.id}</h1>
        <span className="rounded-full bg-sun-soft px-3 py-1 text-sm font-medium">{o.status === "cancelled" ? "Cancelled by Krip" : PART_LABEL[part.status]}</span>
      </div>
      <p className="text-sm text-ink-soft">Ordered {fmt(o.createdAt)} · Paid online{mixed ? " · This order also has items from other sellers or Krip — ship only yours." : ""}</p>
      {ds && o.status !== "cancelled" && (
        <p className={`rounded-xl p-3 text-sm font-medium ${ds === "late" ? "bg-danger-soft text-danger" : "bg-sun-soft"}`}>
          {ds === "late" ? "Overdue: this should have been handed to the courier by " : "Hand over to the courier by "}{fmt(part.dispatchBy)}.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className={card}>
            <h2 className="font-semibold">Your items</h2>
            <ul className="mt-2 divide-y divide-line text-sm">
              {items.map((i) => (
                <li key={i.sku} className="flex justify-between gap-3 py-2">
                  <span>{i.title}<span className="block text-xs text-ink-soft">SKU {i.sku} · {i.color}{i.size ? ` · ${i.size}` : ""}</span></span>
                  <span className="shrink-0 text-right">{i.qty} × {formatPrice(i.unitPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-line pt-2 text-sm">
              <div className="flex justify-between"><dt>Items</dt><dd>{formatPrice(share.items)}</dd></div>
              <div className="flex justify-between"><dt>Delivery charge paid by customer</dt><dd>{share.delivery ? formatPrice(share.delivery) : "Free"}</dd></div>
              <div className="flex justify-between text-ink-soft"><dt>Krip commission ({share.units} × ₹{o.commissionPerUnit ?? db.settings.vendorCommissionPerUnit ?? 10})</dt><dd>−{formatPrice(share.commission)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>You earn</dt><dd>{formatPrice(share.payout)}</dd></div>
            </dl>
          </section>

          <section className={card}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Ship to</h2>
              <a href={`/vendor/slip/${o.id}`} target="_blank" className="rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-line">Print packing slip</a>
            </div>
            {o.status === "cancelled" ? <p className="mt-2 text-sm text-ink-soft">Hidden — the order was cancelled.</p> : (
              <address className="mt-2 text-sm not-italic leading-relaxed">
                <b>{a.name}</b><br />{a.line1}{a.line2 ? <>, {a.line2}</> : null}{a.landmark ? <><br />Near {a.landmark}</> : null}<br />
                {a.city}, {a.state} – {a.pincode}<br />Phone: <a className="text-leaf underline" href={`tel:+91${a.phone}`}>{a.phone}</a>
              </address>
            )}
            <p className="mt-2 text-xs text-ink-soft">Use the customer’s details only to deliver this order.</p>
          </section>

          {shipment && (
            <section className={card}>
              <h2 className="font-semibold">Shipment</h2>
              <p className="mt-1 text-sm">{shipment.carrier} · AWB <span className="font-mono">{shipment.awb}</span>{shipment.trackingUrl && <> · <a href={shipment.trackingUrl} className="text-leaf underline" target="_blank" rel="noreferrer">Track</a></>}</p>
            </section>
          )}

          <section className={card}>
            <h2 className="font-semibold">History</h2>
            <ol className="mt-2 space-y-1.5 text-sm">
              <li className="text-ink-soft">{fmt(o.createdAt)} — Order placed</li>
              {part.history.map((h, i) => (
                <li key={i}><span className="text-ink-soft">{fmt(h.at)} — </span>{h.status === "tracking" ? "Tracking" : h.status === "issue" ? "Issue" : PART_LABEL[h.status]}{h.note ? `: ${h.note}` : ""}</li>
              ))}
              {o.status === "cancelled" && <li className="text-danger">Order cancelled by Krip.</li>}
            </ol>
          </section>
        </div>

        <aside className={`${card} h-fit space-y-3`}>
          <h2 className="font-semibold">Update this order</h2>
          {closed ? <p className="text-sm text-ink-soft">{closed}</p> : ops.length === 0 ? <p className="text-sm text-ink-soft">Nothing to do — {part.status === "delivered" ? "this order is delivered." : "Krip is looking into the issue you reported."}</p> : (
            <VendorOrderActions orderId={o.id} ops={ops} defaultCourier={shippingOf(v).courier} updates={[...TRACKING_UPDATES]} />
          )}
        </aside>
      </div>
    </div>
  );
}
