// Seasonal themes that switch themselves on and off by date (India time).
// Pages are rendered per request, so the theme starts and ends on its own, with no redeploy.
// FESTIVAL_MODE=on|off overrides the dates (e.g. to end a theme early); anything else = by date.

export interface Festival {
  id: "diwali";
  name: string;
  /** Inclusive start and exclusive end, ISO with the +05:30 offset. */
  start: string;
  end: string;
  /** Status-bar colour on phones and the installed app while the theme is on. */
  themeColor: string;
}

export const FESTIVALS: Festival[] = [
  // Diwali 2026 (Lakshmi Puja on 8 Nov): 5 days, 6–10 Nov; back to normal on 11 Nov.
  { id: "diwali", name: "Diwali", start: "2026-11-06T00:00:00+05:30", end: "2026-11-11T00:00:00+05:30", themeColor: "#5c0f1f" },
];

export function activeFestival(now: Date = new Date(), mode: string | undefined = process.env.FESTIVAL_MODE): Festival | null {
  if (mode === "off") return null;
  if (mode === "on") return FESTIVALS[0] ?? null;
  const t = now.getTime();
  return FESTIVALS.find((f) => t >= Date.parse(f.start) && t < Date.parse(f.end)) ?? null;
}
