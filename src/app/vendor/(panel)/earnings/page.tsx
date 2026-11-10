import Link from "next/link";
import { readDb } from "@/lib/server/db";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { vendorLedger } from "@/lib/server/vendorLedger";
import { planOf } from "@/lib/vendorPlans";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Seller earnings", robots: { index: false } };

const SETTLE: Record<string, string> = { split: "Paid by Cashfree", owed: "Krip pays you", pending: "After delivery", void: "Cancelled" };

export default async function VendorEarnings() {
  const v = await requireApprovedVendor();
  const db = await readDb();
  const led = vendorLedger(db, v.id);
  const rate = db.settings.vendorCommissionPerUnit ?? 10;
  const t = led.totals;
  const card = "rounded-2xl bg-white p-4 ring-1 ring-line";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold">Earnings</h1>
        {planOf(v.plan).salesReports
          ? <a href="/vendor/report" className="flex h-11 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white">Download sales report (CSV)</a>
          : <p className="text-xs text-ink-soft">Sales reports come with the Advance Business plan.</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}><p className="text-xs text-ink-soft">Sales (items)</p><p className="text-2xl font-bold">{formatPrice(t.gross)}</p><p className="text-xs text-ink-soft">{t.units} units · + {formatPrice(t.delivery)} delivery</p></div>
        <div className={card}><p className="text-xs text-ink-soft">Krip commission (₹{rate}/unit)</p><p className="text-2xl font-bold">−{formatPrice(t.commission)}</p></div>
        <div className={card}><p className="text-xs text-ink-soft">Your earnings</p><p className="text-2xl font-bold text-leaf">{formatPrice(t.earnings)}</p><p className="text-xs text-ink-soft">{formatPrice(t.viaCashfree)} paid via Cashfree</p></div>
        <div className={card}><p className="text-xs text-ink-soft">Krip owes you now</p><p className="text-2xl font-bold">{formatPrice(t.dueNow)}</p><p className="text-xs text-ink-soft">{formatPrice(t.pending)} more after delivery · {formatPrice(t.paidManually)} paid so far</p></div>
      </div>

      <section className={card}>
        <h2 className="font-semibold">Sales</h2>
        {led.sales.length === 0 ? <p className="mt-2 text-sm text-ink-soft">No sales yet.</p> : (
          <div className="-mx-4 mt-2 overflow-x-auto px-4">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-ink-soft"><tr><th className="py-2">Order</th><th>Date</th><th className="text-right">Units</th><th className="text-right">Items</th><th className="text-right">Delivery</th><th className="text-right">Commission</th><th className="text-right">You earn</th><th className="pl-3">Payout</th></tr></thead>
              <tbody className="divide-y divide-line">
                {led.sales.map((s) => (
                  <tr key={s.orderId} className={s.settlement === "void" ? "text-ink-soft line-through" : ""}>
                    <td className="py-2 font-mono"><Link href={`/vendor/orders/${s.orderId}`} className="text-leaf underline">{s.orderId}</Link></td>
                    <td>{new Date(s.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                    <td className="text-right">{s.units}</td>
                    <td className="text-right">{formatPrice(s.gross)}</td>
                    <td className="text-right">{formatPrice(s.delivery)}</td>
                    <td className="text-right">−{formatPrice(s.commission)}</td>
                    <td className="text-right font-medium">{formatPrice(s.payout)}</td>
                    <td className="pl-3">{SETTLE[s.settlement]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="font-semibold">Payouts from Krip</h2>
        {led.payouts.length === 0 ? <p className="mt-2 text-sm text-ink-soft">None yet.</p> : (
          <ul className="mt-2 divide-y divide-line text-sm">
            {led.payouts.map((p) => <li key={p.id} className="flex justify-between gap-3 py-2"><span>{new Date(p.at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })} · ref {p.reference}{p.note ? ` · ${p.note}` : ""}</span><b>{formatPrice(p.amount)}</b></li>)}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink-soft">Paid to {v.bank.holder}, account ending {v.bank.accountLast4} ({v.bank.ifsc}).</p>
      </section>
    </div>
  );
}
