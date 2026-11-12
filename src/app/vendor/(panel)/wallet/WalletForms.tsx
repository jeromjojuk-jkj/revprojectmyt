"use client";

import { useActionState } from "react";
import { cancelWithdrawalAction, requestWithdrawalAction } from "@/app/vendor/walletActions";

const input = "h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-lg outline-none focus:border-leaf";

export function WithdrawForm({ available, account }: { available: number; account: string }) {
  const [state, action, pending] = useActionState(requestWithdrawalAction, null);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="w-amt" className="mb-1 block text-sm font-medium">Amount to withdraw (₹)</label>
        <input id="w-amt" name="amount" inputMode="decimal" defaultValue={available || ""} className={input} />
        <p className="mt-1 text-xs text-ink-soft">Up to ₹{available.toLocaleString("en-IN")}. Sent to {account}.</p>
      </div>
      <input name="note" placeholder="Note for Krip (optional)" maxLength={200} className="h-11 w-full rounded-xl border-2 border-line bg-white px-3 outline-none focus:border-leaf" />
      {state?.error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm font-medium text-leaf">{state.ok}</p>}
      <button disabled={pending || available < 1} className="h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-50">{pending ? "Requesting…" : "Withdraw to bank"}</button>
    </form>
  );
}

export function CancelWithdrawal({ id }: { id: string }) {
  const [state, action, pending] = useActionState(cancelWithdrawalAction, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="text-sm text-danger underline disabled:opacity-50">Cancel request</button>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
