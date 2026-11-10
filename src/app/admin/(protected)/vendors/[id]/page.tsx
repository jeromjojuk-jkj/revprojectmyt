import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { vendorLedger } from "@/lib/server/vendorLedger";
import { easySplitEnabled } from "@/lib/server/cashfree";
import { planOf, shippingOf } from "@/lib/vendorPlans";
import { PART_LABEL, dispatchState } from "@/lib/vendorFulfilment";
import { formatPrice } from "@/lib/format";
import { Badge, Card, Notice, PageHeader, Table, btn, field, label, td, th } from "@/app/admin/_components/ui";
import { VForm } from "../VForm";
import { STATUS } from "../status";
import { revealBankAction, vendorCashfreeAction, vendorPayoutAction, vendorStatusAction, vendorVerifyAction } from "@/app/admin/vendorActions";

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
            {row("Cashfree Easy Split", v.cashfreeVendorId ? "Added" : "Not added")}
          </dl>
          {canManage && (
            <div className="mt-3 flex flex-wrap gap-2">
              <VForm action={revealBankAction} hidden={{ id: v.id }}><button className={btn.secondary}>Show full account number</button></VForm>
              {!v.cashfreeVendorId && v.status === "approved" && easySplitEnabled() && <VForm action={vendorCashfreeAction} hidden={{ id: v.id }}><button className={btn.secondary}>Add to Cashfree Easy Split</button></VForm>}
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

      <Card title={`Earnings — Krip owes ${formatPrice(led.totals.dueNow)}`}>
        <p className="text-sm text-ink-soft">Sales {formatPrice(led.totals.gross)} + delivery {formatPrice(led.totals.delivery)} − commission {formatPrice(led.totals.commission)} = seller earnings {formatPrice(led.totals.earnings)}. Via Cashfree split: {formatPrice(led.totals.viaCashfree)}. Waiting for delivery: {formatPrice(led.totals.pending)}. Paid by Krip so far: {formatPrice(led.totals.paidManually)}.</p>
        {canManage && (
          <VForm action={vendorPayoutAction} hidden={{ id: v.id }} className="mt-3 flex flex-wrap items-end gap-2">
            <div><label className={label} htmlFor="amt">Amount paid (₹)</label><input id="amt" name="amount" inputMode="numeric" defaultValue={led.totals.dueNow || ""} className={`${field} w-32`} /></div>
            <div><label className={label} htmlFor="ref">Bank / UPI reference</label><input id="ref" name="reference" className={`${field} w-48`} /></div>
            <div><label className={label} htmlFor="pn">Note</label><input id="pn" name="note" className={`${field} w-56`} /></div>
            <button className={btn.primary}>Record payout</button>
          </VForm>
        )}
        {led.payouts.length > 0 && <ul className="mt-3 divide-y divide-line text-sm">{led.payouts.map((p) => <li key={p.id} className="flex justify-between py-1.5"><span>{day(p.at)} · {p.reference} · by {p.by}{p.note ? ` · ${p.note}` : ""}</span><b>{formatPrice(p.amount)}</b></li>)}</ul>}
      </Card>

      <Card title={`Orders (${led.sales.length})`}>
        {led.sales.length === 0 ? <p className="text-sm text-ink-soft">No orders yet.</p> : (
          <Table minWidth={700}>
            <thead><tr><th className={th}>Order</th><th className={th}>Date</th><th className={th}>Seller status</th><th className={th}>Items</th><th className={th}>Seller earns</th><th className={th}>Payout</th></tr></thead>
            <tbody className="divide-y divide-line">
              {led.sales.map((s) => (
                <tr key={s.orderId}>
                  <td className={td}><Link href={`/admin/orders/${s.orderId}`} className="font-mono text-leaf underline">{s.orderId}</Link></td>
                  <td className={td}>{day(s.createdAt)}</td>
                  <td className={td}>{s.settlement === "void" ? "Cancelled" : s.part ? PART_LABEL[s.part.status] : "—"}{s.part && s.settlement !== "void" && dispatchState(s.part) === "late" && <div><Badge tone="red">Late</Badge></div>}</td>
                  <td className={td}>{s.units} · {formatPrice(s.gross)}</td>
                  <td className={td}>{formatPrice(s.payout)}</td>
                  <td className={td}>{{ split: "Cashfree split", owed: "Krip pays", pending: "After delivery", void: "Cancelled" }[s.settlement]}</td>
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
