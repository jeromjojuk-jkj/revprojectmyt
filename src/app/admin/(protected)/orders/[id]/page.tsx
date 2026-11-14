import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { formatDate, formatPrice } from "@/lib/format";
import { allowedOps, FULFILMENT_LABEL, PAYMENT_LABEL, STATUS_LABEL, fulfilmentStateOf, paidAmount, paymentStateOf, refundedAmount } from "@/lib/orderflow";
import { orderEstimate } from "@/lib/server/estimates";
import { customerKey } from "@/lib/server/orders";
import { Badge, Card, PageHeader, btn } from "@/app/admin/_components/ui";
import { OrderActions } from "./OrderActions";
import { PART_LABEL, TRACKING_UPDATES, allowedVendorOps, dispatchState } from "@/lib/vendorFulfilment";
import { shippingOf } from "@/lib/vendorPlans";
import { VendorOrderActions } from "@/app/vendor/(panel)/orders/[id]/VendorOrderActions";
import { adminVendorPartAction } from "@/app/admin/opsActions";
import { VForm } from "@/app/admin/(protected)/vendors/VForm";
import { orderCommission, vendorShares } from "@/lib/vendorPlans";
import { formatMoney } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Order ${(await params).id}` };
}

const dt = (iso: string) => formatDate(iso, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePerm("orders.view");
  const { id } = await params;
  const db = await readDb();
  const o = db.orders.find((x) => x.id === id);
  if (!o) notFound();
  const ps = paymentStateOf(o);
  const paid = paidAmount(o);
  const refunded = refundedAmount(o);
  const ops = allowedOps(o).filter((op) => {
    if (op === "refund") return ctx.can("orders.refund");
    if (op === "confirm" || op === "cancel" || op === "release") return ctx.can("orders.approve");
    if (op === "note") return true;
    return ctx.can("orders.edit");
  });
  const est = ctx.can("finance.view") ? orderEstimate(o, db.products, db.settings) : null;
  const a = o.address;
  const timeline = [
    ...o.statusHistory.map((h) => ({ at: h.at, title: STATUS_LABEL[h.status], text: h.note ?? "", kind: "status" })),
    ...(o.notes ?? []).map((n) => ({ at: n.at, title: `Note · ${n.by}`, text: n.text, kind: "note" })),
    ...o.paymentEvents.map((e) => ({ at: e.at, title: e.type === "payment.succeeded" ? "Payment succeeded" : "Payment failed", text: `${e.provider} · ${formatPrice(e.amount)} · ref ${e.reference}`, kind: "payment" })),
    ...(o.refunds ?? []).map((r) => ({ at: r.at, title: `Refund ${formatPrice(r.amount)} · ${r.by}`, text: `${r.reason} (${r.mode === "demo" ? "demo" : `ref ${r.reference}`})`, kind: "refund" })),
  ].sort((x, y) => y.at.localeCompare(x.at));

  return (
    <div className="space-y-4">
      <PageHeader
        title={o.id}
        description={<>Placed {dt(o.createdAt)} · {o.paymentMethod === "cod" ? "Cash on Delivery" : `Online (${o.paymentProvider})`}</>}
        actions={<Link href={`/admin/orders/${o.id}/print`} className={btn.secondary} target="_blank"><Printer size={16} aria-hidden /> Packing slip & receipt</Link>}
      />
      <div className="flex flex-wrap gap-2">
        <Badge tone="dark">{STATUS_LABEL[o.status]}</Badge>
        <Badge tone={ps === "paid" || ps === "cod_collected" ? "green" : ps === "failed" ? "red" : "yellow"}>{PAYMENT_LABEL[ps]}</Badge>
        <Badge>Fulfilment: {FULFILMENT_LABEL[fulfilmentStateOf(o)]}</Badge>
        {o.onHold && <Badge tone="red">On hold</Badge>}
        {o.demo && <Badge tone="yellow">Demo order — no real money</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Actions">
            {(o.vendorParts?.length ?? 0) > 0 && <p className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">{o.items.some((i) => !i.vendorId) ? "Pack / ship here is for Krip’s own items only. Sellers update theirs from their panel — or use “Update for this seller” below." : "Only sellers’ items: the order’s status follows the sellers’ updates. To step in, use “Update for this seller” below."}</p>}
            <OrderActions id={o.id} ops={ops} canRefund={ctx.can("orders.refund")} remaining={paid - refunded} demo={o.demo} codManual={o.paymentMethod === "cod"} />
          </Card>
          {(o.vendorParts?.length ?? 0) > 0 && (
            <Card title="Sellers on this order">
              <ul className="divide-y divide-line text-sm">
                {o.vendorParts!.map((p) => {
                  const v = db.vendors.find((x) => x.id === p.vendorId);
                  const sh = vendorShares(o, orderCommission(o, db.settings)).get(p.vendorId);
                  const late = o.status !== "cancelled" && dispatchState(p) === "late";
                  return (
                    <li key={p.vendorId} className="py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/admin/vendors/${p.vendorId}`} className="font-medium text-leaf underline">{v?.businessName ?? p.vendorId}</Link>
                        <span className="flex gap-1"><Badge tone={p.status === "cancel_requested" ? "red" : p.status === "delivered" ? "green" : "yellow"}>{PART_LABEL[p.status]}</Badge>{late && <Badge tone="red">Dispatch late</Badge>}</span>
                      </div>
                      <p className="text-xs text-ink-soft">{o.items.filter((i) => i.vendorId === p.vendorId).map((i) => `${i.qty} × ${i.title}`).join(", ")} · delivery {formatPrice(p.delivery)} · dispatch by {dt(p.dispatchBy)}{sh ? ` · seller earns ${formatMoney(sh.payout)}, Krip commission ${formatMoney(sh.commission)}` : ""}</p>
                      {p.history.at(-1)?.note && <p className="text-xs">Latest: {p.history.at(-1)!.note}</p>}
                      {p.status === "cancel_requested" && o.status !== "cancelled" && ctx.can("orders.edit") && (
                        <div className="mt-2 rounded-xl bg-danger-soft p-3 text-xs">
                          <p className="text-danger">The seller says they can’t ship this. Cancel the order (and refund the customer), or reopen it if it was a mistake.</p>
                          <VForm action={adminVendorPartAction} hidden={{ orderId: o.id, vendorId: p.vendorId, op: "reopen" }}><button className="mt-2 h-9 rounded-lg bg-white px-3 font-semibold ring-1 ring-line">Reopen for the seller</button></VForm>
                        </div>
                      )}
                      {(() => {
                        const partOps = allowedVendorOps(o, p).filter((x) => x !== "issue");
                        if (!ctx.can("orders.edit") || !partOps.length) return null;
                        return (
                          <details className="mt-2 rounded-xl bg-paper p-3">
                            <summary className="cursor-pointer text-xs font-semibold text-leaf">Update for this seller (packed, shipped, out for delivery…)</summary>
                            <div className="mt-3 max-w-md">
                              <VendorOrderActions orderId={o.id} vendorId={p.vendorId} ops={partOps} defaultCourier={v ? shippingOf(v).courier : ""} updates={[...TRACKING_UPDATES]} serverAction={adminVendorPartAction} />
                            </div>
                          </details>
                        );
                      })()}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
          <Card title={`Items (${o.items.reduce((s, i) => s + i.qty, 0)})`}>
            <ul className="divide-y divide-line">
              {o.items.map((it) => (
                <li key={it.sku} className="flex gap-3 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image} alt="" className="h-16 w-14 shrink-0 rounded-lg bg-paper object-cover" />
                  <div className="min-w-0 flex-1 text-sm">
                    {db.products.some((x) => x.id === it.productId) ? <Link href={`/admin/products/${it.productId}`} className="font-medium hover:text-leaf">{it.title}</Link> : <span className="font-medium">{it.title} <span className="text-xs font-normal text-ink-soft">(product deleted)</span></span>}
                    <p className="text-xs text-ink-soft">{it.color}{it.size ? ` · ${it.size}` : ""} · <span className="font-mono">{it.sku}</span></p>
                  </div>
                  <div className="text-right text-sm tabular-nums"><p>{it.qty} × {formatPrice(it.unitPrice)}</p><p className="font-semibold">{formatPrice(it.qty * it.unitPrice)}</p></div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm tabular-nums">
              <div className="flex justify-between"><dt>Subtotal (incl. GST)</dt><dd>{formatPrice(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between text-leaf"><dt>{o.festivalOffer ?? <>Discount {o.couponCode && `(${o.couponCode})`}</>}</dt><dd>−{formatPrice(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Delivery</dt><dd>{formatPrice(o.delivery)}</dd></div>
              {o.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{formatPrice(o.codFee)}</dd></div>}
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatPrice(o.total)}</dd></div>
              <div className="flex justify-between text-ink-soft"><dt>Received</dt><dd>{formatPrice(paid)}</dd></div>
              {refunded > 0 && <div className="flex justify-between text-danger"><dt>Refunded</dt><dd>−{formatPrice(refunded)}</dd></div>}
            </dl>
          </Card>
          {(o.shipments ?? []).length > 0 && (
            <Card title="Shipments">
              {o.shipments!.map((s) => (
                <div key={s.id} className="text-sm">
                  <p><b>{s.carrier}</b> · AWB <span className="font-mono">{s.awb}</span> {s.trackingUrl && <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-leaf underline">Track</a>}</p>
                  <ol className="mt-2 space-y-1 border-l-2 border-line pl-3 text-xs">
                    {[...s.events].reverse().map((e, i) => <li key={i}><b>{e.status}</b> · {dt(e.at)}{e.note ? ` — ${e.note}` : ""}</li>)}
                  </ol>
                </div>
              ))}
            </Card>
          )}
          <Card title="Timeline">
            <ol className="relative space-y-4 border-l-2 border-line pl-5">
              {timeline.map((t, i) => (
                <li key={i} className="text-sm">
                  <span className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full ring-2 ring-white ${t.kind === "note" ? "bg-sky-500" : t.kind === "refund" ? "bg-danger" : t.kind === "payment" ? "bg-sun" : "bg-leaf"}`} aria-hidden />
                  <p className="font-medium">{t.title} <span className="text-xs font-normal text-ink-soft">· {dt(t.at)}</span></p>
                  {t.text && <p className="text-ink-soft">{t.text}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Customer">
            <p className="font-medium">{a.name}</p>
            <p className="text-sm"><a href={`tel:${a.phone}`} className="text-leaf">{a.phone}</a></p>
            {a.email && <p className="truncate text-sm"><a href={`mailto:${a.email}`} className="text-leaf">{a.email}</a></p>}
            {ctx.can("customers.view") && <Link href={`/admin/customers/${customerKey(a.phone)}`} className="mt-2 inline-block text-sm font-semibold text-leaf">Customer profile →</Link>}
          </Card>
          <Card title="Shipping address">
            <address className="text-sm not-italic leading-relaxed">{a.name}<br />{a.line1}{a.line2 && <><br />{a.line2}</>}{a.landmark && <><br />Near {a.landmark}</>}<br />{a.city}, {a.state} {a.pincode}</address>
          </Card>
          {est && (
            <Card title="Estimated contribution">
              <p className="text-xl font-bold">{formatPrice(est.contribution)} <span className="text-xs font-normal text-ink-soft">estimate</span></p>
              <p className="mt-1 text-xs text-ink-soft">Revenue {formatPrice(est.revenue)} − cost {formatPrice(est.cost)} − shipping {formatPrice(est.shipping)} − fees {formatPrice(est.fees)} − returns allowance {formatPrice(est.returns)}{est.incomplete ? " · some products no longer exist, so cost is incomplete" : ""}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
