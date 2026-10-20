"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="mt-4 space-y-3">
      <label htmlFor="password" className="text-sm font-medium">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required
        className="h-12 w-full rounded-xl border-2 border-line bg-white px-3 outline-none focus:border-leaf" />
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
