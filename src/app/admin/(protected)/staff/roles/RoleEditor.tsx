"use client";

import { useActionState } from "react";
import { saveRoleAction } from "@/app/admin/staffActions";
import { ACTIONS, MODULE_ACTIONS, MODULES, type ModuleId } from "@/lib/rbac";
import { btn, field, label } from "@/app/admin/_components/ui";

export function RoleEditor({ role, allowed }: { role: { id: string; name: string; description: string; permissions: string[] } | null; allowed: string[] }) {
  const [state, action, pending] = useActionState(saveRoleAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={role?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={label} htmlFor="rn">Role name</label><input id="rn" name="name" required defaultValue={role?.name} className={field} /></div>
        <div><label className={label} htmlFor="rd">Description</label><input id="rd" name="description" defaultValue={role?.description} className={field} /></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr><th className="py-2 text-left text-xs text-ink-soft">Module</th>{Object.values(ACTIONS).map((a) => <th key={a} className="px-1 py-2 text-center text-[11px] font-semibold text-ink-soft">{a}</th>)}</tr></thead>
          <tbody>
            {(Object.keys(MODULES) as ModuleId[]).map((m) => (
              <tr key={m} className="border-t border-line">
                <td className="py-2 pr-2">{MODULES[m]}</td>
                {(Object.keys(ACTIONS) as (keyof typeof ACTIONS)[]).map((a) => {
                  const p = `${m}.${a}`;
                  const applies = MODULE_ACTIONS[m].includes(a);
                  return (
                    <td key={a} className="text-center">
                      {applies ? <input type="checkbox" name="perm" value={p} aria-label={`${MODULES[m]}: ${ACTIONS[a]}`} defaultChecked={role?.permissions.includes(p)} disabled={!allowed.includes(p)} className="h-5 w-5" /> : <span className="text-ink-soft/40" aria-hidden>·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className={btn.primary}>{pending ? "Saving…" : "Save role"}</button>
    </form>
  );
}
