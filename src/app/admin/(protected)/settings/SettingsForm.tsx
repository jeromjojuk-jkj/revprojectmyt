"use client";

import { useActionState } from "react";
import { settingsAction } from "../../actions";

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [state, action, pending] = useActionState(settingsAction, null);
  const input = (name: string, label: string, hint?: string) => (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <input id={name} name={name} defaultValue={initial[name]} inputMode="decimal" className="h-11 w-full rounded-xl border-2 border-line bg-white px-3" />
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
  return (
    <form action={action} className="space-y-4">
      <fieldset className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-line md:grid-cols-3">
        <legend className="px-1 font-semibold">Shopper charges</legend>
        {input("deliveryFee", "Delivery fee per order (₹)")}
        {input("freeDeliveryAbove", "Free delivery above (₹)", "Leave blank for no free-delivery offer.")}
        {input("codFee", "COD fee (₹)")}
        {input("codMaxOrderValue", "COD max order value (₹)")}
      </fieldset>
      <fieldset className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
        <legend className="px-1 font-semibold">Estimates (admin only)</legend>
        {input("returnAllowancePct", "Return allowance (% of selling price)")}
        <label htmlFor="channelFees" className="text-sm font-medium">Channel fees — one per line: Channel | marketplace fee % | payment fee % | fixed fee ₹</label>
        <textarea id="channelFees" name="channelFees" rows={4} defaultValue={initial.channelFees} className="w-full rounded-xl border-2 border-line px-3 py-2 font-mono text-sm" />
        <p className="text-xs text-ink-soft">Enter the fee rates from your actual marketplace and payment-provider agreements. Defaults are placeholders.</p>
      </fieldset>
      <fieldset className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
        <legend className="px-1 font-semibold">Coupon codes</legend>
        <label htmlFor="coupons" className="text-sm font-medium">One per line: CODE | ₹ off | min subtotal | active/inactive | description</label>
        <textarea id="coupons" name="coupons" rows={3} defaultValue={initial.coupons} className="w-full rounded-xl border-2 border-line px-3 py-2 font-mono text-sm" />
      </fieldset>
      {state?.errors && state.errors.length > 0 && (
        <ul role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
      )}
      {state?.ok && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Settings saved.</p>}
      <button disabled={pending} className="h-12 rounded-xl bg-leaf px-8 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
