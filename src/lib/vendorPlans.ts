// Marketplace seller plans (one-time registration fee) and the money split per order.

import type { Order, VendorPlanId, VendorShipping } from "./types.ts";

export interface VendorPlan {
  id: VendorPlanId;
  name: string;
  fee: number;
  /** null = unlimited. */
  productLimit: number | null;
  featuredSlots: number;
  verifiedBadge: boolean;
  prioritySupport: boolean;
  salesReports: boolean;
  perks: string[];
}

export const VENDOR_PLANS: VendorPlan[] = [
  {
    id: "normal", name: "Normal", fee: 1000, productLimit: 25, featuredSlots: 0, verifiedBadge: false, prioritySupport: false, salesReports: false,
    perks: ["List up to 25 products", "Your own seller panel: products, orders, earnings", "Ship your orders and add tracking", "₹10 commission per product sold"],
  },
  {
    id: "premium", name: "Premium", fee: 1500, productLimit: 100, featuredSlots: 2, verifiedBadge: true, prioritySupport: false, salesReports: false,
    perks: ["List up to 100 products", "“Verified seller” badge after Krip’s checks", "2 products featured on the Krip homepage", "Everything in Normal", "₹10 commission per product sold"],
  },
  {
    id: "advance", name: "Advance Business", fee: 1800, productLimit: null, featuredSlots: 5, verifiedBadge: true, prioritySupport: true, salesReports: true,
    perks: ["Unlimited products", "“Verified seller” badge after Krip’s checks", "5 products featured on the Krip homepage", "Priority support", "Download sales reports (CSV)", "₹10 commission per product sold"],
  },
];

export const planOf = (id: VendorPlanId) => VENDOR_PLANS.find((p) => p.id === id)!;
export const DEFAULT_COMMISSION_PER_UNIT = 10;

/** What a vendor earns from an order: their items at the selling price plus the delivery charge they collected, minus Krip's commission per unit. */
export function vendorShares(o: Pick<Order, "items"> & Partial<Pick<Order, "vendorParts">>, commissionPerUnit: number): Map<string, { items: number; units: number; delivery: number; commission: number; payout: number }> {
  const out = new Map<string, { items: number; units: number; delivery: number; commission: number; payout: number }>();
  for (const it of o.items) {
    if (!it.vendorId) continue;
    const s = out.get(it.vendorId) ?? { items: 0, units: 0, delivery: 0, commission: 0, payout: 0 };
    s.items += it.unitPrice * it.qty;
    s.units += it.qty;
    s.commission += commissionPerUnit * it.qty;
    out.set(it.vendorId, s);
  }
  for (const [vid, s] of out) {
    s.delivery = o.vendorParts?.find((p) => p.vendorId === vid)?.delivery ?? 0;
    s.payout = Math.max(0, s.items + s.delivery - s.commission);
  }
  return out;
}

export const DEFAULT_VENDOR_SHIPPING: VendorShipping = { fee: 49, freeAbove: 499, handlingDays: 2, courier: "", onHoliday: false };
export const shippingOf = (v: { shipping?: VendorShipping }): VendorShipping => ({ ...DEFAULT_VENDOR_SHIPPING, ...(v.shipping ?? {}) });

/** Adds working days (skips Sundays) — used for "dispatch by" deadlines. */
export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = Math.max(0, Math.round(days));
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    // Sunday in India (IST is UTC+5:30; noon UTC is always the same IST date).
    const ist = new Date(d.getTime() + 330 * 60_000);
    if (ist.getUTCDay() !== 0) left--;
  }
  return d;
}

export function validateShipping(raw: Record<string, string>): { ok: true; value: VendorShipping } | { ok: false; errors: Record<string, string> } {
  const e: Record<string, string> = {};
  const fee = Number((raw.fee ?? "").trim() || "0");
  const fa = (raw.freeAbove ?? "").trim();
  const freeAbove = fa === "" ? null : Number(fa);
  const handlingDays = Number(raw.handlingDays);
  const courier = (raw.courier ?? "").trim().slice(0, 60);
  if (!Number.isInteger(fee) || fee < 0 || fee > 500) e.fee = "Delivery charge must be ₹0–₹500 in whole rupees.";
  if (freeAbove !== null && (!Number.isInteger(freeAbove) || freeAbove < 1 || freeAbove > 100000)) e.freeAbove = "Enter a whole rupee amount, or leave blank.";
  if (!Number.isInteger(handlingDays) || handlingDays < 1 || handlingDays > 7) e.handlingDays = "Choose 1–7 working days.";
  return Object.keys(e).length ? { ok: false, errors: e } : { ok: true, value: { fee, freeAbove, handlingDays, courier, onHoliday: raw.onHoliday === "on" } };
}
