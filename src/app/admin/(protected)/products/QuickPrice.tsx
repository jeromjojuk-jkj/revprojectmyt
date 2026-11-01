"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { setProductPriceAction } from "@/app/admin/opsActions";
import { field } from "@/app/admin/_components/ui";

// Inline price editor for one product: type the new price in ₹, or a % change
// (e.g. -20 for 20% lower). Lives inside the bulk-actions <form>, so it saves by
// calling the server action directly and never submits that form.
export function QuickPrice({ id, title, price, mrp }: { id: string; title: string; price: number; mrp: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rupees, setRupees] = useState("");
  const [pct, setPct] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRupees(String(price));
      setPct("");
      setError(null);
      setTimeout(() => input.current?.select(), 0);
    }
  }, [open, price]);

  const next = Number(rupees);
  const valid = rupees !== "" && Number.isInteger(next) && next >= 1;
  const change = valid ? Math.round(((next - price) / price) * 100) : 0;

  const fromPct = (v: string) => {
    setPct(v);
    const n = Number(v);
    if (v.trim() !== "" && v !== "-" && Number.isFinite(n)) setRupees(String(Math.max(1, Math.round(price * (1 + n / 100)))));
  };

  const save = () => {
    if (!valid) return setError("Enter a whole rupee amount of ₹1 or more.");
    if (mrp !== null && next > mrp) return setError(`Can’t be above the MRP (₹${mrp}).`);
    start(async () => {
      const r = await setProductPriceAction(id, next);
      if (!r.ok) return setError(r.error);
      setOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    });
  };

  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} title="Change price" aria-label={`Change price of ${title}, now ${formatPrice(price)}`} className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-paper">
        <span className={saved ? "font-semibold text-leaf" : ""}>{formatPrice(price)}</span>
        <Pencil size={13} className="text-ink-soft group-hover:text-ink" aria-hidden />
      </button>
    );
  }

  return (
    <div role="group" aria-label={`New price for ${title}`} className="ml-auto w-60 space-y-2 rounded-xl bg-white p-3 text-left shadow-lg ring-1 ring-line" onKeyDown={keys}>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium">
          New price (₹)
          <input ref={input} value={rupees} onChange={(e) => { setRupees(e.target.value.replace(/[^\d]/g, "")); setPct(""); }} inputMode="numeric" className={`${field} mt-1 h-9`} />
        </label>
        <label className="text-xs font-medium">
          or change %
          <input value={pct} onChange={(e) => fromPct(e.target.value.replace(/[^\d.-]/g, ""))} placeholder="-20" inputMode="decimal" className={`${field} mt-1 h-9`} />
        </label>
      </div>
      <p className="text-xs text-ink-soft tabular-nums">
        {formatPrice(price)} → <b className="text-ink">{valid ? formatPrice(next) : "—"}</b>
        {valid && change !== 0 && <span className={change < 0 ? "text-leaf" : "text-amber-700"}> ({change > 0 ? "+" : ""}{change}%)</span>}
        {mrp !== null && <span className="block">MRP {formatPrice(mrp)}</span>}
      </p>
      {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={pending} className="h-9 flex-1 rounded-lg bg-leaf text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm font-medium ring-1 ring-line">Cancel</button>
      </div>
    </div>
  );
}
