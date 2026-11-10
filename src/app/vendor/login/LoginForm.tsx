"use client";

import { useActionState } from "react";
import { vendorLoginAction } from "../actions";

const input = "h-11 w-full rounded-xl border-2 border-line bg-white px-3 outline-none focus:border-leaf";

export function LoginForm() {
  const [state, action, pending] = useActionState(vendorLoginAction, null);
  return (
    <form action={action} className="mt-4 space-y-3">
      <div><label htmlFor="v-email" className="mb-1 block text-sm font-medium">Email</label><input id="v-email" name="email" type="email" autoComplete="username" defaultValue={state?.values?.email} className={input} /></div>
      <div><label htmlFor="v-pw" className="mb-1 block text-sm font-medium">Password</label><input id="v-pw" name="password" type="password" autoComplete="current-password" className={input} /></div>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="h-11 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
