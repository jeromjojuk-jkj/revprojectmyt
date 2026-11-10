"use client";

import { useActionState, useState } from "react";
import { vendorOrderAction } from "@/app/vendor/orderActions";
import type { VendorOp } from "@/lib/vendorFulfilment";

const input = "h-11 w-full rounded-xl border-2 border-line bg-white px-3 text-[15px] outline-none focus:border-leaf";
const primary = "h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60";

export function VendorOrderActions({ orderId, ops, defaultCourier, updates }: { orderId: string; ops: VendorOp[]; defaultCourier: string; updates: string[] }) {
  const [state, action, pending] = useActionState(vendorOrderAction, null);
  const [issue, setIssue] = useState(false);
  const Hidden = ({ op }: { op: VendorOp }) => <><input type="hidden" name="orderId" value={orderId} /><input type="hidden" name="op" value={op} /></>;
  return (
    <div className="space-y-4">
      {state?.ok && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm font-medium text-leaf">{state.ok}</p>}
      {state?.error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.error}</p>}

      {ops.includes("accept") && (
        <form action={action} className="space-y-2">
          <Hidden op="accept" />
          <p className="text-sm text-ink-soft">Check you have the items in stock, then accept.</p>
          <button disabled={pending} className={primary}>Accept order</button>
        </form>
      )}
      {ops.includes("pack") && (
        <form action={action} className="space-y-2">
          <Hidden op="pack" />
          <p className="text-sm text-ink-soft">Pack the items securely and stick the packing slip on the parcel.</p>
          <button disabled={pending} className={primary}>Mark as packed</button>
        </form>
      )}
      {ops.includes("ship") && (
        <form action={action} className="space-y-2">
          <Hidden op="ship" />
          <p className="text-sm text-ink-soft">Book the pickup with your courier, then enter the details. The customer sees them on their order page.</p>
          <div><label className="mb-1 block text-sm font-medium" htmlFor="carrier">Courier</label><input id="carrier" name="carrier" defaultValue={defaultCourier} placeholder="e.g. Delhivery, DTDC, India Post" className={input} /></div>
          <div><label className="mb-1 block text-sm font-medium" htmlFor="awb">AWB / tracking number</label><input id="awb" name="awb" className={`${input} font-mono`} autoCapitalize="characters" /></div>
          <div><label className="mb-1 block text-sm font-medium" htmlFor="turl">Tracking link (optional)</label><input id="turl" name="trackingUrl" type="url" inputMode="url" placeholder="https://" className={input} /></div>
          <button disabled={pending} className={primary}>Mark as shipped</button>
        </form>
      )}
      {ops.includes("tracking") && (
        <form action={action} className="space-y-2">
          <Hidden op="tracking" />
          <label className="block text-sm font-medium" htmlFor="upd">Post a tracking update</label>
          <select id="upd" name="update" className={input} defaultValue="">
            <option value="">Choose…</option>
            {updates.map((u) => <option key={u}>{u}</option>)}
          </select>
          <input name="note" placeholder="Note for the customer (optional)" className={input} maxLength={300} />
          <button disabled={pending} className="h-11 w-full rounded-xl bg-white font-semibold ring-2 ring-leaf text-leaf disabled:opacity-60">Post update</button>
        </form>
      )}
      {ops.includes("deliver") && (
        <form action={action} className="space-y-2">
          <Hidden op="deliver" />
          <p className="text-sm text-ink-soft">Only when the courier shows it as delivered.</p>
          <button disabled={pending} className={primary}>Mark as delivered</button>
        </form>
      )}
      {ops.includes("issue") && (
        issue ? (
          <form action={action} className="space-y-2 border-t border-line pt-3">
            <Hidden op="issue" />
            <label className="block text-sm font-medium" htmlFor="why">Why can’t you ship this?</label>
            <textarea id="why" name="note" rows={3} maxLength={300} className="w-full rounded-xl border-2 border-line p-3 outline-none focus:border-leaf" placeholder="e.g. Out of stock, item damaged" />
            <button disabled={pending} className="h-11 w-full rounded-xl bg-danger font-semibold text-white disabled:opacity-60">Tell Krip</button>
          </form>
        ) : (
          <button type="button" onClick={() => setIssue(true)} className="text-sm text-danger underline">Can’t ship this order?</button>
        )
      )}
    </div>
  );
}
