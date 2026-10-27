"use client";

import { useActionState } from "react";
import { changePasswordAction, mfaConfirmAction, mfaDisableAction, mfaStartAction } from "@/app/admin/staffActions";
import { btn, field, label } from "@/app/admin/_components/ui";

export function ChangePassword() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <div><label className={label} htmlFor="cur">Current password</label><input id="cur" name="current" type="password" autoComplete="current-password" required className={field} /></div>
      <div><label className={label} htmlFor="np">New password</label><input id="np" name="next" type="password" autoComplete="new-password" minLength={10} required className={field} /></div>
      <div><label className={label} htmlFor="cp">Confirm new password</label><input id="cp" name="confirm" type="password" autoComplete="new-password" required className={field} /></div>
      <p className="text-xs text-ink-soft sm:col-span-3">At least 10 characters. Changing it signs you out everywhere, including here.</p>
      {state?.error && <p role="alert" className="text-sm text-danger sm:col-span-3">{state.error}</p>}
      <div><button disabled={pending} className={btn.primary}>{pending ? "Saving…" : "Change password"}</button></div>
    </form>
  );
}

export function MfaSetup({ enabled, pending }: { enabled: boolean; pending: { secret: string; uri: string } | null }) {
  const [startState, start, starting] = useActionState(mfaStartAction, null);
  const [confirmState, confirm, confirming] = useActionState(mfaConfirmAction, null);
  const [offState, off, turningOff] = useActionState(mfaDisableAction, null);
  if (enabled && !offState?.ok) {
    return (
      <form action={off} className="flex flex-wrap items-end gap-2">
        {confirmState?.ok && <p role="status" className="w-full rounded-lg bg-leaf-soft px-3 py-2 text-sm text-leaf">{confirmState.message}</p>}
        <p className="w-full text-sm">You’ll be asked for a code from your authenticator app each time you sign in.</p>
        <div><label className={label} htmlFor="mp">Password to turn off</label><input id="mp" name="password" type="password" required className={field} /></div>
        <button disabled={turningOff} className={btn.danger}>Turn off</button>
        {offState?.error && <p role="alert" className="w-full text-sm text-danger">{offState.error}</p>}
      </form>
    );
  }
  const secret = offState?.ok ? undefined : startState?.secret ?? pending?.secret;
  if (confirmState?.ok && !offState?.ok) return <p className="text-sm text-leaf">{confirmState.message}</p>;
  if (!secret) {
    return (
      <form action={start}>
        {offState?.ok && <p role="status" className="mb-3 rounded-lg bg-leaf-soft px-3 py-2 text-sm text-leaf">{offState.message}</p>}
        <p className="mb-3 text-sm">Use an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, etc.) for a 6-digit code at sign-in.</p>
        <button disabled={starting} className={btn.primary}>Set up two-step sign-in</button>
      </form>
    );
  }
  const uri = `otpauth://totp/Krip%20Admin?secret=${secret}&issuer=Krip%20Admin&digits=6&period=30`;
  return (
    <form action={confirm} className="space-y-3">
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        <li>In your authenticator app, add an account and choose “enter a setup key”.</li>
        <li>Enter this key (time-based): <code className="select-all break-all rounded bg-paper px-2 py-1 font-mono text-sm font-semibold tracking-wider">{secret.replace(/(.{4})/g, "$1 ").trim()}</code></li>
        <li>On a phone, you can also <a href={pending?.uri ?? uri} className="text-leaf underline">open it in your app</a>.</li>
        <li>Enter the 6-digit code it shows.</li>
      </ol>
      <div className="flex flex-wrap items-end gap-2">
        <div><label className={label} htmlFor="mc">Code</label><input id="mc" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required className={`${field} w-36 tracking-[0.3em]`} /></div>
        <button disabled={confirming} className={btn.primary}>Verify and turn on</button>
      </div>
      {confirmState?.error && <p role="alert" className="text-sm text-danger">{confirmState.error}</p>}
    </form>
  );
}
