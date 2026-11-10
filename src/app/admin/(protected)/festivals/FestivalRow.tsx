"use client";

import { useActionState } from "react";
import type { FestivalOffer } from "@/lib/types";
import { saveFestivalOfferAction, deleteFestivalOfferAction } from "@/app/admin/opsActions";
import { Badge, field, label } from "@/app/admin/_components/ui";

const STATUS = { running: ["green", "Running now"], upcoming: ["yellow", "Upcoming"], ended: ["neutral", "Ended"], off: ["dark", "Off"] } as const;

export function FestivalRow({ offer, canEdit, canDelete, status, window, summary }: {
  offer: FestivalOffer | null; canEdit: boolean; canDelete: boolean; status: keyof typeof STATUS; window: string; summary: string;
}) {
  const [state, action, pending] = useActionState(saveFestivalOfferAction, null);
  const f = offer;
  const num = (name: string, text: string, value: string | number, _w = "", hint?: string) => (
    <label className="block">
      <span className={label}>{text}</span>
      <input name={name} defaultValue={value} inputMode="numeric" disabled={!canEdit} className={field} />
      {hint && <span className="mt-0.5 block text-[11px] text-ink-soft">{hint}</span>}
    </label>
  );
  return (
    <form action={action} className={`rounded-2xl bg-white p-4 ring-1 ${f?.tier === "big" ? "ring-sun" : "ring-line"}`}>
      <input type="hidden" name="id" value={f?.id ?? ""} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{f ? f.name : "Add a festival"}</h2>
        {f && <Badge tone={STATUS[status][0]}>{STATUS[status][1]}</Badge>}
        {f?.tier === "big" && <Badge tone="yellow">Big offer</Badge>}
        {f?.checkDate && <Badge tone="red">Check date</Badge>}
        {f && <span className="text-xs text-ink-soft">Offer runs {window} · {summary}</span>}
      </div>
      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4 xl:grid-cols-[1.6fr_1.2fr_repeat(5,minmax(0,1fr))_auto_auto_auto]">
        <label className="col-span-2 block sm:col-span-2 xl:col-span-1"><span className={label}>Festival</span><input name="name" defaultValue={f?.name ?? ""} disabled={!canEdit} className={field} /></label>
        <label className="block"><span className={label}>Festival date</span><input type="date" name="date" defaultValue={f?.date ?? ""} disabled={!canEdit} className={field} /></label>
        {num("days", "Days", f?.days ?? 1, "w-16")}
        {num("leadDays", "Starts days before", f?.leadDays ?? 4, "w-20")}
        {num("percentOff", "% off", f?.percentOff ?? 10, "w-20")}
        {num("maxDiscount", "Max ₹ off", f?.maxDiscount ?? "", "w-24", "Blank = no cap")}
        {num("minSubtotal", "Min order ₹", f?.minSubtotal ?? 299, "w-24")}
        <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={f ? f.enabled : true} disabled={!canEdit} className="h-5 w-5 accent-leaf" /> On</label>
        {canEdit && <button disabled={pending} className="h-10 rounded-lg bg-leaf px-4 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : f ? "Save" : "Add festival"}</button>}
        {f && canDelete && <button formAction={deleteFestivalOfferAction} name="id" value={f.id} className="h-10 rounded-lg px-3 text-sm font-medium text-danger ring-1 ring-line">Delete</button>}
      </div>
      {state?.error && <p role="alert" className="mt-2 text-sm text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-2 text-sm text-leaf">{state.message}</p>}
    </form>
  );
}
