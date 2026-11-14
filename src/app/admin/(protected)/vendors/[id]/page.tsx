import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { vendorLedger } from "@/lib/server/vendorLedger";
import { planOf, shippingOf } from "@/lib/vendorPlans";
import { PART_LABEL, dispatchState } from "@/lib/vendorFulfilment";
import { formatMoney, formatPrice } from "@/lib/format";
import { Badge, Card, Notice, PageHeader, Table, btn, field, label, td, th } from "@/app/admin/_components/ui";
import { VForm } from "../VForm";
import { STATUS } from "../status";
import { vendorPasswordResetAction, revealBankAction, vendorPayoutAction, vendorStatusAction, vendorVerifyAction, walletAdjustmentAction, withdrawalAction } from "@/app/admin/vendorActions";

export const metadata = { title: "Seller" };
export const dynamic = "force-dynamic";

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }) : "—");

export default async function Seller({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePerm("vendors.view");
  const { id } = await params;
  const db = await readDb();
  const v = db.vendors.find((x) => x.id === id);
  if (!v) notFound();
  const plan = planOf(v.plan);
  const led = vendorLedger(db, v.id);
  const ship = shippingOf(v);
  const products = db.products.filter((p) => p.vendorId === v.id && p.status !== "archived");
  const canApprove = ctx.can("vendors.approve");
  const canManage = ctx.can("vendors.manage");
  const late = led.sales.filter((s) => s.part && s.settlement !== "void" && dispatchState(s.part) === "late").length;
  const row = (k: string, val: React.ReactNode) => <div className="flex justify-between gap-3 py-1"><dt className="text-ink-soft">{k}</dt><dd className="text-right">{val}</dd></div>;
  return (
    <div className="space-y-4">
      <PageHeader title={v.businessName} description={<>{v.id} · {plan.name} plan · <Badge tone={STATUS[v.status][1]}>{STATUS[v.status][0]}</Badge>{v.verified ? <> <Badge tone="blue">Verified</Badge></> : null}</>} />
      {v.statusNote && <Notice tone="red">Note shown to the seller: {v.statusNote}</Notice>}
      {late > 0 && <Notice tone="red">{late} order{late > 1 ? "s are" : " is"} past the seller’s dispatch deadline.</Notice>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Business & KYC">
          <dl className="text-sm">
            {row("Owner", v.ownerName)}{row("Email", v.email)}{row("Mobile", v.phone)}
            {row("Pickup address", `${v.address}, ${v.city}, ${v.state} – ${v.pincode}`)}
            {row("PAN", <span className="font-mono">{v.pan}</span>)}{row("GSTIN", v.gstin ? <span className="font-mono">{v.gstin}</span> : "Not given")}
            {row("Registered", day(v.createdAt))}{row("Approved", day(v.approvedAt))}
          </dl>
        </Card>
        <Card title="Plan fee & bank">
          <dl className="text-sm">
            {row("Plan fee", `${formatPrice(v.planFee)} ${v.fee.paid ? `paid ${day(v.fee.paidAt)}` : "not paid"}`)}
            {v.fee.paid && row("Reference", <span className="font-mono text-xs">{v.fee.reference}{v.fee.demo ? " (test)" : ""}</span>)}
            {row("Account holder", v.bank.holder)}{row("IFSC", <span className="font-mono">{v.bank.ifsc}</span>)}
            {row("Account", `•••• ${v.bank.accountLast4}`)}{row("UPI", v.bank.upi || "—")}
          </dl>
          {canManage && (
            <div className="mt-3 flex flex-wrap gap-2">
              <VForm action={revealBankAction} hidden={{ id: v.id }}><button className={btn.secondary}>Show full account number</button></VForm>
              <VForm action={vendorPasswordResetAction} hidden={{ id: v.id }}><button className={btn.secondary}>Reset seller’s password</button></VForm>
            </div>
          )}
        </Card>
        <Card title="Shipping (set by seller)">
          <dl className="text-sm">
            {row("Delivery charge", ship.fee ? formatPrice(ship.fee) : "Free")}
            {row("Free above", ship.freeAbove ? formatPrice(ship.freeAbove) : "—")}
            {row("Dispatch within", `${ship.handlingDays} working day${ship.handlingDays > 1 ? "s" : ""}`)}
            {row("Usual courier", ship.courier || "—")}
            {row("Holiday mode", ship.onHoliday ? "On (products hidden)" : "Off")}
          </dl>
        </Card>
      </div>

      {canApprove && (
        <Card title="Account decision">
          <div className="flex flex-wrap items-start gap-3">
            {v.status === "pending_review" && <VForm action={vendorStatusAction} hidden={{ id: v.id, op: "approve" }}><button className={btn.primary}>Approve seller</button></VForm>}
            {v.status === "suspended" && <VForm action={vendorStatusAction} hidden={{ id: v.id, op: "reinstate" }}><button className={btn.primary}>Reinstate</button></VForm>}
            {(v.status === "pending_review" || v.status === "pending_payment" || v.status === "approved") && (
              <VForm action={vendorStatusAction} hidden={{ id: v.id, op: v.status === "approved" ? "suspend" : "reject" }} className="flex flex-wrap items-end gap-2">
                <div><label className={label} htmlFor="why">Reason (seller sees this)</label><input id="why" name="note" className={`${field} w-72`} /></div>
                <button className={btn.danger}>{v.status === "approved" ? "Suspend" : "Reject"}</button>
              </VForm>
            )}
            <VForm action={vendorVerifyAction} hidden={{ id: v.id }}><button className={btn.secondary}>{v.verified ? "Remove verified" : "Mark documents verified"}</button></VForm>
          </div>
          {v.status === "pending_review" && <p className="mt-2 text-xs text-ink-soft">Before approving: check the PAN and GSTIN are real and match the business name, and the bank account holder matches. A rejected seller’s fee isn’t refunded automatically — refund it in Cashfree if you decide to.</p>}
        </Card>
      )}

      <Card title={`Wallet — ${formatMoney(led.totals.balance)}`}>
        <p className="text-sm text-ink-soft">
          Delivered sales {formatMoney(led.totals.credited)}{led.totals.adjusted ? <> {led.totals.adjusted > 0 ? "+" : "−"} adjustments {formatMoney(Math.abs(led.totals.adjusted))}</> : null} − sent to bank {formatMoney(led.totals.paidOut)} = <b className="text-ink">{formatMoney(led.totals.balance)}</b> in the wallet.
          Coming after delivery: {formatMoney(led.totals.pending)}. Free to pay now: {formatMoney(led.totals.available)}.
        </p>
        {led.openWithdrawal && (
          <div className="mt-3 rounded-xl bg-sun-soft p-3">
            <p className="font-semibold">Withdrawal requested: {formatMoney(led.openWithdrawal.amount)} <span className="text-xs font-normal text-ink-soft">on {day(led.openWithdrawal.requestedAt)}{led.openWithdrawal.note ? ` · “${led.openWithdrawal.note}”` : ""}</span></p>
            <p className="text-xs text-ink-soft">Send it to {v.bank.holder}, {v.bank.ifsc}, account ending {v.bank.accountLast4}{v.bank.upi ? ` (or UPI ${v.bank.upi})` : ""}, then enter the reference.</p>
            {canManage && (
              <div className="mt-2 flex flex-wrap items-start gap-3">
                <VForm action={withdrawalAction} hidden={{ id: led.openWithdrawal.id, op: "paid" }} className="flex flex-wrap items-end gap-2">
                  <div><label className={label} htmlFor="wref">Bank / UPI reference</label><input id="wref" name="reference" className={`${field} w-48`} /></div>
                  <button className={btn.primary}>Mark as paid</button>
                </VForm>
                <VForm action={withdrawalAction} hidden={{ id: led.openWithdrawal.id, op: "reject" }} className="flex flex-wrap items-end gap-2">
                  <div><label className={label} htmlFor="wwhy">Reason (seller sees this)</label><input id="wwhy" name="note" className={`${field} w-56`} /></div>
                  <button className={btn.danger}>Reject</button>
                </VForm>
              </div>
            )}
          </div>
        )}
        {canManage && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold text-leaf">Pay without a request, or adjust the wallet</summary>
            <VForm action={vendorPayoutAction} hidden={{ id: v.id }} className="mt-3 flex flex-wrap items-end gap-2">
              <div><label className={label} htmlFor="amt">Amount sent (₹)</label><input id="amt" name="amount" inputMode="decimal" className={`${field} w-32`} /></div>
              <div><label className={label} htmlFor="ref">Bank / UPI reference</label><input id="ref" name="reference" className={`${field} w-48`} /></div>
              <div><label className={label} htmlFor="pn">Note</label><input id="pn" name="note" className={`${field} w-56`} /></div>
              <button className={btn.secondary}>Record payout</button>
            </VForm>
            <VForm action={walletAdjustmentAction} hidden={{ id: v.id }} className="mt-3 flex flex-wrap items-end gap-2">
              <div><label className={label} htmlFor="adj">Adjust by (₹)</label><input id="adj" name="amount" inputMode="decimal" placeholder="-349 or 50" className={`${field} w-32`} /></div>
              <div><label className={label} htmlFor="adjo">Order (optional)</label><input id="adjo" name="orderId" placeholder="KRP-…" className={`${field} w-40`} /></div>
              <div><label className={label} htmlFor="adjr">Adjustment reason (seller sees this)</label><input id="adjr" name="reason" placeholder="Returned item refunded to customer" className={`${field} w-64`} /></div>
              <button className={btn.secondary}>Adjust wallet</button>
            </VForm>
          </details>
        )}
        {led.history.length > 0 && (
          <ul className="mt-3 divide-y divide-line text-sm">
            {led.history.map((h, i) => (
              <li key={i} className="flex justify-between gap-3 py-1.5">
                <span>{day(h.at)} · {h.text}{h.kind === "payout" ? ` · ref ${h.reference}` : ""}</span>
                <b className={h.kind === "withdrawal" ? "text-ink-soft" : h.amount < 0 ? "" : "text-leaf"}>{h.kind === "withdrawal" ? `(${formatMoney(h.amount)})` : `${h.amount < 0 ? "−" : "+"}${formatMoney(Math.abs(h.amount))}`}</b>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Orders (${led.sales.length})`}>
        {led.sales.length === 0 ? <p className="text-sm text-ink-soft">No orders yet.</p> : (
          <Table minWidth={700}>
            <thead><tr><th className={th}>Order</th><th className={th}>Date</th><th className={th}>Seller status</th><th className={th}>Items</th><th className={th}>Seller earns</th><th className={th}>Wallet</th></tr></thead>
            <tbody className="divide-y divide-line">
              {led.sales.map((s) => (
                <tr key={s.orderId}>
                  <td className={td}><Link href={`/admin/orders/${s.orderId}`} className="font-mono text-leaf underline">{s.orderId}</Link></td>
                  <td className={td}>{day(s.createdAt)}</td>
                  <td className={td}>{s.settlement === "void" ? "Cancelled" : s.part ? PART_LABEL[s.part.status] : "—"}{s.part && s.settlement !== "void" && dispatchState(s.part) === "late" && <div><Badge tone="red">Late</Badge></div>}</td>
                  <td className={td}>{s.units} · {formatPrice(s.gross)}</td>
                  <td className={td}>{formatMoney(s.payout)}</td>
                  <td className={td}>{{ credited: "In wallet", pending: "After delivery", void: "Cancelled" }[s.settlement]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card title={`Products (${products.length} of ${plan.productLimit ?? "∞"})`}>
        <ul className="divide-y divide-line text-sm">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{p.title} · {formatPrice(p.price)} · stock {p.variants.reduce((s, x) => s + x.stock, 0)}</span>
              <span className="flex gap-1">{p.private.featured && <Badge tone="yellow">Featured</Badge>}<Badge tone={p.status === "active" ? "green" : "neutral"}>{p.status}</Badge>{p.private.review?.status === "pending" && <Badge tone="yellow">Review</Badge>}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
