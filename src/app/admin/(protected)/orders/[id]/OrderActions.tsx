"use client";

import { useActionState, useEffect, useState } from "react";
import { orderAction } from "@/app/admin/opsActions";
import type { OrderOp } from "@/lib/orderflow";
import { btn, field, label } from "@/app/admin/_components/ui";

const PRIMARY: Partial<Record<OrderOp, string>> = { confirm: "Confirm order", pack: "Mark packed", deliver: "Mark delivered", cod_collected: "Mark COD collected", release: "Release hold" };

export function OrderActions({ id, ops, canRefund, remaining, demo, codManual }: { id: string; ops: OrderOp[]; canRefund: boolean; remaining: number; demo: boolean; codManual: boolean }) {
  const [state, action, pending] = useActionState(orderAction, null);
  const [open, setOpen] = useState<null | OrderOp>(null);
  const has = (o: OrderOp) => ops.includes(o);
  // Close the open panel once its action succeeds.
  useEffect(() => { if (state?.ok) setOpen(null); }, [state]);
  const hidden = (op: OrderOp) => (<><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} /></>);
  const toggle = (o: OrderOp) => setOpen(open === o ? null : o);
  // Values from a rejected submit, keyed by the op they belong to.
  const back = (k: string) => (state?.values ? state.values[k] : undefined);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PRIMARY) as OrderOp[]).filter(has).map((op) => (
          <form key={op} action={action}>{hidden(op)}<button disabled={pending} className={btn.primary}>{PRIMARY[op]}</button></form>
        ))}
        {has("ship") && <button type="button" onClick={() => toggle("ship")} aria-expanded={open === "ship"} className={btn.primary}>Create shipment</button>}
        {has("tracking") && <button type="button" onClick={() => toggle("tracking")} aria-expanded={open === "tracking"} className={btn.secondary}>Add tracking update</button>}
        {has("hold") && <button type="button" onClick={() => toggle("hold")} aria-expanded={open === "hold"} className={btn.secondary}>Put on hold</button>}
        {has("refund") && canRefund && <button type="button" onClick={() => toggle("refund")} aria-expanded={open === "refund"} className={btn.secondary}>Record refund</button>}
        {has("cancel") && <button type="button" onClick={() => toggle("cancel")} aria-expanded={open === "cancel"} className={btn.danger}>Cancel order</button>}
      </div>

      {open === "ship" && (
        <form action={action} className="grid gap-3 rounded-xl bg-paper p-3 sm:grid-cols-3">
          {hidden("ship")}
          <div><label className={label} htmlFor="carrier">Courier</label><input id="carrier" name="carrier" defaultValue={back("carrier")} required placeholder="e.g. Delhivery" className={field} /></div>
          <div><label className={label} htmlFor="awb">AWB / tracking number</label><input id="awb" name="awb" defaultValue={back("awb")} required className={`${field} font-mono`} /></div>
          <div><label className={label} htmlFor="trackingUrl">Tracking link (optional)</label><input id="trackingUrl" name="trackingUrl" defaultValue={back("trackingUrl")} type="url" placeholder="https://" className={field} /></div>
          <p className="text-xs text-ink-soft sm:col-span-2">No courier integration is connected: book the pickup with your courier, then record it here. The customer sees the courier and AWB on their order page.</p>
          <button disabled={pending} className={btn.primary}>Mark shipped</button>
        </form>
      )}
      {open === "tracking" && (
        <form action={action} className="flex flex-wrap gap-2 rounded-xl bg-paper p-3">
          {hidden("tracking")}
          <label className="sr-only" htmlFor="tnote">Tracking update</label>
          <input id="tnote" name="note" required placeholder="e.g. Out for delivery" className={`${field} min-w-0 flex-1`} />
          <button disabled={pending} className={btn.primary}>Add update</button>
        </form>
      )}
      {open === "hold" && (
        <form action={action} className="flex flex-wrap gap-2 rounded-xl bg-paper p-3">
          {hidden("hold")}
          <label className="sr-only" htmlFor="hnote">Reason for hold</label>
          <input id="hnote" name="note" required placeholder="Reason (e.g. address needs confirming)" className={`${field} min-w-0 flex-1`} />
          <button disabled={pending} className={btn.dark}>Hold order</button>
        </form>
      )}
      {open === "refund" && (
        <form action={action} className="grid gap-3 rounded-xl bg-paper p-3 sm:grid-cols-3">
          {hidden("refund")}
          <div><label className={label} htmlFor="amount">Amount (max ₹{remaining})</label><input id="amount" name="amount" inputMode="numeric" required defaultValue={back("amount") ?? remaining} className={field} /></div>
          <div><label className={label} htmlFor="reason">Reason</label><input id="reason" name="reason" defaultValue={back("reason")} required className={field} /></div>
          <div><label className={label} htmlFor="reference">{demo ? "Reference (optional)" : codManual ? "Bank / UPI transfer reference" : "Payment provider refund ID"}</label><input id="reference" name="reference" defaultValue={back("reference")} required={!demo} className={field} /></div>
          <p className="text-xs text-ink-soft sm:col-span-3">
            {demo ? "Demo order: this records the refund only. No money moves." : "No refund API is connected. Issue the refund in your payment provider’s dashboard (or by bank/UPI transfer for COD) first, then record its reference here."}
          </p>
          <button disabled={pending} className={btn.primary}>Record refund</button>
        </form>
      )}
      {open === "cancel" && (
        <form action={action} className="flex flex-wrap gap-2 rounded-xl bg-danger-soft p-3">
          {hidden("cancel")}
          <label className="sr-only" htmlFor="cnote">Cancellation reason</label>
          <input id="cnote" name="note" placeholder="Reason (shown in the order history)" className={`${field} min-w-0 flex-1`} />
          <button disabled={pending} className={btn.danger}>Confirm cancellation</button>
          <p className="w-full text-xs text-danger">Reserved stock goes back on sale. If the customer has paid, a refund will be due.</p>
        </form>
      )}

      <form action={action} className="flex flex-wrap gap-2">
        {hidden("note")}
        <label className="sr-only" htmlFor="inote">Internal note</label>
        <input id="inote" name="note" required placeholder="Add an internal note (staff only)" className={`${field} min-w-0 flex-1`} />
        <button disabled={pending} className={btn.secondary}>Add note</button>
      </form>

      <div aria-live="polite">
        {state?.error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
        {state?.ok && <p className="rounded-lg bg-leaf-soft px-3 py-2 text-sm text-leaf">{state.message}</p>}
      </div>
    </div>
  );
}
