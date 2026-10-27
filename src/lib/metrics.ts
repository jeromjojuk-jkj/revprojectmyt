import type { CategoryId, Order } from "./types.ts";
import { BOOKED, paidAmount, refundedAmount } from "./orderflow.ts";

// Dashboard metrics. Every figure is computed from stored orders using the
// formulas in METRIC_DEFINITIONS; nothing is estimated or invented. Krip
// prices include GST, and no tax rates are configured, so tax isn't split out.

export const METRIC_DEFINITIONS: Record<string, string> = {
  "Gross sales": "Item price × quantity for booked orders (placed, paid or COD) created in the period, excluding cancelled orders. GST-inclusive.",
  Discounts: "Coupon discounts on those orders.",
  "Shipping & COD fees": "Delivery and COD fees charged on those orders.",
  Refunds: "Refunds recorded in the period, whatever the order date.",
  "Net sales": "Gross sales − discounts − refunds.",
  "Total revenue": "Net sales + shipping & COD fees.",
  Orders: "Booked orders created in the period, excluding cancelled ones.",
  "Average order value": "(Gross sales − discounts + shipping & COD fees) ÷ orders.",
  Customers: "Distinct phone numbers with a booked order in the period.",
  "New customers": "Customers whose first-ever booked order falls in the period.",
  "Returning customers": "Customers in the period who had a booked order before it.",
  "Pending payments": "Online orders awaiting a verified payment event right now.",
  "Pending refunds": "Cancelled orders where money was received and not fully refunded.",
};

export interface Range {
  from: Date;
  to: Date;
}

export const IST_OFFSET = 330 * 60_000;
export const istDay = (iso: string | Date) => new Date(new Date(iso).getTime() + IST_OFFSET).toISOString().slice(0, 10);

/** Builds [from, to) for the last `days` IST days ending today, plus the previous period of equal length. */
export function rangeForDays(days: number, now = new Date()): { current: Range; previous: Range } {
  const todayStartIst = Date.parse(istDay(now) + "T00:00:00Z") - IST_OFFSET;
  const to = new Date(todayStartIst + 86_400_000);
  const from = new Date(to.getTime() - days * 86_400_000);
  return { current: { from, to }, previous: { from: new Date(from.getTime() - days * 86_400_000), to: from } };
}

const inRange = (iso: string, r: Range) => {
  const t = Date.parse(iso);
  return t >= r.from.getTime() && t < r.to.getTime();
};

const phoneKey = (o: Order) => o.address.phone.replace(/\D/g, "").slice(-10);

export interface Kpis {
  grossSales: number;
  discounts: number;
  charges: number;
  refunds: number;
  netSales: number;
  totalRevenue: number;
  orders: number;
  aov: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  cancelled: number;
  online: number;
  cod: number;
}

export function computeKpis(orders: Order[], r: Range): Kpis {
  const booked = orders.filter((o) => BOOKED(o.status) && inRange(o.createdAt, r));
  const live = booked.filter((o) => o.status !== "cancelled");
  const grossSales = live.reduce((s, o) => s + o.subtotal, 0);
  const discounts = live.reduce((s, o) => s + o.discount, 0);
  const charges = live.reduce((s, o) => s + o.delivery + o.codFee, 0);
  const refunds = orders.flatMap((o) => o.refunds ?? []).filter((x) => inRange(x.at, r)).reduce((s, x) => s + x.amount, 0);
  const firstOrder = new Map<string, number>();
  for (const o of orders) {
    if (!BOOKED(o.status)) continue;
    const t = Date.parse(o.createdAt);
    const k = phoneKey(o);
    if (!firstOrder.has(k) || t < firstOrder.get(k)!) firstOrder.set(k, t);
  }
  const custs = new Set(live.map(phoneKey));
  let newCustomers = 0;
  for (const k of custs) if ((firstOrder.get(k) ?? 0) >= r.from.getTime()) newCustomers++;
  const netSales = grossSales - discounts - refunds;
  return {
    grossSales,
    discounts,
    charges,
    refunds,
    netSales,
    totalRevenue: netSales + charges,
    orders: live.length,
    aov: live.length ? Math.round((grossSales - discounts + charges) / live.length) : 0,
    customers: custs.size,
    newCustomers,
    returningCustomers: custs.size - newCustomers,
    cancelled: booked.length - live.length,
    online: live.filter((o) => o.paymentMethod === "online").length,
    cod: live.filter((o) => o.paymentMethod === "cod").length,
  };
}

