"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { setProductPriceAction } from "@/app/admin/opsActions";
import { field } from "@/app/admin/_components/ui";

// Inline price and discount editor for one product. Type the selling price, or a
// discount: "% off MRP" when an MRP is set, otherwise a % change from today's price.
// Lives inside the bulk-actions <form>, so it saves by calling the server action
// directly and never submits that form.
export function QuickPrice({ id, title, price, mrp }: { id: string; title: string; price: number; mrp: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rupees, setRupees] = useState("");
  const [mrpIn, setMrpIn] = useState("");
  const [pct, setPct] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRupees(String(price));
      setMrpIn(mrp ? String(mrp) : "");
      setPct("");
      setError(null);
      setTimeout(() => input.current?.select(), 0);
    }
  }, [open, price, mrp]);

  const next = Number(rupees);
  const valid = rupees !== "" && Number.isInteger(next) && next >= 1;
  const m = mrpIn === "" ? null : Number(mrpIn);
  const mrpValid = m === null || (Number.isInteger(m) && m >= 1);
  const off = valid && m && m > next ? Math.round(((m - next) / m) * 100) : 0;
  const change = valid ? Math.round(((next - price) / price) * 100) : 0;

  // The % box means "% off MRP" when an MRP is set, else "% change from current price".
  const fromPct = (v: string) => {
    setPct(v);
    const n = Number(v);
    if (v.trim() === "" || v === "-" || !Number.isFinite(n)) return;
    if (m) setRupees(String(Math.max(1, Math.round(m * (1 - Math.abs(n) / 100)))));
    else setRupees(String(Math.max(1, Math.round(price * (1 + n / 100)))));
  };

  const save = () => {
    if (!valid) return setError("Enter a whole rupee amount of ₹1 or more.");
    if (!mrpValid) return setError("MRP must be a whole rupee amount, or blank.");
    if (m !== null && next > m) return setError(`Price can’t be above the MRP (₹${m}).`);
    start(async () => {
      const r = await setProductPriceAction(id, next, m);
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
      <button type="button" onClick={() => setOpen(true)} title="Change price or discount" aria-label={`Change price of ${title}, now ${formatPrice(price)}`} className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-paper">
        <span className={saved ? "font-semibold text-leaf" : ""}>{formatPrice(price)}</span>
        <Pencil size={13} className="text-ink-soft group-hover:text-ink" aria-hidden />
      </button>
    );
  }

  return (
    <div role="group" aria-label={`New price for ${title}`} className="ml-auto w-72 space-y-2 rounded-xl bg-white p-3 text-left shadow-lg ring-1 ring-line" onKeyDown={keys}>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium">
          Selling price (₹)
          <input ref={input} value={rupees} onChange={(e) => { setRupees(e.target.value.replace(/[^\d]/g, "")); setPct(""); }} inputMode="numeric" className={`${field} mt-1 h-9`} />
        </label>
        <label className="text-xs font-medium">
          {m ? "% off MRP" : "or change %"}
          <input value={pct} onChange={(e) => fromPct(e.target.value.replace(/[^\d.-]/g, ""))} placeholder={m ? "20" : "-20"} inputMode="decimal" className={`${field} mt-1 h-9`} />
        </label>
        <label className="col-span-2 text-xs font-medium">
          MRP (₹) <span className="font-normal text-ink-soft">— only if printed on the pack; blank for none</span>
          <input value={mrpIn} onChange={(e) => { setMrpIn(e.target.value.replace(/[^\d]/g, "")); setPct(""); }} inputMode="numeric" className={`${field} mt-1 h-9`} />
        </label>
      </div>
      <p className="text-xs text-ink-soft tabular-nums">
        {formatPrice(price)} → <b className="text-ink">{valid ? formatPrice(next) : "—"}</b>
        {valid && change !== 0 && <span className={change < 0 ? "text-leaf" : "text-amber-700"}> ({change > 0 ? "+" : ""}{change}%)</span>}
        <span className="block">
          {valid && m && m > next ? <>Shoppers see <s>{formatPrice(m)}</s> <b className="text-ink">{formatPrice(next)}</b> · {off}% off</> : "No discount shown (no MRP above the price)."}
        </span>
      </p>
      {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={pending} className="h-9 flex-1 rounded-lg bg-leaf text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm font-medium ring-1 ring-line">Cancel</button>
      </div>
    </div>
  );
}
