"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { estimateContribution } from "@/lib/pricing";
import { quickCostsAction } from "@/app/admin/opsActions";
import { field } from "@/app/admin/_components/ui";

export interface FeeModel { marketplaceFeePct: number; paymentFeePct: number; fixedFee: number; returnAllowancePct: number }

// Inline editor for a product's private per-unit costs, with the estimated profit
// recalculated as you type. Saves through the server action, like QuickPrice.
export function QuickCosts({ id, title, price, cost, shipping, other, fees, contribution, margin }: {
  id: string; title: string; price: number; cost: number; shipping: number; other: number; fees: FeeModel; contribution: number | null; margin: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ purchaseCost: "", shippingCost: "", otherCost: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setV({ purchaseCost: String(cost), shippingCost: String(shipping), otherCost: String(other) });
      setError(null);
      setTimeout(() => input.current?.select(), 0);
    }
  }, [open, cost, shipping, other]);

  const n = { purchaseCost: Number(v.purchaseCost || 0), shippingCost: Number(v.shippingCost || 0), otherCost: Number(v.otherCost || 0) };
  const valid = Object.values(n).every((x) => Number.isFinite(x) && x >= 0);
  const est = valid ? estimateContribution({ sellingPrice: price, ...n, ...fees }) : null;

  const save = () => {
    if (!valid) return setError("Costs must be 0 or more.");
    start(async () => {
      const r = await quickCostsAction(id, n);
      if (!r.ok) return setError(r.error);
      setOpen(false);
      router.refresh();
    });
  };

  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  };
  const box = (k: keyof typeof v, label: string, ref?: React.Ref<HTMLInputElement>) => (
    <label className="text-xs font-medium">
      {label}
      <input ref={ref} value={v[k]} onChange={(e) => setV((s) => ({ ...s, [k]: e.target.value.replace(/[^\d.]/g, "") }))} inputMode="decimal" className={`${field} mt-1 h-9`} />
    </label>
  );

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} title="Edit costs" aria-label={`Edit costs of ${title}`} className="group inline-flex flex-col items-end rounded-lg px-2 py-1 text-right hover:bg-paper">
        <span className="inline-flex items-center gap-1.5">{formatPrice(cost + shipping + other)}<Pencil size={12} className="text-ink-soft group-hover:text-ink" aria-hidden /></span>
        {contribution !== null && <span className={contribution < 0 ? "font-semibold text-danger" : "text-ink-soft"}>{formatPrice(contribution)} ({margin}%)</span>}
      </button>
    );
  }

  return (
    <div role="group" aria-label={`Costs for ${title}`} className="ml-auto w-72 space-y-2 rounded-xl bg-white p-3 text-left text-sm shadow-lg ring-1 ring-line" onKeyDown={keys}>
      <p className="text-xs text-ink-soft">Per unit, private — only used for your profit estimates.</p>
      <div className="grid grid-cols-3 gap-2">
        {box("purchaseCost", "Buy cost ₹", input)}
        {box("shippingCost", "Shipping ₹")}
        {box("otherCost", "Other ₹")}
      </div>
      <p className="text-[11px] text-ink-soft">Other: packing, labels, inserts…</p>
      {est && (
        <p className="text-xs tabular-nums">
          Sells at {formatPrice(price)} → est. profit <b className={est.contribution < 0 ? "text-danger" : "text-leaf"}>{formatPrice(est.contribution)}</b> ({est.marginPct}%)
          <span className="block text-ink-soft">after fees {formatPrice(est.fees)} and returns allowance {formatPrice(est.returns)}</span>
        </p>
      )}
      {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={pending} className="h-9 flex-1 rounded-lg bg-leaf font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 font-medium ring-1 ring-line">Cancel</button>
      </div>
    </div>
  );
}
