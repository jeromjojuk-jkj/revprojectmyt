import { promises as fs } from "node:fs";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { requirePerm, adminPasswordStatus } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { paymentConfig } from "@/lib/server/payments";
import { verifyAuditChain } from "@/lib/server/audit";
import { Card, PageHeader } from "@/app/admin/_components/ui";

export const metadata = { title: "System health" };

type Status = "ok" | "warn" | "fail";

export default async function SystemHealth() {
  const ctx = await requirePerm("system.view");
  const t0 = performance.now();
  const db = await readDb();
  const readMs = Math.round((performance.now() - t0) * 10) / 10;
  const size = Buffer.byteLength(JSON.stringify(db));
  const pay = paymentConfig();
  const auth = adminPasswordStatus();
  const prod = process.env.NODE_ENV === "production";
  const now = Date.now();
  const stale = db.orders.filter((o) => o.status === "payment_pending" && o.reservationExpiresAt && Date.parse(o.reservationExpiresAt) < now).length;
  const negative = db.products.flatMap((p) => p.variants).filter((v) => v.stock < 0).length;
  let writable = true;
  try {
    await fs.access(process.env.KRIP_DATA_DIR || ".data");
  } catch {
    writable = false;
  }

  const checks: { area: string; status: Status; text: string }[] = [
    { area: "Datastore", status: process.env.VERCEL ? "fail" : "warn", text: `Local JSON file (${(size / 1024).toFixed(0)} KB, read in ${readMs} ms). Safe for one server process only${process.env.VERCEL ? "; on Vercel it is temporary and resets — do not take real orders" : ""}. Move to PostgreSQL before scaling out.` },
    { area: "Data directory", status: writable || process.env.VERCEL ? "ok" : "warn", text: writable ? "Present and readable." : "Not created yet (created on first write)." },
    { area: "Session secret", status: (process.env.SESSION_SECRET?.length ?? 0) >= 16 ? "ok" : prod ? "fail" : "warn", text: (process.env.SESSION_SECRET?.length ?? 0) >= 16 ? "Set from the environment." : "Not set — using a development fallback." },
    { area: "Owner sign-in", status: auth.usingDevDefault ? (prod ? "fail" : "warn") : "ok", text: auth.usingDevDefault ? "Development owner password is active." : "Bootstrap owner comes from ADMIN_EMAIL / ADMIN_PASSWORD." },
    { area: "Payments", status: pay.demo ? "warn" : pay.onlineEnabled ? "ok" : "warn", text: pay.note },
    { area: "Payment webhooks", status: "ok", text: `HMAC-signed and idempotent. ${db.processedPaymentEvents.length} events processed.` },
    { area: "Stock reservations", status: stale ? "warn" : "ok", text: stale ? `${stale} expired reservation(s) waiting to be released (released on the next checkout or admin order action).` : "No expired reservations pending." },
    { area: "Stock integrity", status: negative ? "fail" : "ok", text: negative ? `${negative} variant(s) with negative stock.` : "No negative stock." },
    { area: "Audit trail", status: verifyAuditChain(db.audit) === null ? "ok" : "fail", text: `${db.audit.length} entries, hash chain ${verifyAuditChain(db.audit) === null ? "intact" : "BROKEN"}.` },
    { area: "Two-step sign-in", status: db.staff.filter((s) => s.active && s.roleId === "super_admin" && !s.mfaSecret).length ? "warn" : "ok", text: `${db.staff.filter((s) => s.active && s.mfaSecret).length} of ${db.staff.filter((s) => s.active).length} active staff use it.` },
    { area: "Email / SMS / WhatsApp", status: "warn", text: "Not connected. Invites and resets use one-time links shared by a Super Admin; no customer messages are sent." },
    { area: "Courier", status: "warn", text: "Not connected. Shipments and AWB numbers are recorded manually." },
    { area: "Backups", status: "warn", text: "No automated backups. Copy the data directory (db.json) on a schedule, or move to a managed database with point-in-time recovery." },
  ];
  const Icon = { ok: CheckCircle2, warn: AlertTriangle, fail: XCircle };
  const tone = { ok: "text-leaf", warn: "text-amber-600", fail: "text-danger" };
  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title="System health" description={`Checked just now · Node ${process.version} · ${prod ? "production" : "development"} build`} />
      <Card>
        <ul className="divide-y divide-line">
          {checks.map((c) => {
            const I = Icon[c.status];
            return (
              <li key={c.area} className="flex gap-3 py-3">
                <I size={20} className={`mt-0.5 shrink-0 ${tone[c.status]}`} aria-label={c.status} />
                <div><p className="font-semibold">{c.area}</p><p className="text-sm text-ink-soft">{c.text}</p></div>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card title="Record counts">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[["Products", db.products.length], ["Orders", db.orders.length], ["Stock movements", db.movements.length], ["Audit entries", db.audit.length], ["Staff", db.staff.length], ["Active sessions", db.sessions.filter((s) => !s.revokedAt && Date.parse(s.expiresAt) > now).length], ["Sign-in events", db.loginEvents.length], ["Coupons", db.settings.coupons.length]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-paper p-3"><dt className="text-xs text-ink-soft">{k}</dt><dd className="text-lg font-bold tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </Card>
      {!ctx.can("system.manage") && <p className="text-xs text-ink-soft">Read-only view.</p>}
    </div>
  );
}
