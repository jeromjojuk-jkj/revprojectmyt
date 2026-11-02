"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { quickStockAction } from "@/app/admin/opsActions";
import { field } from "@/app/admin/_components/ui";

// Inline stock editor for a single-variant product: type the new quantity, or a
// number to add/remove (e.g. 20 or -3). Like QuickPrice, it saves by calling the
// server action directly so the surrounding bulk-actions form is never submitted.
export function QuickStock({ sku, title, stock, tone }: { sku: string; title: string; stock: number; tone: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [add, setAdd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQty(String(stock));
      setAdd("");
      setError(null);
      setTimeout(() => input.current?.select(), 0);
    }
  }, [open, stock]);

  const next = Number(qty);
  const valid = qty !== "" && Number.isInteger(next) && next >= 0;
  const delta = valid ? next - stock : 0;

  const fromAdd = (v: string) => {
    setAdd(v);
    const n = Number(v);
    if (v.trim() !== "" && v !== "-" && v !== "+" && Number.isInteger(n)) setQty(String(Math.max(0, stock + n)));
  };

  const save = () => {
    if (!valid) return setError("Enter a whole number, 0 or more.");
    if (delta === 0) return setOpen(false);
    // Typing "+20"/"-3" records received stock or a correction; typing the total records a stock count.
    const usedAdd = add.trim() !== "" && Number.isInteger(Number(add));
    start(async () => {
      const r = usedAdd ? await quickStockAction(sku, "add", delta) : await quickStockAction(sku, "set", next);
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
      <button type="button" onClick={() => setOpen(true)} title="Change stock" aria-label={`Change stock of ${title}, now ${stock}`} className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-paper">
        <span className={saved ? "font-semibold text-leaf" : tone}>{stock}</span>
        <Pencil size={13} className="text-ink-soft group-hover:text-ink" aria-hidden />
      </button>
    );
  }

  return (
    <div role="group" aria-label={`New stock for ${title}`} className="ml-auto w-60 space-y-2 rounded-xl bg-white p-3 text-left shadow-lg ring-1 ring-line" onKeyDown={keys}>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium">
          New quantity
          <input ref={input} value={qty} onChange={(e) => { setQty(e.target.value.replace(/[^\d]/g, "")); setAdd(""); }} inputMode="numeric" className={`${field} mt-1 h-9`} />
        </label>
        <label className="text-xs font-medium">
          or add / remove
          <input value={add} onChange={(e) => fromAdd(e.target.value.replace(/[^\d+-]/g, ""))} placeholder="+20 or -3" inputMode="numeric" className={`${field} mt-1 h-9`} />
        </label>
      </div>
      <p className="text-xs text-ink-soft tabular-nums">
        {stock} → <b className="text-ink">{valid ? next : "—"}</b>
        {valid && delta !== 0 && <span className={delta > 0 ? "text-leaf" : "text-amber-700"}> ({delta > 0 ? "+" : ""}{delta})</span>}
      </p>
      {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={pending} className="h-9 flex-1 rounded-lg bg-leaf text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm font-medium ring-1 ring-line">Cancel</button>
      </div>
    </div>
  );
}
