import { ShieldCheck, ShieldAlert } from "lucide-react";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { verifyAuditChain } from "@/lib/server/audit";
import { formatDate } from "@/lib/format";
import { Badge, Empty, PageHeader, Pagination, btn, field, label, paginate, td, th } from "@/app/admin/_components/ui";

export const metadata = { title: "Audit log" };

export default async function Audit({ searchParams }: { searchParams: Promise<{ q?: string; entity?: string; actor?: string; page?: string }> }) {
  await requirePerm("audit.view");
  const sp = await searchParams;
  const db = await readDb();
  const broken = verifyAuditChain(db.audit);
  const q = sp.q?.trim().toLowerCase();
  const list = db.audit.filter((a) => (!sp.entity || a.entityType === sp.entity) && (!sp.actor || a.actorId === sp.actor) && (!q || `${a.action} ${a.entityId} ${a.actorName}`.toLowerCase().includes(q))).reverse();
  const pg = paginate(list, sp.page, 50);
  const entities = [...new Set(db.audit.map((a) => a.entityType))].sort();
  return (
    <div>
      <PageHeader title="Audit log" description="Append-only record of staff and system actions: who, what, when, before and after. Passwords, tokens and secrets are never logged." />
      <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${broken === null ? "bg-leaf-soft text-leaf" : "bg-danger-soft text-danger"}`}>
        {broken === null ? <ShieldCheck size={18} aria-hidden /> : <ShieldAlert size={18} aria-hidden />}
        {broken === null ? `Integrity check passed: all ${db.audit.length} entries are hash-chained and unaltered.` : `Integrity check FAILED at entry #${broken}: an entry was edited or removed outside the app.`}
      </div>
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1"><label className={label} htmlFor="aq">Action, record ID or staff name</label><input id="aq" name="q" defaultValue={sp.q} className={field} /></div>
        <div><label className={label} htmlFor="ae">Record type</label><select id="ae" name="entity" defaultValue={sp.entity ?? ""} className={field}><option value="">All</option>{entities.map((e) => <option key={e}>{e}</option>)}</select></div>
        <div><label className={label} htmlFor="aa">Staff</label><select id="aa" name="actor" defaultValue={sp.actor ?? ""} className={field}><option value="">Anyone</option><option value="system">System</option>{db.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <button className={btn.dark}>Filter</button>
      </form>
      {pg.rows.length === 0 ? <Empty title="No entries">Actions appear here as staff use the admin.</Empty> : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-paper"><tr><th className={th}>#</th><th className={th}>When</th><th className={th}>Staff</th><th className={th}>Action</th><th className={th}>Record</th><th className={th}>Details</th></tr></thead>
            <tbody>
              {pg.rows.map((a) => (
                <tr key={a.seq} className="border-t border-line align-top">
                  <td className={`${td} tabular-nums text-xs text-ink-soft`}>{a.seq}</td>
                  <td className={`${td} whitespace-nowrap text-xs`}>{formatDate(a.at, { day: "numeric", month: "short", year: "2-digit", hour: "numeric", minute: "2-digit", second: "2-digit" })}</td>
                  <td className={td}>{a.actorName}</td>
                  <td className={td}><code className="text-xs font-semibold">{a.action}</code>{a.outcome !== "ok" && <Badge tone="red">{a.outcome}</Badge>}</td>
                  <td className={`${td} text-xs`}>{a.entityType}<span className="block max-w-[14rem] truncate font-mono">{a.entityId}</span></td>
                  <td className={td}>
                    {(a.before !== undefined || a.after !== undefined) ? (
                      <details className="text-xs"><summary className="cursor-pointer text-leaf">View change</summary>
                        <div className="mt-1 grid gap-2 md:grid-cols-2">
                          {a.before !== undefined && <pre className="max-h-48 overflow-auto rounded bg-paper p-2">{JSON.stringify(a.before, null, 1)}</pre>}
                          {a.after !== undefined && <pre className="max-h-48 overflow-auto rounded bg-leaf-soft/50 p-2">{JSON.stringify(a.after, null, 1)}</pre>}
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-ink-soft">req {a.requestId}</p>
                      </details>
                    ) : <span className="text-xs text-ink-soft">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination base="/admin/audit" params={sp as Record<string, string | undefined>} page={pg.page} pages={pg.pages} total={pg.total} />
    </div>
  );
}
