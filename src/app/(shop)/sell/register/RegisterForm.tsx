"use client";

import { useActionState } from "react";
import { registerVendorAction } from "@/app/vendor/actions";
import { formatPrice } from "@/lib/format";

const input = "h-11 w-full rounded-xl border-2 border-line bg-white px-3 text-[15px] outline-none focus:border-leaf";

export function RegisterForm({ plans, states, initialPlan, commission }: { plans: { id: string; name: string; fee: number }[]; states: readonly string[]; initialPlan: string; commission: string }) {
  const [state, action, pending] = useActionState(registerVendorAction, null);
  const v = state?.values ?? {};
  const err = state?.errors ?? {};
  const F = ({ name, label, type = "text", hint, auto, mode }: { name: string; label: string; type?: string; hint?: string; auto?: string; mode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) => (
    <div>
      <label htmlFor={`r-${name}`} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={`r-${name}`} name={name} type={type} defaultValue={type === "password" ? undefined : v[name]} autoComplete={auto} inputMode={mode} aria-invalid={!!err[name]} className={`${input} ${err[name] ? "border-danger" : ""}`} />
      {err[name] ? <p className="mt-1 text-xs text-danger">{err[name]}</p> : hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
  const box = "space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line";
  return (
    <form action={action} className="mt-4 space-y-4" noValidate>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Plan (one-time fee)</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {plans.map((p) => (
            <label key={p.id} className="flex min-h-14 cursor-pointer items-center gap-2 rounded-xl px-3 ring-2 ring-line has-[:checked]:bg-sun-soft has-[:checked]:ring-sun">
              <input type="radio" name="plan" value={p.id} defaultChecked={(v.plan ?? initialPlan) === p.id} className="accent-leaf" />
              <span><span className="block font-semibold">{p.name}</span><span className="text-sm text-ink-soft">{formatPrice(p.fee)}</span></span>
            </label>
          ))}
        </div>
        {err.plan && <p className="text-xs text-danger">{err.plan}</p>}
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Business & sign-in</legend>
        <F name="businessName" label="Business / shop name" hint="Shown to customers as “Sold by”." />
        <F name="ownerName" label="Owner’s full name" auto="name" />
        <div className="grid gap-3 sm:grid-cols-2">
          <F name="email" label="Email" type="email" auto="email" mode="email" />
          <F name="phone" label="Mobile number" type="tel" auto="tel" mode="numeric" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F name="password" label="Password" type="password" auto="new-password" hint="At least 10 characters." />
          <F name="password2" label="Confirm password" type="password" auto="new-password" />
        </div>
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Pickup address</legend>
        <F name="address" label="Address" auto="street-address" />
        <div className="grid gap-3 sm:grid-cols-3">
          <F name="city" label="City" auto="address-level2" />
          <div>
            <label htmlFor="r-state" className="mb-1 block text-sm font-medium">State</label>
            <select id="r-state" name="state" defaultValue={v.state ?? ""} className={`${input} ${err.state ? "border-danger" : ""}`}>
              <option value="">Choose…</option>
              {states.map((s) => <option key={s}>{s}</option>)}
            </select>
            {err.state && <p className="mt-1 text-xs text-danger">{err.state}</p>}
          </div>
          <F name="pincode" label="Pincode" mode="numeric" auto="postal-code" />
        </div>
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Tax & bank details</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <F name="pan" label="PAN" hint="Of the business or owner." />
          <F name="gstin" label="GSTIN (optional)" hint="Needed for most online sellers — add it if you have one." />
        </div>
        <F name="bankHolder" label="Account holder name" />
        <div className="grid gap-3 sm:grid-cols-2">
          <F name="account" label="Bank account number" type="password" mode="numeric" />
          <F name="account2" label="Re-enter account number" mode="numeric" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F name="ifsc" label="IFSC" />
          <F name="upi" label="UPI ID (optional)" />
        </div>
        <p className="text-xs text-ink-soft">Your earnings are paid to this account. The account number is stored encrypted and shown to Krip only for payouts.</p>
      </fieldset>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="terms" className="mt-0.5 h-5 w-5 accent-leaf" />
        <span>I’ll only list genuine products I’m allowed to sell, ship orders on time, and accept Krip’s commission ({commission} of each product’s selling price) and the <a href="/help/terms" className="text-leaf underline" target="_blank">terms</a>.</span>
      </label>
      {err.terms && <p className="text-xs text-danger">{err.terms}</p>}
      {(state?.error || (state?.errors && Object.keys(state.errors).length > 0)) && (
        <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state?.error ?? "Please fix the highlighted fields."}</p>
      )}
      <button disabled={pending} className="h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60">{pending ? "Creating your account…" : "Continue to payment"}</button>
    </form>
  );
}
