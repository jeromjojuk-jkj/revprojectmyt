// Size Finder: recommends a size from THIS product's garment measurements and
// one body measurement the shopper enters. No body-scanning, no guessing from
// height/weight — just the size chart and the number given.

import type { SizeGuide } from "./types.ts";

export type FitPref = "snug" | "regular" | "relaxed";
export type MeasureKind = "chest" | "waist" | "foot";

export interface FitQuestion {
  kind: MeasureKind;
  column: number;
  /** Unit the shopper should measure in, matching the chart. */
  unit: "in" | "cm";
  label: string;
}

/** Which body measurement this chart can answer, if any. */
export function fitQuestion(guide: SizeGuide | null): FitQuestion | null {
  if (!guide) return null;
  const h = guide.headers.map((x) => x.toLowerCase());
  const find = (...names: string[]) => h.findIndex((x) => names.some((n) => x.includes(n)));
  const foot = find("foot length");
  if (foot >= 0) return { kind: "foot", column: foot, unit: "cm", label: "Your foot length" };
  const chest = find("chest", "bust");
  if (chest >= 0) return { kind: "chest", column: chest, unit: guide.unit, label: h[chest].includes("bust") ? "Your bust" : "Your chest" };
  const waist = find("waist", "fits waist");
  if (waist >= 0) return { kind: "waist", column: waist, unit: guide.unit, label: "Your waist" };
  return null;
}

// Garment-minus-body allowance for each preference (in the chart's unit, inches for clothing).
const EASE: Record<MeasureKind, Record<FitPref, number>> = {
  chest: { snug: 1, regular: 3, relaxed: 5 },
  waist: { snug: 0, regular: 0.5, relaxed: 1.5 },
  foot: { snug: 0, regular: 0.3, relaxed: 0.6 },
};

const firstNumber = (s: string) => {
  const m = /(\d+(?:\.\d+)?)/.exec(s);
  return m ? Number(m[1]) : NaN;
};

export interface FitResult {
  size: string | null;
  nextUp: string | null;
  /** Garment measurement of the recommended size. */
  garment: number | null;
  reason: string;
}

export function recommendSize(guide: SizeGuide, q: FitQuestion, body: number, pref: FitPref): FitResult {
  if (!(body > 0)) return { size: null, nextUp: null, garment: null, reason: "Enter a measurement to get a suggestion." };
  const target = body + EASE[q.kind][pref];
  const rows = guide.rows
    .map((r) => ({ size: r[0], value: firstNumber(r[q.column]) }))
    .filter((r) => Number.isFinite(r.value));
  const idx = rows.findIndex((r) => r.value >= target);
  if (idx < 0) {
    return { size: null, nextUp: null, garment: null, reason: `This item’s largest size measures ${rows[rows.length - 1]?.value} ${q.unit}, which may be too small for that fit.` };
  }
  const pick = rows[idx];
  const tooBig = pick.value - target > (q.kind === "foot" ? 1.2 : 4);
  return {
    size: pick.size,
    nextUp: rows[idx + 1]?.size ?? null,
    garment: pick.value,
    reason: tooBig
      ? `Our closest match measures ${pick.value} ${q.unit} — a little roomy for a ${pref} fit.`
      : `${pick.size} measures ${pick.value} ${q.unit} on the garment, closest to a ${pref} fit for ${body} ${q.unit}.`,
  };
}
