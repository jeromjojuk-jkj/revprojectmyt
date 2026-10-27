import "server-only";
import type { Address, Order } from "../types";
import type { DB } from "./db";
import { customerKey } from "./orders";
import { BOOKED, refundedAmount } from "../orderflow";

// Shoppers don't have accounts yet, so a "customer" is everyone who ordered
// with the same phone number (guest checkout).

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  firstOrderAt: string;
  lastOrderAt: string;
  orders: Order[];
  bookedOrders: number;
  spend: number;
  aov: number;
  addresses: Address[];
  groups: string[];
  segments: string[];
}

export const HIGH_VALUE = 3000;

export function deriveCustomers(db: DB, now = Date.now()): Customer[] {
  const map = new Map<string, Order[]>();
  for (const o of db.orders) {
    const k = customerKey(o.address.phone);
    map.set(k, [...(map.get(k) ?? []), o]);
  }
  return [...map.entries()].map(([id, orders]) => {
    orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const latest = orders.at(-1)!;
    const booked = orders.filter((o) => BOOKED(o.status) && o.status !== "cancelled");
    const spend = booked.reduce((s, o) => s + o.total - refundedAmount(o), 0);
    const addresses = [...new Map(orders.map((o) => [`${o.address.line1}|${o.address.pincode}`, o.address])).values()];
    const segments: string[] = [];
    const lastBooked = booked.at(-1)?.createdAt;
    if (booked.length === 1) segments.push("New");
    if (booked.length >= 2) segments.push("Returning");
    if (booked.length >= 4) segments.push("Frequent buyer");
    if (spend >= HIGH_VALUE) segments.push("High value");
    if (lastBooked && now - Date.parse(lastBooked) > 90 * 86_400_000) segments.push("Inactive 90d+");
    if (orders.some((o) => o.status === "payment_pending" || o.status === "payment_failed") && !booked.length) segments.push("Didn’t complete payment");
    if (orders.some((o) => (o.refunds ?? []).length > 0)) segments.push("Refunded");
    return {
      id,
      name: latest.address.name,
      phone: latest.address.phone,
      email: [...orders].reverse().find((o) => o.address.email)?.address.email ?? "",
      firstOrderAt: orders[0].createdAt,
      lastOrderAt: latest.createdAt,
      orders,
      bookedOrders: booked.length,
      spend,
      aov: booked.length ? Math.round(spend / booked.length) : 0,
      addresses,
      groups: db.customers[id]?.groups ?? [],
      segments,
    };
  });
}