/** % change vs previous period, or null when there is nothing to compare against. */
export function change(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / Math.abs(prev)) * 1000) / 10;
}

export function dailySeries(orders: Order[], r: Range) {
  const days: { day: string; sales: number; orders: number }[] = [];
  for (let t = r.from.getTime(); t < r.to.getTime(); t += 86_400_000) days.push({ day: istDay(new Date(t)), sales: 0, orders: 0 });
  const idx = new Map(days.map((d, i) => [d.day, i]));
  for (const o of orders) {
    if (!BOOKED(o.status) || o.status === "cancelled" || !inRange(o.createdAt, r)) continue;
    const d = days[idx.get(istDay(o.createdAt)) ?? -1];
    if (!d) continue;
    d.sales += o.subtotal - o.discount;
    d.orders += 1;
  }
  return days;
}

export function breakdowns(orders: Order[], r: Range, categoryOf: (productId: string) => CategoryId | undefined) {
  const live = orders.filter((o) => BOOKED(o.status) && o.status !== "cancelled" && inRange(o.createdAt, r));
  const add = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);
  const byCategory = new Map<string, number>();
  const byPayment = new Map<string, number>();
  const byState = new Map<string, number>();
  const products = new Map<string, { title: string; units: number; sales: number }>();
  for (const o of live) {
    add(byPayment, o.paymentMethod === "cod" ? "Cash on Delivery" : o.demo ? "Online (demo)" : "Online", o.subtotal - o.discount);
    add(byState, o.address.state, o.subtotal - o.discount);
    for (const it of o.items) {
      add(byCategory, categoryOf(it.productId) ?? "unknown", it.unitPrice * it.qty);
      const p = products.get(it.productId) ?? { title: it.title, units: 0, sales: 0 };
      p.units += it.qty;
      p.sales += it.unitPrice * it.qty;
      products.set(it.productId, p);
    }
  }
  const statusCounts = new Map<string, number>();
  for (const o of orders.filter((x) => inRange(x.createdAt, r))) add(statusCounts, o.status, 1);
  const sorted = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
  return {
    byCategory: sorted(byCategory),
    byPayment: sorted(byPayment),
    byState: sorted(byState).slice(0, 8),
    byStatus: sorted(statusCounts),
    topProducts: [...products.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.units - a.units || b.sales - a.sales).slice(0, 8),
  };
}

/** Point-in-time counts that don't depend on the date range. */
export function workQueue(orders: Order[]) {
  return {
    toConfirm: orders.filter((o) => o.status === "placed" && !o.onHold).length,
    toPack: orders.filter((o) => o.status === "confirmed" && !o.onHold).length,
    toShip: orders.filter((o) => o.status === "packed" && !o.onHold).length,
    onHold: orders.filter((o) => o.onHold && ["placed", "confirmed", "packed"].includes(o.status)).length,
    pendingPayments: orders.filter((o) => o.status === "payment_pending").length,
    pendingRefunds: orders.filter((o) => o.status === "cancelled" && paidAmount(o) - refundedAmount(o) > 0).length,
    codToCollect: orders.filter((o) => o.paymentMethod === "cod" && o.status === "delivered" && !o.codCollectedAt).length,
    needsReview: orders.filter((o) => o.statusHistory.some((h) => /needs manual review/i.test(h.note ?? ""))).length,
  };
}
