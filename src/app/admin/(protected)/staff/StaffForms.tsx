"use client";

import { useActionState, useEffect, useState } from "react";
import { createStaffAction, updateStaffAction, type FormState } from "@/app/admin/staffActions";
import { btn, field, label } from "@/app/admin/_components/ui";

function OneTimeLink({ state }: { state: FormState }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  if (!state) return null;
  if (state.error) return <p role="alert" className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>;
  return (
    <div className="mt-2 rounded-lg bg-leaf-soft px-3 py-2 text-sm text-leaf">
      <p>{state.message}</p>
      {state.link && (
        <div className="mt-2 flex gap-2">
          <input readOnly value={origin + state.link} aria-label="One-time link" className={`${field} font-mono text-xs text-ink`} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className={btn.secondary} onClick={() => navigator.clipboard?.writeText(origin + state.link)}>Copy</button>
        </div>
      )}
    </div>
  );
}

export function InviteStaff({ roles }: { roles: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createStaffAction, null);
  return (
    <form action={action}>
      <div className="grid gap-3 sm:grid-cols-4">
        <div><label className={label} htmlFor="sn">Name</label><input id="sn" name="name" required className={field} /></div>
        <div className="sm:col-span-2"><label className={label} htmlFor="se">Work email</label><input id="se" name="email" type="email" required className={field} /></div>
        <div><label className={label} htmlFor="sr">Role</label><select id="sr" name="roleId" className={field}>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
      </div>
      <button disabled={pending} className={`${btn.primary} mt-3`}>{pending ? "Creating…" : "Create invite link"}</button>
      <OneTimeLink state={state} />
    </form>
  );
}

export function StaffRowActions({ id, roleId, roles, active, locked, mfa, self }: { id: string; roleId: string; roles: { id: string; name: string }[]; active: boolean; locked: boolean; mfa: boolean; self: boolean }) {
  const [state, action, pending] = useActionState(updateStaffAction, null);
  const small = "h-8 rounded-lg px-2.5 text-xs font-semibold ring-1 ring-line hover:bg-paper disabled:opacity-50";
  const op = (name: string, text: string, danger = false) => (
    <button name="op" value={name} disabled={pending} className={`${small} ${danger ? "text-danger" : ""}`}>{text}</button>
  );
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-1">
        <label className="sr-only" htmlFor={`role-${id}`}>Role</label>
        <select id={`role-${id}`} name="roleId" defaultValue={roleId} className={`${field} h-8 w-auto text-xs`}>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        {op("role", "Change role")}
      </div>
      <div className="flex flex-wrap gap-1">
        {op("reset", "Reset link")}
        {op("revoke", "Sign out everywhere")}
        {locked && op("unlock", "Unlock")}
        {mfa && op("reset_mfa", "Reset 2FA")}
        {!self && (active ? op("deactivate", "Deactivate", true) : op("activate", "Reactivate"))}
      </div>
      <OneTimeLink state={state} />
    </form>
  );
}
