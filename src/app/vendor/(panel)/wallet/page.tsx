import Link from "next/link";
import { readDb } from "@/lib/server/db";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { vendorLedger } from "@/lib/server/vendorLedger";
import { commissionOf, describeCommission, noCommission, planOf } from "@/lib/vendorPlans";
import { formatMoney, formatPrice } from "@/lib/format";
import { CancelWithdrawal, WithdrawForm } from "./WalletForms";

export const metadata = { title: "Seller wallet", robots: { index: false } };

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const STATE: Record<string, string> = { credited: "In wallet", pending: "After delivery", void: "Cancelled" };

export default async function VendorWallet() {
  const v = await requireApprovedVendor();
  const db = await readDb();
  const led = vendorLedger(db, v.id);
  const rule = commissionOf(db.settings);
  const t = led.totals;
  const w = led.openWithdrawal;
  const card = "rounded-2xl bg-white p-4 ring-1 ring-line";
  const account = `${v.bank.holder}, account ending ${v.bank.accountLast4} (${v.bank.ifsc})`;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold">Wallet</h1>
        {planOf(v.plan).salesReports
          ? <a href="/vendor/report" className="flex h-11 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white">Download sales report (CSV)</a>
          : <p className="text-xs text-ink-soft">Sales reports come with the Advance Business plan.</p>}
      </div>
      <p className="text-sm text-ink-soft">
        Customers pay online to Krip. When your order is delivered, the full amount — your price{noCommission(rule) ? "" : ` minus Krip’s commission (${describeCommission(rule)})`} plus your delivery charge — is added to your wallet. Withdraw it to your bank whenever you like.
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`${card} bg-leaf-soft ring-leaf/20`}><p className="text-xs text-ink-soft">Available to withdraw</p><p className="text-3xl font-bold text-leaf">{formatMoney(t.available)}</p>{t.requested > 0 && <p className="text-xs text-ink-soft">{formatMoney(t.requested)} on its way to your bank</p>}</div>
            <div className={card}><p className="text-xs text-ink-soft">Coming after delivery</p><p className="text-2xl font-bold">{formatMoney(t.pending)}</p><p className="text-xs text-ink-soft">Orders paid, not delivered yet</p></div>
            <div className={card}><p className="text-xs text-ink-soft">Sent to your bank so far</p><p className="text-2xl font-bold">{formatMoney(t.paidOut)}</p><p className="text-xs text-ink-soft">Total sales {formatPrice(t.gross)} + delivery {formatPrice(t.delivery)}</p></div>
          </div>

          <section className={card}>
            <h2 className="font-semibold">Wallet history</h2>
            {led.history.length === 0 ? <p className="mt-2 text-sm text-ink-soft">Nothing yet. Money appears here when your first order is delivered.</p> : (
              <ul className="mt-2 divide-y divide-line text-sm">
                {led.history.map((h, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 py-2">
                    <span>
                      {h.kind === "sale" ? <Link href={`/vendor/orders/${h.orderId}`} className="text-leaf underline">{h.text}</Link> : h.text}
                      <span className="block text-xs text-ink-soft">{day(h.at)}{h.kind === "payout" ? ` · ref ${h.reference}` : ""}{h.kind === "adjustment" ? " · adjustment by Krip" : ""}{h.kind === "withdrawal" && h.status === "requested" ? " · waiting for Krip" : ""}</span>
                    </span>
                    <b className={`shrink-0 ${h.kind === "withdrawal" ? "text-ink-soft" : h.amount < 0 ? "" : "text-leaf"}`}>{h.kind === "withdrawal" ? formatMoney(h.amount) : `${h.amount < 0 ? "−" : "+"}${formatMoney(Math.abs(h.amount))}`}</b>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card}>
            <h2 className="font-semibold">Sales</h2>
            {led.sales.length === 0 ? <p className="mt-2 text-sm text-ink-soft">No sales yet.</p> : (
              <div className="-mx-4 mt-2 overflow-x-auto px-4">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs text-ink-soft"><tr><th className="py-2">Order</th><th>Date</th><th className="text-right">Units</th><th className="text-right">Items</th><th className="text-right">Delivery</th>{!noCommission(rule) || t.commission > 0 ? <th className="text-right">Commission</th> : null}<th className="text-right">You get</th><th className="pl-3">Status</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {led.sales.map((s) => (
                      <tr key={s.orderId} className={s.settlement === "void" ? "text-ink-soft line-through" : ""}>
                        <td className="py-2 font-mono"><Link href={`/vendor/orders/${s.orderId}`} className="text-leaf underline">{s.orderId}</Link></td>
                        <td>{day(s.createdAt)}</td>
                        <td className="text-right">{s.units}</td>
                        <td className="text-right">{formatPrice(s.gross)}</td>
                        <td className="text-right">{formatPrice(s.delivery)}</td>
                        {!noCommission(rule) || t.commission > 0 ? <td className="text-right">−{formatMoney(s.commission)}</td> : null}
                        <td className="text-right font-medium">{formatMoney(s.payout)}</td>
                        <td className="pl-3">{STATE[s.settlement]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className={`${card} order-first h-fit space-y-3 lg:order-none`}>
          <h2 className="font-semibold">Withdraw to bank</h2>
          {w ? (
            <div className="space-y-2 rounded-xl bg-sun-soft p-3 text-sm">
              <p><b>{formatMoney(w.amount)}</b> requested on {day(w.requestedAt)}.</p>
              <p className="text-ink-soft">Krip will send it to {account} and add the bank reference here.</p>
              <CancelWithdrawal id={w.id} />
            </div>
          ) : <WithdrawForm available={t.available} account={account} />}
          <p className="text-xs text-ink-soft">Wrong bank details? Contact Krip support before withdrawing.</p>
        </aside>
      </div>
    </div>
  );
}
