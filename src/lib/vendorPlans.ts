// Marketplace seller plans (one-time registration fee) and the money split per order.

import type { CommissionRule, Order, Settings, VendorPlanId, VendorShipping } from "./types.ts";

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
    perks: ["List up to 25 products", "Your own seller panel: products, orders, earnings", "Ship your orders and add tracking"],
  },
  {
    id: "premium", name: "Premium", fee: 1500, productLimit: 100, featuredSlots: 2, verifiedBadge: true, prioritySupport: false, salesReports: false,
    perks: ["List up to 100 products", "“Verified seller” badge after Krip’s checks", "2 products featured on the Krip homepage", "Everything in Normal"],
  },
  {
    id: "advance", name: "Advance Business", fee: 1800, productLimit: null, featuredSlots: 5, verifiedBadge: true, prioritySupport: true, salesReports: true,
    perks: ["Unlimited products", "“Verified seller” badge after Krip’s checks", "5 products featured on the Krip homepage", "Priority support", "Download sales reports (CSV)"],
  },
];

export const planOf = (id: VendorPlanId) => VENDOR_PLANS.find((p) => p.id === id)!;
/** 1% on products up to ₹100, 2% on products above ₹100. */
export const DEFAULT_COMMISSION: CommissionRule = { upTo: 100, lowPct: 1, highPct: 2 };

/** A commission rule, or a flat ₹ per unit (older orders). */
export type CommissionBasis = CommissionRule | number;

/** Rounds to paise. */
export const paise = (n: number) => Math.round(n * 100) / 100;

export const commissionOf = (s: Pick<Settings, "vendorCommission">): CommissionRule => s.vendorCommission ?? DEFAULT_COMMISSION;

/** The commission that applies to an order: the rule saved on it when placed, else today's rule. */
export const orderCommission = (o: Pick<Order, "commissionRule" | "commissionPerUnit">, s: Pick<Settings, "vendorCommission">): CommissionBasis =>
  o.commissionRule ?? o.commissionPerUnit ?? commissionOf(s);

/** Krip's commission on one unit at this price (₹, to the paisa). */
export function unitCommission(price: number, basis: CommissionBasis): number {
  if (typeof basis === "number") return basis;
  return paise((price * (price <= basis.upTo ? basis.lowPct : basis.highPct)) / 100);
}

const pct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`;

/** e.g. "1% on products up to ₹100, 2% above ₹100". */
export function describeCommission(r: CommissionRule): string {
  return r.lowPct === r.highPct ? `${pct(r.lowPct)} of the selling price` : `${pct(r.lowPct)} on products up to ₹${r.upTo}, ${pct(r.highPct)} above ₹${r.upTo}`;
}

export function validateCommission(raw: Record<string, string>): { ok: true; value: CommissionRule } | { ok: false; error: string } {
  const upTo = Number(raw.upTo), lowPct = Number(raw.lowPct), highPct = Number(raw.highPct);
  if (!Number.isInteger(upTo) || upTo < 1 || upTo > 100000) return { ok: false, error: "Price limit must be a whole rupee amount." };
  for (const v of [lowPct, highPct]) if (!Number.isFinite(v) || v < 0 || v > 50 || Math.abs(Math.round(v * 10) - v * 10) > 1e-6) return { ok: false, error: "Commission must be 0–50%, with at most one decimal (e.g. 1.5)." };
  return { ok: true, value: { upTo, lowPct, highPct } };
}

/** What a vendor earns from an order: their items at the selling price plus the delivery charge they collected, minus Krip's commission. */
export function vendorShares(o: Pick<Order, "items"> & Partial<Pick<Order, "vendorParts">>, basis: CommissionBasis): Map<string, { items: number; units: number; delivery: number; commission: number; payout: number }> {
  const out = new Map<string, { items: number; units: number; delivery: number; commission: number; payout: number }>();
  for (const it of o.items) {
    if (!it.vendorId) continue;
    const s = out.get(it.vendorId) ?? { items: 0, units: 0, delivery: 0, commission: 0, payout: 0 };
    s.items += it.unitPrice * it.qty;
    s.units += it.qty;
    s.commission = paise(s.commission + unitCommission(it.unitPrice, basis) * it.qty);
    out.set(it.vendorId, s);
  }
  for (const [vid, s] of out) {
    s.delivery = o.vendorParts?.find((p) => p.vendorId === vid)?.delivery ?? 0;
    s.payout = paise(Math.max(0, s.items + s.delivery - s.commission));
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
