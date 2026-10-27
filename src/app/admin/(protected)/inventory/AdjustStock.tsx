"use client";

import { useActionState, useState } from "react";
import { stockAdjustAction } from "@/app/admin/opsActions";
import { field } from "@/app/admin/_components/ui";

export function AdjustStock({ sku, current }: { sku: string; current: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(stockAdjustAction, null);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="h-9 rounded-lg px-3 text-xs font-semibold ring-1 ring-line hover:bg-paper">Adjust</button>;
  return (
    <form action={action} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="sku" value={sku} />
      <select name="mode" aria-label="Adjustment type" className={`${field} h-9 w-auto text-xs`}><option value="add">Add</option><option value="remove">Remove</option><option value="set">Set count to</option></select>
      <input name="qty" aria-label="Units" inputMode="numeric" required defaultValue={current} className={`${field} h-9 w-16 text-xs`} />
      <select name="reason" aria-label="Reason" className={`${field} h-9 w-auto text-xs`}>
        <option value="received">Received</option><option value="returned">Customer return</option><option value="damaged">Damaged</option>
        <option value="lost">Lost</option><option value="correction">Correction</option><option value="audit_count">Stock count</option>
      </select>
      <input name="ref" aria-label="Reference" placeholder="Ref (PO, note)" className={`${field} h-9 w-28 text-xs`} />
      <button disabled={pending} className="h-9 rounded-lg bg-leaf px-3 text-xs font-semibold text-white">Save</button>
      <button type="button" onClick={() => setOpen(false)} className="h-9 px-2 text-xs text-ink-soft">Cancel</button>
      {state?.error && <p role="alert" className="w-full text-xs text-danger">{state.error}</p>}
      {state?.ok && <p className="w-full text-xs text-leaf">{state.message}</p>}
    </form>
  );
}
