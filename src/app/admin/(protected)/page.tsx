import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/server/auth";
import { navFor } from "@/lib/adminNav";
import { readDb } from "@/lib/server/db";
import { formatDate, formatPrice } from "@/lib/format";
import { paymentConfig } from "@/lib/server/payments";
import { breakdowns, change, computeKpis, dailySeries, METRIC_DEFINITIONS, rangeForDays, workQueue } from "@/lib/metrics";
import { CATEGORY_NAME } from "@/lib/constants";
import { STATUS_LABEL } from "@/lib/orderflow";
import { orderEstimate } from "@/lib/server/estimates";
import { Badge, Card, PageHeader, btn } from "../_components/ui";
import { BarList, ColumnChart, Spark } from "../_components/charts";
import { resetDemoAction } from "../actions";

export const metadata = { title: "Dashboard" };

const RANGES = [7, 30, 90] as const;

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ days?: string; reset?: string }> }) {
  const ctx = await requireStaff();
  // Roles without the dashboard land on their first permitted module instead.
  if (!ctx.can("dashboard.view")) redirect(navFor(ctx.can)[0]?.items[0]?.href ?? "/admin/security");
  const sp = await searchParams;
  const days = RANGES.find((d) => String(d) === sp.days) ?? 30;
  const db = await readDb();
  const { current, previous } = rangeForDays(days);
  const k = computeKpis(db.orders, current);
  const p = computeKpis(db.orders, previous);
  const series = dailySeries(db.orders, current);
  const cat = new Map(db.products.map((x) => [x.id, x.category]));
  const b = breakdowns(db.orders, current, (id) => cat.get(id));
  const q = workQueue(db.orders);
  const t = db.store.lowStockThreshold;
  const active = db.products.filter((x) => x.status === "active");
  const low = active.flatMap((x) => x.variants.filter((v) => v.stock > 0 && v.stock <= t).map((v) => ({ x, v })));
  const oos = active.filter((x) => x.variants.every((v) => v.stock === 0)).length;
  const pay = paymentConfig();
  const recent = [...db.orders].sort((a, c) => c.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const live = db.orders.filter((o) => ["placed", "confirmed", "packed", "shipped", "delivered"].includes(o.status) && Date.parse(o.createdAt) >= current.from.getTime());
  const est = ctx.can("finance.view") ? live.reduce((s, o) => s + orderEstimate(o, db.products, db.settings).contribution, 0) : null;

  const kpi = (label: string, value: string, cur: number, prev: number, spark?: number[], invert = false) => {
    const c = change(cur, prev);
    const good = c !== null && (invert ? c < 0 : c > 0);
    return (
      <div className="group relative overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-line">
        <p className="flex items-center gap-1 text-xs font-medium text-ink-soft">
          {label}
          {METRIC_DEFINITIONS[label] && (
            <span className="relative">
              <Info size={12} aria-hidden className="cursor-help" />
              <span role="tooltip" className="pointer-events-none absolute left-0 top-5 z-10 hidden w-56 rounded-lg bg-ink p-2 text-[11px] font-normal text-white shadow-lg group-hover:block">{METRIC_DEFINITIONS[label]}</span>
            </span>
          )}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        <p className="mt-1 flex items-center gap-1 text-xs">
          {c === null ? <span className="text-ink-soft">No earlier data to compare</span> : (
            <>
              <span className={`inline-flex items-center gap-0.5 font-semibold ${good ? "text-leaf" : c === 0 ? "text-ink-soft" : "text-danger"}`}>
                {c >= 0 ? <ArrowUpRight size={14} aria-hidden /> : <ArrowDownRight size={14} aria-hidden />}{Math.abs(c)}%
              </span>
              <span className="text-ink-soft">vs previous {days} days</span>
            </>
          )}
        </p>
        {spark && <div className="mt-2"><Spark values={spark} /></div>}
      </div>
    );
  };

  const task = (label: string, n: number, href: string, tone: "green" | "yellow" | "red" = "yellow") => (
    <Link href={href} className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-paper">
      <span>{label}</span>
      <Badge tone={n ? tone : "neutral"}>{n}</Badge>
    </Link>
  );

  return (
    <div className="space-y-5">
      {sp.reset && <p className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Demo data reset to the sample catalogue.</p>}
      <PageHeader
        title={`Good ${new Date(Date.now() + 330 * 60_000).getUTCHours() < 12 ? "morning" : new Date(Date.now() + 330 * 60_000).getUTCHours() < 17 ? "afternoon" : "evening"}, ${ctx.staff.name.split(" ")[0]}`}
        description={`Store performance for the last ${days} days (IST), compared with the ${days} days before. All figures come from recorded orders.`}
        actions={
          <nav aria-label="Date range" className="flex rounded-lg bg-white p-1 ring-1 ring-line">
            {RANGES.map((d) => (
              <Link key={d} href={`/admin?days=${d}`} aria-current={d === days ? "page" : undefined} className={`flex h-8 items-center rounded-md px-3 text-sm font-medium ${d === days ? "bg-ink text-white" : "hover:bg-paper"}`}>{d}d</Link>
            ))}
          </nav>
        }
      />

      {(pay.demo || db.orders.some((o) => o.demo)) && (
        <p className="flex items-start gap-2 rounded-xl bg-sun-soft px-4 py-2.5 text-xs"><Info size={14} className="mt-0.5 shrink-0" aria-hidden /> Orders in this prototype are demo orders (demo gateway or COD with no courier connected). Figures are real calculations over that demo data.</p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi("Net sales", formatPrice(k.netSales), k.netSales, p.netSales, series.map((s) => s.sales))}
        {kpi("Orders", String(k.orders), k.orders, p.orders, series.map((s) => s.orders))}
        {kpi("Average order value", formatPrice(k.aov), k.aov, p.aov)}
        {kpi("Customers", String(k.customers), k.customers, p.customers)}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {[
          ["Gross sales", formatPrice(k.grossSales)],
          ["Discounts", formatPrice(k.discounts)],
          ["Refunds", formatPrice(k.refunds)],
          ["Shipping & COD fees", formatPrice(k.charges)],
          ["Total revenue", formatPrice(k.totalRevenue)],
          ["New customers", String(k.newCustomers)],
          ["Returning customers", String(k.returningCustomers)],
          ["Cancelled", String(k.cancelled)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-line" title={METRIC_DEFINITIONS[l]}>
            <p className="text-[11px] text-ink-soft">{l}</p>
            <p className="font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Net item sales by day" className="lg:col-span-2">
          <ColumnChart data={series.map((s) => ({ label: s.day, value: s.sales }))} valueLabel="Net item sales" money />
        </Card>
        <Card title="Needs attention">
          <div className="-mx-3">
            {task("Orders to confirm", q.toConfirm, "/admin/orders?status=placed")}
            {task("Orders to pack", q.toPack, "/admin/orders?status=confirmed")}
            {task("Orders to ship", q.toShip, "/admin/orders?status=packed")}
            {task("On hold", q.onHold, "/admin/orders?flag=hold")}
            {task("COD to collect", q.codToCollect, "/admin/orders?pay=cod_due&status=delivered")}
            {task("Refunds due", q.pendingRefunds, "/admin/orders?pay=refund_due", "red")}
            {task("Flagged for review", q.needsReview, "/admin/orders?flag=review", "red")}
            {task("Awaiting payment", q.pendingPayments, "/admin/orders?status=payment_pending", "green")}
            {task(`Low stock (≤ ${t})`, low.length, "/admin/inventory?filter=low")}
            {task("Active but sold out", oos, "/admin/inventory?filter=out")}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Sales by category"><BarList rows={b.byCategory.map(([c, v]) => [CATEGORY_NAME[c as keyof typeof CATEGORY_NAME] ?? c, v])} /></Card>
        <Card title="Sales by payment method"><BarList rows={b.byPayment} /></Card>
        <Card title="Sales by state"><BarList rows={b.byState} /></Card>
        <Card title="Order status (created in period)"><BarList rows={b.byStatus.map(([s, n]) => [STATUS_LABEL[s as keyof typeof STATUS_LABEL] ?? s, n])} money={false} /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-sm font-semibold text-leaf">All orders →</Link>}>
          {recent.length === 0 ? <p className="py-6 text-center text-sm text-ink-soft">No orders yet. Place one from the storefront to see it here.</p> : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-2 py-2.5 text-sm hover:text-leaf">
                    <span className="min-w-0"><span className="block font-semibold">{o.id}</span><span className="block truncate text-xs text-ink-soft">{o.address.name} · {formatDate(o.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></span>
                    <span className="text-right"><span className="block font-semibold tabular-nums">{formatPrice(o.total)}</span><Badge tone={o.status === "cancelled" || o.status === "payment_failed" ? "red" : o.status === "delivered" ? "green" : "neutral"}>{STATUS_LABEL[o.status]}</Badge></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Top products (units)">
          {b.topProducts.length === 0 ? <p className="py-6 text-center text-sm text-ink-soft">No sales in this period.</p> : (
            <ol className="divide-y divide-line">
              {b.topProducts.map((x, i) => (
                <li key={x.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper text-xs font-bold">{i + 1}</span><Link href={`/admin/products/${x.id}`} className="truncate hover:text-leaf">{x.title}</Link></span>
                  <span className="shrink-0 tabular-nums"><b>{x.units}</b> · {formatPrice(x.sales)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {est !== null && (
          <Card title="Estimated contribution (finance)">
            <p className="text-2xl font-bold tabular-nums">{formatPrice(est)} <span className="text-xs font-normal text-ink-soft">estimate · {live.length} live orders in period</span></p>
            <p className="mt-1 text-xs text-ink-soft">Revenue − purchase cost − shipping cost − payment/marketplace fees − return allowance, from the costs on each product. Not accounting profit: excludes overheads, GST settlement and actual returns.</p>
          </Card>
        )}
        <Card title="Not measured yet">
          <ul className="space-y-1 text-sm text-ink-soft">
            <li><b className="text-ink">Conversion rate</b> — no storefront analytics is connected, so visits aren’t counted.</li>
            <li><b className="text-ink">Return rate</b> — returns aren’t recorded in the system yet (see Roadmap).</li>
            <li><b className="text-ink">Tax split</b> — prices include GST and no tax rates are configured, so tax isn’t separated.</li>
          </ul>
        </Card>
      </div>

      {ctx.can("system.manage") && paymentConfig().demo && (
        <form action={resetDemoAction} className="pt-2">
          <button className={btn.danger}>Reset demo data (deletes all orders and product edits)</button>
        </form>
      )}
    </div>
  );
}
