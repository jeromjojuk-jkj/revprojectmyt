import Link from "next/link";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { BUILT_IN_ROLES, canGrant, findRole, isPermission, type Permission, type RoleDef } from "@/lib/rbac";
import { formatDate } from "@/lib/format";
import { Badge, Card, PageHeader, btn, td, th } from "@/app/admin/_components/ui";
import { InviteStaff, StaffRowActions } from "./StaffForms";

export const metadata = { title: "Staff & roles" };

const dt = (iso: string | null) => (iso ? formatDate(iso, { day: "numeric", month: "short", year: "2-digit", hour: "numeric", minute: "2-digit" }) : "—");

export default async function Staff({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await requirePerm("staff.view");
  const { tab } = await searchParams;
  const db = await readDb();
  const custom: RoleDef[] = db.roles.map((r) => ({ ...r, permissions: r.permissions.filter(isPermission) as Permission[], builtIn: false }));
  const roles = [...BUILT_IN_ROLES, ...custom];
  const grantable = roles.filter((r) => canGrant(ctx.role, r)).map((r) => ({ id: r.id, name: r.name }));
  const now = Date.now();
  const activeSessions = (id: string) => db.sessions.filter((s) => s.staffId === id && !s.revokedAt && Date.parse(s.expiresAt) > now).length;
  return (
    <div className="space-y-4">
      <PageHeader title="Staff & roles" description="Every staff member has their own sign-in and a role. Permissions are checked on the server for every page and action." actions={<Link href="/admin/staff/roles" className={btn.secondary}>Roles & permissions</Link>} />
      <nav aria-label="Staff sections" className="flex gap-1">
        {[["Team", undefined], ["Sign-in history", "logins"]].map(([l, t]) => (
          <Link key={l} href={t ? `/admin/staff?tab=${t}` : "/admin/staff"} aria-current={tab === t ? "page" : undefined} className={`flex h-9 items-center rounded-full px-4 text-sm font-medium ring-1 ${tab === t ? "bg-ink text-white ring-ink" : "bg-white ring-line"}`}>{l}</Link>
        ))}
      </nav>
      {tab === "logins" ? (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-paper"><tr><th className={th}>When</th><th className={th}>Email</th><th className={th}>Outcome</th><th className={th}>IP</th><th className={th}>Device</th></tr></thead>
            <tbody>
              {[...db.loginEvents].reverse().slice(0, 200).map((e, i) => (
                <tr key={i} className="border-t border-line">
                  <td className={`${td} whitespace-nowrap text-xs`}>{dt(e.at)}</td>
                  <td className={td}>{e.email}</td>
                  <td className={td}><Badge tone={e.outcome === "success" ? "green" : "red"}>{e.outcome.replace(/_/g, " ")}</Badge></td>
                  <td className={`${td} font-mono text-xs`}>{e.ip}</td>
                  <td className={`${td} max-w-xs truncate text-xs text-ink-soft`}>{e.userAgent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {ctx.can("staff.create") && <Card title="Invite a staff member"><InviteStaff roles={grantable} /></Card>}
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-paper"><tr><th className={th}>Name</th><th className={th}>Role</th><th className={th}>Status</th><th className={th}>Two-step</th><th className={th}>Last sign-in</th><th className={th}>Sessions</th>{ctx.can("staff.edit") && <th className={th}>Manage</th>}</tr></thead>
              <tbody>
                {db.staff.map((u) => {
                  const role = findRole(custom, u.roleId);
                  const locked = u.lockedUntil && Date.parse(u.lockedUntil) > now;
                  const manageable = !!role && canGrant(ctx.role, role);
                  return (
                    <tr key={u.id} className="border-t border-line align-top">
                      <td className={td}><p className="font-medium">{u.name} {u.id === ctx.staff.id && <span className="text-xs text-ink-soft">(you)</span>}</p><p className="text-xs text-ink-soft">{u.email}</p></td>
                      <td className={td}>{role?.name ?? u.roleId}{role?.privileged && <span className="block text-[11px] text-ink-soft">privileged</span>}</td>
                      <td className={td}>{!u.active ? <Badge tone="neutral">Deactivated</Badge> : locked ? <Badge tone="red">Locked</Badge> : u.resetTokenHash && !u.lastLoginAt ? <Badge tone="yellow">Invited</Badge> : <Badge tone="green">Active</Badge>}</td>
                      <td className={td}>{u.mfaSecret ? <Badge tone="green">On</Badge> : <Badge tone={role?.privileged ? "red" : "neutral"}>Off</Badge>}</td>
                      <td className={`${td} whitespace-nowrap text-xs`}>{dt(u.lastLoginAt)}</td>
                      <td className={`${td} tabular-nums`}>{activeSessions(u.id)}</td>
                      {ctx.can("staff.edit") && <td className={td}>{manageable ? <StaffRowActions id={u.id} roleId={u.roleId} roles={grantable} active={u.active} locked={!!locked} mfa={!!u.mfaSecret} self={u.id === ctx.staff.id} /> : <span className="text-xs text-ink-soft">Higher access than yours</span>}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
