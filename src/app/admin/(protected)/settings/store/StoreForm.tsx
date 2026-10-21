"use client";

import { useActionState } from "react";
import { storeSettingsAction } from "@/app/admin/opsActions";
import { PAYMENT_METHOD_CHOICES } from "@/lib/storeProfile";
import { btn, field, label } from "@/app/admin/_components/ui";

export function StoreForm({ initial, payments, canEdit }: { initial: Record<string, string>; payments: string[]; canEdit: boolean }) {
  const [state, action, pending] = useActionState(storeSettingsAction, null);
  const v = state?.values ?? initial;
  const f = (k: string, l: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <div>
      <label className={label} htmlFor={k}>{l}</label>
      <input id={k} name={k} defaultValue={v[k]} disabled={!canEdit} aria-invalid={!!state?.errors?.[k]} aria-describedby={state?.errors?.[k] ? `${k}-err` : undefined} className={`${field} ${state?.errors?.[k] ? "border-danger" : ""} disabled:bg-paper`} {...props} />
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {state?.errors?.[k] && <p id={`${k}-err`} className="mt-1 text-xs text-danger">{state.errors[k]}</p>}
    </div>
  );
  const box = "grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:grid-cols-2";
  return (
    <form action={action} className="space-y-4">
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Customer support (footer & Contact page)</legend>
        {f("name", "Store name", { required: true })}
        {f("supportHours", "Support hours", {}, "e.g. Mon–Sat, 10am–6pm IST")}
        {f("supportEmail", "Support email", { type: "email" })}
        {f("supportPhone", "Support phone", { inputMode: "tel" })}
        {f("whatsapp", "WhatsApp support number", { inputMode: "tel" }, "Adds “WhatsApp Support” to the footer. Leave blank if you don’t answer WhatsApp.")}
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Business & legal</legend>
        {f("legalName", "Registered business name")}
        {f("gstin", "GSTIN", { className: `${field} font-mono uppercase`, maxLength: 15 })}
        <div className="sm:col-span-2">
          <label className={label} htmlFor="address">Registered business address</label>
          <textarea id="address" name="address" rows={3} defaultValue={v.address} disabled={!canEdit} className={`${field} h-auto py-2 disabled:bg-paper`} />
        </div>
        {f("grievanceName", "Grievance officer name", {}, "Required on the site under the Consumer Protection (E-Commerce) Rules, 2020.")}
        {f("grievanceEmail", "Grievance officer email", { type: "email" })}
      </fieldset>
      <fieldset className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <legend className="px-1 font-semibold">Accepted payment methods</legend>
        <p className="mb-3 text-xs text-ink-soft">Shown in the footer. Only tick methods your live payment setup actually accepts — none are shown until you tick them.</p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHOD_CHOICES.map((m) => (
            <label key={m} className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-paper px-4 text-sm ring-1 ring-line has-[:checked]:bg-leaf-soft has-[:checked]:ring-leaf">
              <input type="checkbox" name="acceptedPayments" value={m} defaultChecked={payments.includes(m)} disabled={!canEdit} /> {m}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Social profiles</legend>
        {f("instagram", "Instagram URL", { type: "url", placeholder: "https://www.instagram.com/…" })}
        {f("facebook", "Facebook URL", { type: "url", placeholder: "https://www.facebook.com/…" })}
        {f("youtube", "YouTube URL (optional)", { type: "url" })}
        {f("x", "X / Twitter URL (optional)", { type: "url" })}
        <p className="text-xs text-ink-soft sm:col-span-2">Instagram and Facebook show as “soon” in the footer until a link is added.</p>
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Announcement bar</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" name="announcementActive" defaultChecked={v.announcementActive === "on"} disabled={!canEdit} className="h-5 w-5" /> Show announcement above the header</label>
        {f("announcementText", "Text", { maxLength: 140 }, "Keep it true and specific — no fake urgency.")}
        {f("announcementHref", "Link (optional)", { placeholder: "/drops or https://…" })}
      </fieldset>
      <fieldset className={box}>
        <legend className="px-1 font-semibold">Operations</legend>
        {f("lowStockThreshold", "Low-stock alert at (units per variant)", { inputMode: "numeric" }, "Internal only. Never shown to shoppers.")}
        <div />
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-danger sm:col-span-2"><input type="checkbox" name="maintenanceActive" defaultChecked={v.maintenanceActive === "on"} disabled={!canEdit} className="h-5 w-5" /> Maintenance mode — shoppers see a maintenance page and can’t place orders. Signed-in staff still see the store.</label>
        <div className="sm:col-span-2">{f("maintenanceMessage", "Maintenance message", { maxLength: 300 })}</div>
      </fieldset>
      <div aria-live="polite">
        {state?.errors && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">Please fix the highlighted fields.</p>}
        {state?.ok && <p className="rounded-lg bg-leaf-soft px-3 py-2 text-sm text-leaf">Saved. The storefront footer and Contact page are updated.</p>}
      </div>
      {canEdit ? <button disabled={pending} className={`${btn.primary} h-12 px-8`}>{pending ? "Saving…" : "Save store settings"}</button> : <p className="text-sm text-ink-soft">You can view these settings. Changing them needs “Manage settings” on Store settings & content.</p>}
    </form>
  );
}
