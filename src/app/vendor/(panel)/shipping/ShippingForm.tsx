"use client";

import { useActionState } from "react";
import { saveShippingAction } from "@/app/vendor/orderActions";

const input = "h-11 w-full rounded-xl border-2 border-line bg-white px-3 text-[15px] outline-none focus:border-leaf";

export function ShippingForm({ initial, pickup }: { initial: { fee: string; freeAbove: string; handlingDays: string; courier: string; onHoliday: boolean }; pickup: string }) {
  const [state, action, pending] = useActionState(saveShippingAction, null);
  const err = state?.errors ?? {};
  const box = "space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line";
  return (
    <form action={action} className="space-y-4" noValidate>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Delivery charge to customers</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="s-fee" className="mb-1 block text-sm font-medium">Charge per order (₹)</label>
            <input id="s-fee" name="fee" inputMode="numeric" defaultValue={initial.fee} className={`${input} ${err.fee ? "border-danger" : ""}`} />
            <p className={`mt-1 text-xs ${err.fee ? "text-danger" : "text-ink-soft"}`}>{err.fee ?? "0 = always free delivery."}</p>
          </div>
          <div>
            <label htmlFor="s-free" className="mb-1 block text-sm font-medium">Free delivery when your items total at least (₹)</label>
            <input id="s-free" name="freeAbove" inputMode="numeric" defaultValue={initial.freeAbove} className={`${input} ${err.freeAbove ? "border-danger" : ""}`} />
            <p className={`mt-1 text-xs ${err.freeAbove ? "text-danger" : "text-ink-soft"}`}>{err.freeAbove ?? "Leave blank for no free-delivery offer."}</p>
          </div>
        </div>
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Dispatch</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="s-days" className="mb-1 block text-sm font-medium">Hand to courier within</label>
            <select id="s-days" name="handlingDays" defaultValue={initial.handlingDays} className={input}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => <option key={d} value={d}>{d} working day{d > 1 ? "s" : ""}</option>)}
            </select>
            {err.handlingDays && <p className="mt-1 text-xs text-danger">{err.handlingDays}</p>}
          </div>
          <div>
            <label htmlFor="s-courier" className="mb-1 block text-sm font-medium">Usual courier (optional)</label>
            <input id="s-courier" name="courier" defaultValue={initial.courier} placeholder="e.g. Delhivery" className={input} />
          </div>
        </div>
        <p className="text-xs text-ink-soft">Pickup / return address: {pickup}. Sundays don’t count as working days.</p>
      </fieldset>
      <label className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
        <input type="checkbox" name="onHoliday" defaultChecked={initial.onHoliday} className="mt-1 size-5 accent-leaf" />
        <span><b>Holiday mode</b><span className="block text-sm text-ink-soft">Hide all my products from the shop until I switch this off. Orders already placed still need shipping.</span></span>
      </label>
      {state?.ok && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm font-medium text-leaf">{state.ok}</p>}
      <button disabled={pending} className="h-12 rounded-xl bg-leaf px-6 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save shipping settings"}</button>
    </form>
  );
}
