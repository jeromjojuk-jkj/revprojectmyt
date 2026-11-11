const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatPrice = (n: number) => inr.format(Math.round(n));

const inrPaise = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Money that can have paise (commission, seller earnings): ₹489.02, or ₹489 when whole. */
export const formatMoney = (n: number) => (Number.isInteger(Math.round(n * 100) / 100) ? formatPrice(n) : inrPaise.format(Math.round(n * 100) / 100));

export function discountPct(price: number, mrp: number | null): number | null {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function formatDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
}

export const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
