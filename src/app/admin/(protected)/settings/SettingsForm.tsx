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
  const range = (zone: string, label: string, hint: string) => (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <input aria-label={`${label}: from (days)`} name={`${zone}Min`} defaultValue={initial[`${zone}Min`]} inputMode="numeric" className="h-11 w-20 rounded-xl border-2 border-line bg-white px-3" />
        <span className="text-sm text-ink-soft">to</span>
        <input aria-label={`${label}: to (days)`} name={`${zone}Max`} defaultValue={initial[`${zone}Max`]} inputMode="numeric" className="h-11 w-20 rounded-xl border-2 border-line bg-white px-3" />
        <span className="text-sm text-ink-soft">days</span>
      </div>
      <p className="text-xs text-ink-soft">{hint}</p>
    </div>
  );
  return (
    <form action={action} className="space-y-4">
      <fieldset className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
        <legend className="px-1 font-semibold">Delivery times & instructions</legend>
        <p className="text-xs text-ink-soft">Working days from the order date (Sundays aren’t counted). Shoppers see these as estimates on product pages and at checkout.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {range("metro", "Metro cities", "Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad…")}
          {range("standard", "Rest of India", "All other pincodes")}
          {range("remote", "Remote areas", "North-east, J&K, Ladakh, islands")}
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="codRemote" defaultChecked={initial.codRemote === "on"} className="h-5 w-5 accent-leaf" />
          Allow Cash on Delivery to remote areas
        </label>
        <div className="space-y-1">
          <label htmlFor="deliveryNote" className="text-sm font-medium">Delivery instructions shown to shoppers</label>
          <textarea id="deliveryNote" name="deliveryNote" rows={3} maxLength={400} defaultValue={initial.deliveryNote} className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm" />
          <p className="text-xs text-ink-soft">E.g. dispatch time, courier partner, or “Keep your phone reachable — the courier will call before delivery.” Up to 400 characters. Leave blank to hide.</p>
        </div>
      </fieldset>
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
      {state?.errors && state.errors.length > 0 && (
        <ul role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
      )}
      {state?.ok && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Settings saved.</p>}
      <button disabled={pending} className="h-12 rounded-xl bg-leaf px-8 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
