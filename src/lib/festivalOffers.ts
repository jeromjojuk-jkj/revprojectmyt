// Automatic festival offers: a % off the bag that starts a few days before each
// festival and ends by itself when the festival is over. Dates are India time.
// Edited in Admin → Festival offers; calculated on the server like coupons.

import type { FestivalOffer } from "./types.ts";

const IST = "+05:30";
const DAY = 86_400_000;

/** Offer window: [festival day − leadDays] 00:00 IST, up to the end of the last festival day. */
export function offerWindow(f: Pick<FestivalOffer, "date" | "days" | "leadDays">) {
  const day0 = Date.parse(`${f.date}T00:00:00${IST}`);
  return { start: day0 - f.leadDays * DAY, end: day0 + Math.max(1, f.days) * DAY };
}

/** yyyy-mm-dd of a timestamp, in India time. */
export const istDay = (t: number) => new Date(t + 5.5 * 3_600_000).toISOString().slice(0, 10);

export function offerStatus(f: FestivalOffer, now = new Date()): "running" | "upcoming" | "ended" | "off" {
  if (!f.enabled) return "off";
  const { start, end } = offerWindow(f);
  const t = now.getTime();
  return t < start ? "upcoming" : t < end ? "running" : "ended";
}

/** The offer running now (the biggest one if windows overlap), or null. */
export function activeFestivalOffer(list: FestivalOffer[] | undefined, now = new Date()): FestivalOffer | null {
  const running = (list ?? []).filter((f) => offerStatus(f, now) === "running");
  return running.sort((a, b) => b.percentOff - a.percentOff)[0] ?? null;
}

/** Discount (₹, whole rupees) a festival offer gives on a bag subtotal. */
export function festivalDiscount(f: FestivalOffer, subtotal: number): number {
  if (subtotal < f.minSubtotal || subtotal <= 0) return 0;
  const raw = Math.floor((subtotal * f.percentOff) / 100);
  return Math.min(raw, f.maxDiscount ?? raw, subtotal);
}

export function describeFestivalOffer(f: FestivalOffer): string {
  return `${f.percentOff}% off your order${f.maxDiscount ? ` (up to ₹${f.maxDiscount})` : ""}${f.minSubtotal ? ` on orders of ₹${f.minSubtotal}+` : ""}`;
}

/** Last day of the offer, e.g. "25 Dec". */
export function offerEndsLabel(f: FestivalOffer): string {
  const last = offerWindow(f).end - 1;
  return new Date(last).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

const big = { percentOff: 25, maxDiscount: 500, minSubtotal: 299, tier: "big" as const };
const std = { percentOff: 10, maxDiscount: 150, minSubtotal: 299, tier: "standard" as const };

/**
 * Default festival list. Fixed-date days are exact; lunar-calendar festivals
 * (Holi, Eid, Raksha Bandhan, Ganesh Chaturthi, Onam, Dussehra, Diwali, Sankranti)
 * are marked checkDate and should be confirmed in admin before they start.
 */
export const DEFAULT_FESTIVAL_OFFERS: FestivalOffer[] = [
  { id: "diwali-2026", name: "Diwali", date: "2026-11-08", days: 1, leadDays: 4, enabled: true, checkDate: false, ...big },
  { id: "christmas-2026", name: "Christmas", date: "2026-12-25", days: 1, leadDays: 4, enabled: true, checkDate: false, ...big },
  { id: "new-year-2027", name: "New Year", date: "2027-01-01", days: 1, leadDays: 4, enabled: true, checkDate: false, ...std },
  { id: "sankranti-2027", name: "Makar Sankranti & Pongal", date: "2027-01-14", days: 2, leadDays: 4, enabled: true, checkDate: true, ...std },
  { id: "republic-day-2027", name: "Republic Day", date: "2027-01-26", days: 1, leadDays: 4, enabled: true, checkDate: false, ...std },
  { id: "holi-2027", name: "Holi", date: "2027-03-22", days: 1, leadDays: 4, enabled: true, checkDate: true, ...std },
  { id: "eid-2027", name: "Eid al-Fitr", date: "2027-03-10", days: 1, leadDays: 4, enabled: true, checkDate: true, ...std },
  { id: "independence-day-2027", name: "Independence Day", date: "2027-08-15", days: 1, leadDays: 4, enabled: true, checkDate: false, ...std },
  { id: "raksha-bandhan-2027", name: "Raksha Bandhan", date: "2027-08-17", days: 1, leadDays: 4, enabled: true, checkDate: true, ...std },
  { id: "ganesh-chaturthi-2027", name: "Ganesh Chaturthi", date: "2027-09-04", days: 1, leadDays: 4, enabled: true, checkDate: true, ...std },
  { id: "onam-2027", name: "Onam", date: "2027-09-12", days: 1, leadDays: 4, enabled: true, checkDate: true, ...std },
  { id: "dussehra-2027", name: "Navratri & Dussehra", date: "2027-10-10", days: 1, leadDays: 4, enabled: true, checkDate: true, ...std },
  { id: "diwali-2027", name: "Diwali", date: "2027-10-29", days: 1, leadDays: 4, enabled: true, checkDate: true, ...big },
  { id: "christmas-2027", name: "Christmas", date: "2027-12-25", days: 1, leadDays: 4, enabled: true, checkDate: false, ...big },
];

/** Validates one festival offer from admin form input. */
export function validateFestivalOffer(raw: Record<string, string>): { ok: true; value: Omit<FestivalOffer, "id"> } | { ok: false; error: string } {
  const name = (raw.name ?? "").trim().slice(0, 40);
  const date = (raw.date ?? "").trim();
  const n = (k: string) => Number((raw[k] ?? "").trim());
  const days = n("days"), leadDays = n("leadDays"), percentOff = n("percentOff"), minSubtotal = n("minSubtotal");
  const maxRaw = (raw.maxDiscount ?? "").trim();
  const maxDiscount = maxRaw === "" ? null : Number(maxRaw);
  if (!name) return { ok: false, error: "Enter the festival name." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, error: "Pick the festival date." };
  if (!Number.isInteger(days) || days < 1 || days > 10) return { ok: false, error: "Festival length must be 1–10 days." };
  if (!Number.isInteger(leadDays) || leadDays < 0 || leadDays > 14) return { ok: false, error: "Start the offer 0–14 days before." };
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 60) return { ok: false, error: "Discount must be 1–60%." };
  if (maxDiscount !== null && (!Number.isInteger(maxDiscount) || maxDiscount < 1)) return { ok: false, error: "Max discount must be a whole rupee amount, or blank for no cap." };
  if (!Number.isInteger(minSubtotal) || minSubtotal < 0) return { ok: false, error: "Minimum order must be 0 or more." };
  return {
    ok: true,
    value: { name, date, days, leadDays, percentOff, maxDiscount, minSubtotal, enabled: raw.enabled === "on", checkDate: false, tier: percentOff >= 20 ? "big" : "standard" },
  };
}
