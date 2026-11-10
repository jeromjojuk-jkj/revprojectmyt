import Link from "next/link";
import { readDb } from "@/lib/server/db";
import { refreshVendorFee, requireVendor } from "@/lib/server/vendors";
import { vendorLedger } from "@/lib/server/vendorLedger";
import { paymentConfig } from "@/lib/server/payments";
import { planOf } from "@/lib/vendorPlans";
import { formatPrice } from "@/lib/format";
import { FeeCheckout } from "./FeeCheckout";
import { dispatchState } from "@/lib/vendorFulfilment";
import { demoPayFeeAction } from "../actions";

export const metadata = { title: "Seller dashboard", robots: { index: false } };

export default async function VendorDashboard() {
  let v = await requireVendor();
  if (!v.fee.paid) {
    await refreshVendorFee(v);
    v = (await readDb()).vendors.find((x) => x.id === v.id) ?? v;
  }
  const db = await readDb();
  const plan = planOf(v.plan);
  const pay = paymentConfig();
  const mine = db.products.filter((p) => p.vendorId === v.id);
  const live = mine.filter((p) => p.status === "active").length;
  const pending = mine.filter((p) => p.private.review?.status === "pending").length;
  const led = vendorLedger(db, v.id);
  const open = db.orders.filter((o) => !["payment_pending", "payment_failed", "cancelled"].includes(o.status) && !o.onHold)
    .map((o) => o.vendorParts?.find((p) => p.vendorId === v.id)).filter((p) => p && ["new", "accepted", "packed"].includes(p.status));
  const late = open.filter((p) => dispatchState(p!) === "late").length;
  const card = "rounded-2xl bg-white p-4 ring-1 ring-line";
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hi {v.ownerName.split(" ")[0]} 👋</h1>

      {v.status === "pending_payment" && (
        <section className={`${card} space-y-3`}>
          <h2 className="font-semibold">Step 2 of 3 — pay your one-time {plan.name} plan fee</h2>
          <p className="text-sm text-ink-soft">{formatPrice(v.planFee)} one-time. After payment, Krip checks your details and approves your seller account.</p>
          {pay.provider === "cashfree" && pay.onlineEnabled ? <FeeCheckout fee={v.planFee} /> : pay.provider === "demo" ? (
            <form action={demoPayFeeAction}><button className="h-12 rounded-xl bg-leaf px-6 font-semibold text-white">Simulate payment (demo — no money moves)</button></form>
          ) : <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">Online payment isn’t available right now. Please try again later.</p>}
        </section>
      )}
      {v.status === "pending_review" && (
        <section className={`${card} bg-sun-soft`}>
          <h2 className="font-semibold">Step 3 of 3 — Krip is reviewing your account</h2>
          <p className="text-sm">Fee received{v.fee.demo ? " (test payment)" : ""}: {formatPrice(v.planFee)}, ref {v.fee.reference}. We’ll check your business, tax and bank details. You can add products once you’re approved.</p>
        </section>
      )}
      {v.status === "rejected" && <section className={`${card} bg-danger-soft text-danger`}><h2 className="font-semibold">Your seller account wasn’t approved</h2><p className="text-sm">{v.statusNote || "Please contact Krip support."}</p></section>}
      {v.status === "suspended" && <section className={`${card} bg-danger-soft text-danger`}><h2 className="font-semibold">Your seller account is suspended</h2><p className="text-sm">{v.statusNote || "Your products are hidden. Please contact Krip support."}</p></section>}

      {v.status === "approved" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={card}><p className="text-xs text-ink-soft">Live products</p><p className="text-2xl font-bold">{live}<span className="text-sm font-normal text-ink-soft"> / {plan.productLimit ?? "∞"}</span></p></div>
            <div className={card}><p className="text-xs text-ink-soft">Waiting for Krip review</p><p className="text-2xl font-bold">{pending}</p></div>
            <div className={card}><p className="text-xs text-ink-soft">Units sold</p><p className="text-2xl font-bold">{led.totals.units}</p></div>
            <div className={card}><p className="text-xs text-ink-soft">Your earnings (after ₹{db.settings.vendorCommissionPerUnit ?? 10}/unit)</p><p className="text-2xl font-bold">{formatPrice(led.totals.earnings)}</p></div>
          </div>
          {open.length > 0 && (
            <Link href="/vendor/orders" className={`block rounded-2xl p-4 font-medium ring-1 ${late ? "bg-danger-soft text-danger ring-danger/30" : "bg-sun-soft ring-sun"}`}>
              📦 {open.length} order{open.length > 1 ? "s" : ""} to ship{late ? ` — ${late} past the dispatch deadline` : ""}. Open orders →
            </Link>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href="/vendor/products/new" className="flex h-11 items-center rounded-xl bg-leaf px-5 font-semibold text-white">Add a product</Link>
            <Link href="/vendor/orders" className="flex h-11 items-center rounded-xl bg-white px-5 font-semibold ring-1 ring-line">Orders</Link>
            <Link href="/vendor/shipping" className="flex h-11 items-center rounded-xl bg-white px-5 font-semibold ring-1 ring-line">Shipping settings</Link>
          </div>
        </>
      )}

      <section className={card}>
        <h2 className="font-semibold">Your plan: {plan.name}</h2>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{plan.perks.map((x) => <li key={x}>✓ {x}</li>)}</ul>
        {plan.verifiedBadge && <p className="mt-2 text-sm">{v.verified ? "✅ Verified seller badge is on." : "Verified seller badge: shown after Krip finishes checking your documents."}</p>}
        {plan.prioritySupport && db.store.supportEmail && <p className="mt-1 text-sm">Priority support: <a className="text-leaf underline" href={`mailto:${db.store.supportEmail}?subject=Priority%20seller%20support%20${v.id}`}>{db.store.supportEmail}</a></p>}
      </section>
    </div>
  );
}
