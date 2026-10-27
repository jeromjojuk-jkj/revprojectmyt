import Link from "next/link";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { ACTIONS, BUILT_IN_ROLES, MODULE_ACTIONS, MODULES, isPermission, type ModuleId, type Permission, type RoleDef } from "@/lib/rbac";
import { Badge, Card, Notice, PageHeader, btn } from "@/app/admin/_components/ui";
import { deleteRoleAction } from "@/app/admin/staffActions";
import { RoleEditor } from "./RoleEditor";

export const metadata = { title: "Roles" };

export default async function Roles({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string }> }) {
  const ctx = await requirePerm("staff.view");
  const sp = await searchParams;
  const db = await readDb();
  const custom: RoleDef[] = db.roles.map((r) => ({ ...r, permissions: r.permissions.filter(isPermission) as Permission[], builtIn: false }));
  const roles = [...BUILT_IN_ROLES, ...custom];
  const editing = sp.edit === "new" ? null : custom.find((r) => r.id === sp.edit);
  const count = (id: string) => db.staff.filter((s) => s.roleId === id).length;
  return (
    <div className="space-y-4">
      <PageHeader title="Roles & permissions" description="Built-in roles cover common jobs. Custom roles can only include permissions you hold yourself." actions={<><Link href="/admin/staff" className={btn.secondary}>← Staff</Link>{ctx.can("staff.manage") && <Link href="/admin/staff/roles?edit=new" className={btn.primary}>New custom role</Link>}</>} />
      {sp.saved && <Notice tone="green">Role saved. Anyone with this role was signed out so the change takes effect immediately.</Notice>}
      {ctx.can("staff.manage") && (sp.edit === "new" || editing) && (
        <Card title={editing ? `Edit ${editing.name}` : "New custom role"}>
          <RoleEditor role={editing ? { id: editing.id, name: editing.name, description: editing.description, permissions: editing.permissions } : null} allowed={ctx.role.permissions} />
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {roles.map((r) => (
          <details key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold">{r.name}</p><p className="text-xs text-ink-soft">{r.description}</p></div>
                <div className="flex shrink-0 gap-1">{r.builtIn ? <Badge>Built-in</Badge> : <Badge tone="blue">Custom</Badge>}<Badge tone="neutral">{count(r.id)} staff</Badge></div>
              </div>
            </summary>
            <ul className="mt-3 space-y-1 text-xs">
              {(Object.keys(MODULES) as ModuleId[]).map((m) => {
                const has = MODULE_ACTIONS[m].filter((a) => r.permissions.includes(`${m}.${a}` as Permission));
                return has.length ? <li key={m}><b>{MODULES[m]}:</b> {has.map((a) => ACTIONS[a]).join(", ")}</li> : null;
              })}
            </ul>
            {!r.builtIn && ctx.can("staff.manage") && (
              <div className="mt-3 flex gap-2">
                <Link href={`/admin/staff/roles?edit=${r.id}`} className="flex h-9 items-center rounded-lg px-3 text-xs font-semibold ring-1 ring-line">Edit</Link>
                {count(r.id) === 0 && <form action={deleteRoleAction}><input type="hidden" name="id" value={r.id} /><button className="h-9 rounded-lg px-3 text-xs font-semibold text-danger ring-1 ring-danger/30">Delete</button></form>}
              </div>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
