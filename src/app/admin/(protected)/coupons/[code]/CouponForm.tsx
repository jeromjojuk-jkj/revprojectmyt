"use client";

import { useActionState, useState } from "react";
import { saveCouponAction } from "@/app/admin/opsActions";
import { CATEGORIES } from "@/lib/constants";
import { btn, field, label } from "@/app/admin/_components/ui";

export function CouponForm({ initial, original }: { initial: Record<string, string>; original: string }) {
  const [state, action, pending] = useActionState(saveCouponAction, null);
  const v = state?.values ?? initial;
  const [kind, setKind] = useState(v.kind ?? "fixed");
  const err = (k: string) => state?.errors?.[k] && <p id={`${k}-err`} className="mt-1 text-xs text-danger">{state.errors[k]}</p>;
  const f = (k: string, l: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <div>
      <label className={label} htmlFor={k}>{l}</label>
      <input id={k} name={k} defaultValue={v[k]} aria-invalid={!!state?.errors?.[k]} aria-describedby={state?.errors?.[k] ? `${k}-err` : undefined} className={`${field} ${state?.errors?.[k] ? "border-danger" : ""}`} {...props} />
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {err(k)}
    </div>
  );
  const cats = (v.categories ?? "").split(",");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="original" value={original} />
      <fieldset className="grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:grid-cols-2">
        <legend className="px-1 font-semibold">Code & value</legend>
        {f("code", "Code", { required: true, className: `${field} font-mono uppercase`, maxLength: 20 }, "Letters and digits, 3–20 characters.")}
        <div>
          <span className={label}>Type</span>
          <div className="flex gap-2">
            {[["fixed", "₹ off"], ["percent", "% off"]].map(([k, l]) => (
              <label key={k} className={`flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold ring-1 ${kind === k ? "bg-ink text-white ring-ink" : "ring-line"}`}>
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />{l}
              </label>
            ))}
          </div>
        </div>
        {f("amountOff", kind === "percent" ? "Percent off" : "Rupees off", { required: true, inputMode: "numeric" })}
        {kind === "percent" ? f("maxDiscount", "Maximum discount ₹ (optional)", { inputMode: "numeric" }) : <div />}
        {f("minSubtotal", "Minimum order value ₹", { inputMode: "numeric" }, "Item total after nothing else is taken off.")}
        {f("description", "Shopper-facing description (optional)", { maxLength: 120 }, "Left blank, it’s written for you, e.g. “₹50 off on orders of ₹699+”.")}
      </fieldset>
      <fieldset className="grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:grid-cols-2">
        <legend className="px-1 font-semibold">Limits & schedule</legend>
        {f("startsOn", "Starts (IST, optional)", { type: "date" })}
        {f("endsOn", "Ends (IST, optional, inclusive)", { type: "date" })}
        {f("usageLimit", "Total redemptions (blank = unlimited)", { inputMode: "numeric" })}
        {f("perCustomerLimit", "Per customer (blank = unlimited)", { inputMode: "numeric" }, "Customers are matched by phone number.")}
        <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="firstOrderOnly" defaultChecked={v.firstOrderOnly === "on"} className="h-5 w-5" /> First order only (customers with no earlier booked order)</label>
        <div className="sm:col-span-2">
          <span className={label}>Only for these categories (none ticked = whole bag)</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label key={c.id} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-paper px-3 text-sm ring-1 ring-line has-[:checked]:bg-leaf-soft has-[:checked]:ring-leaf">
                <input type="checkbox" name="categories" value={c.id} defaultChecked={cats.includes(c.id)} /> {c.short}
              </label>
            ))}
          </div>
          {err("categories")}
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" name="active" defaultChecked={v.active === "on"} className="h-5 w-5" /> Active</label>
      </fieldset>
      {state?.message && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.message}</p>}
      <button disabled={pending} className={`${btn.primary} h-12 px-8`}>{pending ? "Saving…" : "Save coupon"}</button>
    </form>
  );
}
