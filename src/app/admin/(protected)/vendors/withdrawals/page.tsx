import Link from "next/link";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { vendorLedger } from "@/lib/server/vendorLedger";
import { formatMoney } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, Table, btn, field, td, th } from "@/app/admin/_components/ui";
import { VForm } from "../VForm";
import { withdrawalAction } from "@/app/admin/vendorActions";

export const metadata = { title: "Seller payouts" };
export const dynamic = "force-dynamic";

const day = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function SellerPayouts() {
  const ctx = await requirePerm("vendors.view");
  const db = await readDb();
  const open = db.vendorWithdrawals.filter((w) => w.status === "requested").sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  const done = db.vendorWithdrawals.filter((w) => w.status !== "requested").sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? "")).slice(0, 50);
  const name = (id: string) => db.vendors.find((v) => v.id === id)?.businessName ?? id;
  const wallets = db.vendors.filter((v) => v.status !== "pending_payment").map((v) => ({ v, t: vendorLedger(db, v.id).totals })).filter((x) => x.t.balance > 0 || x.t.pending > 0);
  return (
    <div className="space-y-4">
      <PageHeader title="Seller payouts" description="Sellers ask to withdraw money from their Krip wallet. Send it by bank transfer or UPI to the account shown, then enter the reference — the seller sees it. Oldest requests first." />
      <Card title={`Waiting to be paid (${open.length})`}>
        {open.length === 0 ? <Empty title="No withdrawal requests">Sellers request withdrawals from their Wallet page.</Empty> : (
          <ul className="divide-y divide-line">
            {open.map((w) => {
              const v = db.vendors.find((x) => x.id === w.vendorId);
              return (
                <li key={w.id} className="space-y-2 py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span><Link href={`/admin/vendors/${w.vendorId}`} className="font-semibold text-leaf underline">{name(w.vendorId)}</Link> · requested {day(w.requestedAt)}{w.note ? ` · “${w.note}”` : ""}</span>
                    <b className="text-lg">{formatMoney(w.amount)}</b>
                  </div>
                  {v && <p className="text-xs text-ink-soft">Pay to {v.bank.holder} · IFSC {v.bank.ifsc} · account ending {v.bank.accountLast4}{v.bank.upi ? ` · UPI ${v.bank.upi}` : ""} (full number on the seller’s page)</p>}
                  {ctx.can("vendors.manage") && (
                    <div className="flex flex-wrap items-start gap-3">
                      <VForm action={withdrawalAction} hidden={{ id: w.id, op: "paid" }} className="flex flex-wrap items-center gap-2">
                        <input name="reference" placeholder="Bank / UPI reference" aria-label="Bank / UPI reference" className={`${field} w-52`} />
                        <button className={btn.primary}>Mark as paid</button>
                      </VForm>
                      <VForm action={withdrawalAction} hidden={{ id: w.id, op: "reject" }} className="flex flex-wrap items-center gap-2">
                        <input name="note" placeholder="Reason (seller sees this)" aria-label="Reason" className={`${field} w-56`} />
                        <button className={btn.danger}>Reject</button>
                      </VForm>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Card title="Seller wallets">
        {wallets.length === 0 ? <p className="text-sm text-ink-soft">No money in seller wallets.</p> : (
          <Table minWidth={560}>
            <thead><tr><th className={th}>Seller</th><th className={th}>In wallet</th><th className={th}>Free to pay</th><th className={th}>After delivery</th><th className={th}>Paid so far</th></tr></thead>
            <tbody className="divide-y divide-line">
              {wallets.map(({ v, t }) => (
                <tr key={v.id}><td className={td}><Link href={`/admin/vendors/${v.id}`} className="text-leaf underline">{v.businessName}</Link></td><td className={td}>{formatMoney(t.balance)}</td><td className={td}>{formatMoney(t.available)}</td><td className={td}>{formatMoney(t.pending)}</td><td className={td}>{formatMoney(t.paidOut)}</td></tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {done.length > 0 && (
        <Card title="Recent">
          <ul className="divide-y divide-line text-sm">
            {done.map((w) => (
              <li key={w.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{name(w.vendorId)} · {w.decidedAt ? day(w.decidedAt) : ""} · {w.status === "paid" ? `ref ${w.reference}` : `rejected: ${w.note}`} · by {w.by}</span>
                <span className="flex items-center gap-2"><Badge tone={w.status === "paid" ? "green" : "red"}>{w.status}</Badge><b>{formatMoney(w.amount)}</b></span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
