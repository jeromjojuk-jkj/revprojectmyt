// Sample delivery rules for the prototype. Replace with your courier partner's
// serviceability API before launch — these are estimates, never promises.

export const isValidPincode = (p: string) => /^[1-9][0-9]{5}$/.test(p);

const METRO_PREFIXES = ["11", "40", "41", "50", "56", "60", "70", "38", "30", "12", "20"];
const REMOTE_PREFIXES = ["18", "19", "79", "737", "744", "68255"];

export interface DeliveryEstimate {
  serviceable: boolean;
  minDays: number;
  maxDays: number;
  codEligible: boolean;
  zone: "metro" | "standard" | "remote";
  fromDate: string;
  toDate: string;
  message: string;
}

function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  return d;
}

export function estimateDelivery(pincode: string, now = new Date()): DeliveryEstimate | null {
  if (!isValidPincode(pincode)) return null;
  const zone = REMOTE_PREFIXES.some((p) => pincode.startsWith(p))
    ? "remote"
    : METRO_PREFIXES.some((p) => pincode.startsWith(p))
      ? "metro"
      : "standard";
  const [minDays, maxDays] = zone === "metro" ? [3, 5] : zone === "standard" ? [4, 7] : [7, 12];
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const fromDate = fmt(addBusinessDays(now, minDays));
  const toDate = fmt(addBusinessDays(now, maxDays));
  return {
    serviceable: true,
    minDays,
    maxDays,
    codEligible: zone !== "remote",
    zone,
    fromDate,
    toDate,
    message: `Estimated delivery ${fromDate} – ${toDate}`,
  };
}
