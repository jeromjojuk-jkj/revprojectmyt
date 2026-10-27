import type { CategoryId, Coupon, CouponUsage } from "./types.ts";

// Coupon rules. All discounts are computed on the server (quote API and order
// creation). Prices on Krip are GST-inclusive, so a discount reduces the
// GST-inclusive item price; it never applies to delivery or COD fees.

export const istDate = (now: Date) => new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** Fills fields added after the first coupon format (₹-off only). */
export function normalizeCoupon(c: Partial<Coupon> & { code: string; amountOff: number }): Coupon {
  return {
    code: c.code.toUpperCase(),
    description: c.description ?? "",
    kind: c.kind ?? "fixed",
    amountOff: c.amountOff,
    maxDiscount: c.maxDiscount ?? null,
    minSubtotal: c.minSubtotal ?? 0,
    active: c.active ?? true,
    startsOn: c.startsOn ?? null,
    endsOn: c.endsOn ?? null,
    usageLimit: c.usageLimit ?? null,
    perCustomerLimit: c.perCustomerLimit ?? null,
    firstOrderOnly: c.firstOrderOnly ?? false,
    categories: c.categories ?? [],
  };
}

export interface CouponLine {
  category: CategoryId;
  lineTotal: number;
}

export type CouponResult = { ok: true; discount: number; message: string } | { ok: false; message: string };

export function evaluateCoupon(
  raw: Coupon,
  lines: CouponLine[],
  now: Date,
  /** Unknown until checkout; limits that need it are enforced when the order is placed. */
  usage?: CouponUsage,
): CouponResult {
  const c = normalizeCoupon(raw);
  const today = istDate(now);
  if (!c.active) return { ok: false, message: "This code isn’t valid." };
  if (c.startsOn && today < c.startsOn) return { ok: false, message: "This code isn’t active yet." };
  if (c.endsOn && today > c.endsOn) return { ok: false, message: "This code has expired." };
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  if (subtotal < c.minSubtotal) return { ok: false, message: `Add items worth ₹${c.minSubtotal - subtotal} more to use ${c.code}.` };
  const eligible = c.categories.length ? lines.filter((l) => c.categories.includes(l.category)).reduce((s, l) => s + l.lineTotal, 0) : subtotal;
  if (eligible <= 0) return { ok: false, message: `${c.code} doesn’t apply to the items in your bag.` };
  if (c.usageLimit !== null && (usage?.total ?? 0) >= c.usageLimit) return { ok: false, message: "This code has been fully redeemed." };
  if (usage) {
    if (c.perCustomerLimit !== null && usage.byCustomer >= c.perCustomerLimit) return { ok: false, message: "You’ve already used this code." };
    if (c.firstOrderOnly && usage.customerHasOrders) return { ok: false, message: "This code is for first orders only." };
  }
  let discount = c.kind === "percent" ? Math.floor((eligible * c.amountOff) / 100) : c.amountOff;
  if (c.kind === "percent" && c.maxDiscount !== null) discount = Math.min(discount, c.maxDiscount);
  discount = Math.max(0, Math.min(discount, eligible));
  return { ok: true, discount, message: c.description || describeCoupon(c) };
}

export function describeCoupon(c: Coupon) {
  const off = c.kind === "percent" ? `${c.amountOff}% off${c.maxDiscount !== null ? ` (up to ₹${c.maxDiscount})` : ""}` : `₹${c.amountOff} off`;
  return `${off}${c.minSubtotal ? ` on orders of ₹${c.minSubtotal}+` : ""}`;
}

/** Validates admin input. Returns the coupon or field errors. */
export function validateCouponInput(raw: Record<string, string | undefined>, categoryIds: string[]): { ok: true; coupon: Coupon } | { ok: false; errors: Record<string, string> } {
  const e: Record<string, string> = {};
  const s = (k: string) => (raw[k] ?? "").trim();
  const num = (k: string) => (s(k) === "" ? null : Number(s(k)));
  const code = s("code").toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(code)) e.code = "3–20 letters or digits.";
  const kind = s("kind") === "percent" ? "percent" : "fixed";
  const amount = num("amountOff");
  if (amount === null || !Number.isFinite(amount) || amount <= 0) e.amountOff = "Enter a value above 0.";
  else if (kind === "percent" && (amount > 90 || !Number.isInteger(amount))) e.amountOff = "Whole percent from 1 to 90.";
  else if (kind === "fixed" && !Number.isInteger(amount)) e.amountOff = "Whole rupees only.";
  const maxDiscount = num("maxDiscount");
  if (maxDiscount !== null && !(Number.isInteger(maxDiscount) && maxDiscount > 0)) e.maxDiscount = "Leave blank or enter whole rupees above 0.";
  const minSubtotal = num("minSubtotal") ?? 0;
  if (!(Number.isInteger(minSubtotal) && minSubtotal >= 0)) e.minSubtotal = "Whole rupees, 0 or more.";
  if (kind === "fixed" && amount !== null && minSubtotal > 0 && amount >= minSubtotal) e.amountOff = "Fixed discount must be less than the minimum order value.";
  const date = (k: string) => {
    const v = s(k);
    if (!v) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) e[k] = "Use yyyy-mm-dd.";
    return v;
  };
  const startsOn = date("startsOn");
  const endsOn = date("endsOn");
  if (startsOn && endsOn && endsOn < startsOn) e.endsOn = "End date is before the start date.";
  const limit = (k: string) => {
    const v = num(k);
    if (v !== null && !(Number.isInteger(v) && v > 0)) e[k] = "Leave blank for unlimited, or a whole number above 0.";
    return v;
  };
  const usageLimit = limit("usageLimit");
  const perCustomerLimit = limit("perCustomerLimit");
  const categories = (raw.categories ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (categories.some((c) => !categoryIds.includes(c))) e.categories = "Unknown category.";
  const description = s("description").slice(0, 120);
  if (Object.keys(e).length) return { ok: false, errors: e };
  const coupon: Coupon = {
    code, kind, amountOff: amount!, maxDiscount: kind === "percent" ? maxDiscount : null, minSubtotal, active: raw.active === "on" || raw.active === "true",
    startsOn, endsOn, usageLimit, perCustomerLimit, firstOrderOnly: raw.firstOrderOnly === "on" || raw.firstOrderOnly === "true",
    categories: categories as CategoryId[], description: "",
  };
  coupon.description = description || describeCoupon(coupon);
  return { ok: true, coupon };
}
