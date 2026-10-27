import { requireStaff } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { formatDate } from "@/lib/format";
import { otpauthUri } from "@/lib/totp";
import { Badge, Card, PageHeader } from "@/app/admin/_components/ui";
import { revokeSessionAction } from "@/app/admin/staffActions";
import { ChangePassword, MfaSetup } from "./SecurityForms";

export const metadata = { title: "Security" };

const dt = (iso: string) => formatDate(iso, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function Security() {
  const ctx = await requireStaff();
  const db = await readDb();
  const me = db.staff.find((s) => s.id === ctx.staff.id)!;
  const sessions = db.sessions.filter((s) => s.staffId === me.id && !s.revokedAt && Date.parse(s.expiresAt) > Date.now());
  const logins = db.loginEvents.filter((e) => e.staffId === me.id).slice(-15).reverse();
  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title="Security & sessions" description={`${me.name} · ${me.email} · ${ctx.role.name}`} />
      <Card title={<span className="flex items-center gap-2">Two-step sign-in {me.mfaSecret ? <Badge tone="green">On</Badge> : <Badge tone={ctx.role.privileged ? "red" : "neutral"}>Off</Badge>}</span>}>
        {!me.mfaSecret && ctx.role.privileged && <p className="mb-3 text-sm text-danger">Your role can change money, staff or system settings. Turn this on.</p>}
        <MfaSetup enabled={!!me.mfaSecret} pending={me.mfaPending ? { secret: me.mfaPending, uri: otpauthUri(me.mfaPending, me.email) } : null} />
      </Card>
      <Card title="Change password"><ChangePassword /></Card>
      <Card title={`Active sessions (${sessions.length})`} actions={sessions.length > 1 && <form action={revokeSessionAction}><input type="hidden" name="session" value="others" /><button className="h-9 rounded-lg px-3 text-xs font-semibold text-danger ring-1 ring-danger/30">End all other sessions</button></form>}>
        <ul className="divide-y divide-line">
          {sessions.map((s) => (
            <li key={s.idHash} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <span className="min-w-0"><span className="block truncate">{s.userAgent || "Unknown device"}</span><span className="text-xs text-ink-soft">{s.ip} · signed in {dt(s.createdAt)} · last active {dt(s.lastSeenAt)}</span></span>
              {s.idHash === ctx.sessionHash ? <Badge tone="green">This device</Badge> : <form action={revokeSessionAction}><input type="hidden" name="session" value={s.idHash.slice(0, 12)} /><button className="h-9 rounded-lg px-3 text-xs font-semibold ring-1 ring-line">End session</button></form>}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-soft">Sessions last 8 hours and end after 2 hours without activity.</p>
      </Card>
      <Card title="Your recent sign-ins">
        <ul className="space-y-1 text-sm">
          {logins.map((e, i) => <li key={i} className="flex justify-between gap-2"><span>{dt(e.at)} · <span className="text-ink-soft">{e.ip}</span></span><Badge tone={e.outcome === "success" ? "green" : "red"}>{e.outcome.replace(/_/g, " ")}</Badge></li>)}
        </ul>
      </Card>
    </div>
  );
}
