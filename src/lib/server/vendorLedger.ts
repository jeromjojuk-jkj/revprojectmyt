import "server-only";
import type { DB } from "./db";
import type { Order } from "../types";
import { orderCommission, paise, shippingOf, vendorShares } from "../vendorPlans";
import type { VendorShippingRule } from "../pricing";

export interface VendorSale {
  orderId: string;
  createdAt: string;
  status: Order["status"];
  paymentMethod: Order["paymentMethod"];
  items: { title: string; sku: string; qty: number; unitPrice: number }[];
  gross: number;
  delivery: number;
  units: number;
  commission: number;
  payout: number;
  /** How the seller gets this money. */
  settlement: "split" | "owed" | "pending" | "void";
  shipped: boolean;
  part: NonNullable<Order["vendorParts"]>[number] | null;
}

/**
 * A seller's sales and earnings. Online orders paid with Easy Split settle to the seller via Cashfree;
 * everything else (COD, or online before Easy Split was on) is owed by Krip once delivered.
 */
export function vendorLedger(db: DB, vendorId: string) {
  const sales: VendorSale[] = [];
  for (const o of db.orders) {
    const share = vendorShares(o, orderCommission(o, db.settings)).get(vendorId);
    if (!share) continue;
    if (o.status === "payment_pending" || o.status === "payment_failed") continue;
    const split = o.paymentMethod === "online" && (o.vendorSplits ?? []).some((x) => x.vendorId === vendorId);
    const settlement: VendorSale["settlement"] = o.status === "cancelled" ? "void" : split ? "split" : o.status === "delivered" || o.vendorParts?.some((p) => p.vendorId === vendorId && p.status === "delivered") ? "owed" : "pending";
    sales.push({
      orderId: o.id, createdAt: o.createdAt, status: o.status, paymentMethod: o.paymentMethod,
      items: o.items.filter((i) => i.vendorId === vendorId).map((i) => ({ title: i.title, sku: i.sku, qty: i.qty, unitPrice: i.unitPrice })),
      gross: share.items, delivery: share.delivery, units: share.units, commission: share.commission, payout: share.payout, settlement,
      shipped: (o.shipments ?? []).some((s) => s.vendorId === vendorId),
      part: o.vendorParts?.find((p) => p.vendorId === vendorId) ?? null,
    });
  }
  sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const live = sales.filter((s) => s.settlement !== "void");
  const payouts = db.vendorPayouts.filter((p) => p.vendorId === vendorId).sort((a, b) => b.at.localeCompare(a.at));
  const paidManually = payouts.reduce((s, p) => s + p.amount, 0);
  const owedTotal = live.filter((s) => s.settlement === "owed").reduce((s, x) => s + x.payout, 0);
  return {
    sales,
    payouts,
    totals: {
      gross: paise(live.reduce((s, x) => s + x.gross, 0)),
      delivery: paise(live.reduce((s, x) => s + x.delivery, 0)),
      units: paise(live.reduce((s, x) => s + x.units, 0)),
      commission: paise(live.reduce((s, x) => s + x.commission, 0)),
      earnings: paise(live.reduce((s, x) => s + x.payout, 0)),
      viaCashfree: paise(live.filter((s) => s.settlement === "split").reduce((s, x) => s + x.payout, 0)),
      pending: paise(live.filter((s) => s.settlement === "pending").reduce((s, x) => s + x.payout, 0)),
      paidManually,
      dueNow: paise(Math.max(0, owedTotal - paidManually)),
    },
  };
}

/** Delivery charges of approved sellers, for checkout. */
export function vendorShippingRules(db: DB): Record<string, VendorShippingRule> {
  const out: Record<string, VendorShippingRule> = {};
  for (const v of db.vendors) {
    if (v.status !== "approved") continue;
    const s = shippingOf(v);
    out[v.id] = { name: v.businessName, fee: s.fee, freeAbove: s.freeAbove };
  }
  return out;
}
