"use client";

import { useActionState } from "react";
import { changeVendorPasswordAction } from "../actions";

const input = "h-11 w-full rounded-xl border-2 border-line bg-white px-3 outline-none focus:border-leaf";

export function ChangePassword() {
  const [state, action, pending] = useActionState(changeVendorPasswordAction, null);
  return (
    <details className="rounded-2xl bg-white p-4 ring-1 ring-line">
      <summary className="cursor-pointer font-semibold">Change password</summary>
      <form action={action} className="mt-3 grid max-w-md gap-3">
        <div><label htmlFor="cp-cur" className="mb-1 block text-sm font-medium">Current password</label><input id="cp-cur" name="current" type="password" autoComplete="current-password" className={input} /></div>
        <div><label htmlFor="cp-new" className="mb-1 block text-sm font-medium">New password</label><input id="cp-new" name="next" type="password" autoComplete="new-password" className={input} /><p className="mt-1 text-xs text-ink-soft">At least 10 characters.</p></div>
        <div><label htmlFor="cp-new2" className="mb-1 block text-sm font-medium">Confirm new password</label><input id="cp-new2" name="next2" type="password" autoComplete="new-password" className={input} /></div>
        {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        {state?.ok && <p role="status" className="text-sm font-medium text-leaf">{state.ok}</p>}
        <button disabled={pending} className="h-11 rounded-xl bg-ink px-5 font-semibold text-white disabled:opacity-60 sm:w-fit">{pending ? "Saving…" : "Change password"}</button>
      </form>
    </details>
  );
}
