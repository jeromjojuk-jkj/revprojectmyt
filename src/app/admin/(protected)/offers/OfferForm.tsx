"use client";

import { useActionState } from "react";
import { OFFER_THEMES } from "@/lib/offers";
import { saveOfferAction, type OfferFormState } from "../../actions";

export function OfferForm({ initial, id }: { initial: Record<string, string | undefined>; id: string }) {
  const [state, action, pending] = useActionState<OfferFormState, FormData>(saveOfferAction, null);
  const v = state?.values ?? initial;
  const err = state?.errors ?? {};
  const input = (name: string, label: string, hint?: string, type = "text") => (
    <div className="space-y-1">
      <label htmlFor={`of-${name}`} className="text-sm font-medium">{label}</label>
      <input id={`of-${name}`} name={name} type={type} defaultValue={v[name] ?? ""} aria-invalid={!!err[name]}
        className={`h-11 w-full rounded-xl border-2 bg-white px-3 ${err[name] ? "border-danger" : "border-line"}`} />
      <p className={`text-xs ${err[name] ? "font-medium text-danger" : "text-ink-soft"}`}>{err[name] ?? hint}</p>
    </div>
  );
  return (
    <form action={action} key={JSON.stringify(state?.values ?? "")} className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      <h2 className="font-semibold">{id ? "Edit offer" : "New offer"}</h2>
      <input type="hidden" name="id" value={id} />
      {state?.message && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.message}</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {input("headline", "Headline", "e.g. Under ₹299 · max 32 characters")}
        {input("subhead", "What’s on offer", "e.g. Kurtas & kurtis")}
        {input("badge", "Season / campaign band", "e.g. Diwali Edit, Wedding Season")}
      </div>
      {input("query", "Opens this search", "Copy from the shop URL after /search?, e.g. type=Ethnic Wear&max=999")}
      <div className="grid gap-3 md:grid-cols-3">
        {input("productIds", "Picture products (1–2 IDs)", "e.g. p104, p007")}
        {input("startsOn", "Starts on (optional)", "Hidden before this date", "date")}
        {input("endsOn", "Ends on (optional)", "Shows “Offer ends …” and hides after", "date")}
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(OFFER_THEMES).map(([k, t]) => (
            <label key={k} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm ring-1 ring-line has-[:checked]:ring-2 has-[:checked]:ring-ink">
              <input type="radio" name="theme" value={k} defaultChecked={v.theme === k} className="sr-only" />
              <span className="h-5 w-5 rounded-full" style={{ background: t.bg }} />{t.label}
            </label>
          ))}
        </div>
        {err.theme && <p className="text-xs font-medium text-danger">{err.theme}</p>}
      </fieldset>
      <div className="space-y-1">
        <label htmlFor="of-terms" className="text-sm font-medium">Terms (optional)</label>
        <textarea id="of-terms" name="terms" rows={2} defaultValue={v.terms ?? ""} className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm" />
        <p className="text-xs text-ink-soft">Shown behind “T&amp;C apply”. Leave blank if there are none.</p>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={v.active === "on"} className="h-5 w-5 accent-[#166534]" /> Show on the homepage</label>
      <button disabled={pending} className="h-12 rounded-xl bg-leaf px-8 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save offer"}</button>
    </form>
  );
}
