// Colour Match: turns pixels from a shopper's photo into Krip colour families.
// Runs entirely in the browser; the photo is never uploaded.

export interface Swatch { hex: string; family: string; share: number }

const toHex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return { h, s, l };
}

/** Maps a colour to the same family names the shop filters use. */
export function familyOf(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l < 0.13) return "Black";
  if (l > 0.9 && s < 0.35) return "White";
  if (s < 0.14) return l < 0.3 ? "Black" : l > 0.82 ? "White" : "Grey";
  if (h >= 15 && h < 50 && l < 0.42) return "Brown";
  if (h >= 20 && h < 50 && s < 0.45 && l < 0.8) return "Brown";
  if (h < 12 || h >= 345) return l > 0.7 ? "Pink" : "Red";
  if (h < 40) return "Orange";
  if (h < 66) return "Yellow";
  if (h < 165) return "Green";
  if (h < 255) return "Blue";
  if (h < 290) return "Purple";
  return "Pink";
}

/**
 * Dominant colours from RGBA pixel data: quantise to a coarse grid, count,
 * then merge buckets by family. Ignores near-transparent pixels.
 */
export function dominantSwatches(data: Uint8ClampedArray, max = 5): Swatch[] {
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`;
    const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    e.r += data[i]; e.g += data[i + 1]; e.b += data[i + 2]; e.n++;
    buckets.set(key, e);
    total++;
  }
  const fam = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (const e of buckets.values()) {
    const r = e.r / e.n, g = e.g / e.n, b = e.b / e.n;
    const f = familyOf(r, g, b);
    const x = fam.get(f) ?? { r: 0, g: 0, b: 0, n: 0 };
    x.r += e.r; x.g += e.g; x.b += e.b; x.n += e.n;
    fam.set(f, x);
  }
  return [...fam.entries()]
    .map(([family, x]) => ({ family, hex: toHex(x.r / x.n, x.g / x.n, x.b / x.n), share: total ? x.n / total : 0 }))
    .filter((s) => s.share >= 0.04)
    .sort((a, b) => b.share - a.share)
    .slice(0, max);
}
