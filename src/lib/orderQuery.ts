import type { Order } from "./types.ts";
import { istDay } from "./metrics.ts";
import { paidAmount, paymentStateOf, refundedAmount } from "./orderflow.ts";

export interface OrderFilters {
  q?: string;
  status?: string;
  pay?: string;
  method?: string;
  from?: string;
  to?: string;
  min?: string;
  max?: string;
  flag?: string;
  sort?: string;
}

/** Shared by the order list and its CSV export so both always agree. */
export function filterOrders(orders: Order[], f: OrderFilters): Order[] {
  const q = f.q?.trim().toLowerCase();
  const digits = q?.replace(/\D/g, "");
  let list = orders.filter((o) => {
    if (q) {
      const awbs = (o.shipments ?? []).map((s) => s.awb.toLowerCase());
      const hit = o.id.toLowerCase().includes(q) || o.address.name.toLowerCase().includes(q) || o.address.email.toLowerCase().includes(q) ||
        (digits && digits.length >= 4 && o.address.phone.includes(digits)) || awbs.some((a) => a.includes(q));
      if (!hit) return false;
    }
    if (f.status && o.status !== f.status) return false;
    if (f.method && o.paymentMethod !== f.method) return false;
    if (f.pay === "refund_due") {
      if (!(o.status === "cancelled" && paidAmount(o) - refundedAmount(o) > 0)) return false;
    } else if (f.pay && paymentStateOf(o) !== f.pay) return false;
    const day = istDay(o.createdAt);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    if (f.min && o.total < Number(f.min)) return false;
    if (f.max && o.total > Number(f.max)) return false;
    if (f.flag === "hold" && !o.onHold) return false;
    if (f.flag === "review" && !o.statusHistory.some((h) => /needs manual review/i.test(h.note ?? ""))) return false;
    return true;
  });
  const [col, dir] = (f.sort ?? "date:desc").split(":");
  const sign = dir === "asc" ? 1 : -1;
  list = list.sort((a, b) => sign * (col === "total" ? a.total - b.total : col === "customer" ? a.address.name.localeCompare(b.address.name) : a.createdAt.localeCompare(b.createdAt)));
  return list;
}
