"use client";

import { useActionState } from "react";
import { customerNoteAction } from "@/app/admin/opsActions";
import { btn, field, label } from "@/app/admin/_components/ui";

export function CustomerNotes({ id, groups }: { id: string; groups: string }) {
  const [state, action, pending] = useActionState(customerNoteAction, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div><label className={label} htmlFor="cn">Add note (staff only)</label><textarea id="cn" name="note" rows={2} className={`${field} h-auto py-2`} /></div>
      <div><label className={label} htmlFor="cgp">Groups (comma separated, e.g. VIP, Wholesale)</label><input id="cgp" name="groups" defaultValue={groups} className={field} /></div>
      <button disabled={pending} className={btn.primary}>Save</button>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-leaf">{state.message}</p>}
    </form>
  );
}
