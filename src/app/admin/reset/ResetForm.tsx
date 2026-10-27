"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "../staffActions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  const input = "h-12 w-full rounded-xl border-2 border-line bg-white px-3 outline-none focus:border-leaf";
  return (
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-1">
        <label htmlFor="next" className="text-sm font-medium">New password</label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={10} required className={input} />
        <p className="text-xs text-ink-soft">At least 10 characters. A short sentence works well.</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={input} />
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Set password"}</button>
    </form>
  );
}
