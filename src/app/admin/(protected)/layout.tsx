import { requireStaff } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { navFor } from "@/lib/adminNav";
import { AdminShell, type AdminNotification } from "../_components/AdminShell";
import { formatPrice } from "@/lib/format";
import { workQueue } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Admin", template: "%s · Krip Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStaff();
  const db = await readDb();
  const seen = ctx.staff.notificationsSeenAt ? Date.parse(ctx.staff.notificationsSeenAt) : 0;
  const week = Date.now() - 7 * 86_400_000;
  const n: Omit<AdminNotification, "unread">[] = [];

  // Notifications are derived from live data, so they can't go stale or be missed.
  if (ctx.can("orders.view")) {
    for (const o of db.orders.filter((x) => (x.status === "placed" || x.status === "confirmed") && Date.parse(x.createdAt) > week).slice(-8)) {
      n.push({ id: `new-${o.id}`, title: `New order ${o.id}`, detail: `${o.address.name} · ${formatPrice(o.total)} · ${o.paymentMethod === "cod" ? "COD" : "Online"}`, href: `/admin/orders/${o.id}`, at: o.createdAt, tone: "info" });
    }
    for (const o of db.orders.filter((x) => x.status === "payment_failed" && Date.parse(x.createdAt) > week).slice(-5)) {
      n.push({ id: `fail-${o.id}`, title: `Payment failed: ${o.id}`, detail: `${formatPrice(o.total)} · stock released`, href: `/admin/orders/${o.id}`, at: o.statusHistory.at(-1)?.at ?? o.createdAt, tone: "warn" });
    }
    const q = workQueue(db.orders);
    if (q.pendingRefunds) n.push({ id: "refunds", title: `${q.pendingRefunds} refund(s) due`, detail: "Cancelled orders with money received", href: "/admin/orders?pay=refund_due", at: new Date().toISOString(), tone: "danger" });
    if (q.needsReview) n.push({ id: "review", title: `${q.needsReview} order(s) flagged for review`, detail: "Late or mismatched payment events", href: "/admin/orders?flag=review", at: new Date().toISOString(), tone: "danger" });
  }
  if (ctx.can("inventory.view")) {
    const t = db.store.lowStockThreshold;
    const low = db.products.filter((p) => p.status === "active").flatMap((p) => p.variants).filter((v) => v.stock <= t);
    if (low.length) n.push({ id: `low-${low.length}`, title: `${low.length} variant(s) at or below ${t} units`, detail: "Active products running low", href: "/admin/inventory?filter=low", at: new Date(Math.floor(Date.now() / 86_400_000) * 86_400_000).toISOString(), tone: "warn" });
  }
  if (ctx.can("staff.view")) {
    const fails = db.loginEvents.filter((e) => e.outcome !== "success" && Date.parse(e.at) > Date.now() - 86_400_000);
    if (fails.length >= 5) n.push({ id: `sec-${fails.length}`, title: `${fails.length} failed sign-ins in 24 hours`, detail: "Check the sign-in history", href: "/admin/staff?tab=logins", at: fails.at(-1)!.at, tone: "danger" });
  }
  if (ctx.role.privileged && !ctx.staff.mfaSecret) {
    n.push({ id: "mfa", title: "Turn on two-step sign-in", detail: `${ctx.role.name} accounts should use an authenticator app`, href: "/admin/security", at: ctx.staff.createdAt, tone: "warn" });
  }
  const notifications = n.sort((a, b) => b.at.localeCompare(a.at)).map((x) => ({ ...x, unread: Date.parse(x.at) > seen || x.id === "mfa" }));

  return (
    <AdminShell
      nav={navFor(ctx.can)}
      staff={{ name: ctx.staff.name, email: ctx.staff.email, role: ctx.role.name, mfa: !!ctx.staff.mfaSecret }}
      notifications={notifications}
    >
      {children}
    </AdminShell>
  );
}
