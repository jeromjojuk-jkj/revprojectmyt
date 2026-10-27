"use client";

import { useActionState, useState } from "react";
import { loginAction } from "../actions";

export function LoginForm({ defaultEmail, next }: { defaultEmail: string; next: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const needCode = !!state?.needCode;
  const input = "h-12 w-full rounded-xl border-2 border-line bg-white px-3 outline-none focus:border-leaf";
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
      </div>
      {needCode && (
        <div className="space-y-1">
          <label htmlFor="code" className="text-sm font-medium">Authentication code</label>
          <input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" autoFocus required className={`${input} tracking-[0.4em]`} />
          <p className="text-xs text-ink-soft">The 6-digit code from your authenticator app.</p>
        </div>
      )}
      {state?.error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60">{pending ? "Signing in…" : needCode ? "Verify and sign in" : "Sign in"}</button>
    </form>
  );
}
