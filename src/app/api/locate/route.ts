import { NextResponse } from "next/server";
import { inIndia, nearestCity, type LocateResult } from "@/lib/geo";
import { isValidPincode } from "@/lib/pincode";
import { INDIAN_STATES } from "@/lib/constants";

// Turns the shopper's coordinates into a pincode. Coordinates are used for
// this one lookup and are not stored or logged.
//
// Provider: GEOCODE_PROVIDER=nominatim (OpenStreetMap, default) — fine for a
// prototype under its usage policy (identify the app, ≤1 req/s, attribution).
// For production traffic, plug in a commercial India geocoder (MapmyIndia,
// Google) here. GEOCODE_PROVIDER=off uses only the offline city fallback.

export const dynamic = "force-dynamic";

const hits = ((globalThis as unknown as { __kripLocate?: Map<string, number[]> }).__kripLocate ??= new Map());
const cache = ((globalThis as unknown as { __kripLocateCache?: Map<string, LocateResult> }).__kripLocateCache ??= new Map());
let lastUpstream = 0;

function matchState(s: string | undefined) {
  if (!s) return null;
  const n = s.toLowerCase().replace(/^nct of /, "");
  return INDIAN_STATES.find((x) => x.toLowerCase() === n) ?? s;
}

async function nominatim(lat: number, lon: number): Promise<LocateResult | null> {
  // Respect the public instance's 1 request/second policy.
  const wait = lastUpstream + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastUpstream = Date.now();
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, {
    headers: { "User-Agent": process.env.GEOCODE_USER_AGENT || "krip-storefront-prototype/0.1", "Accept-Language": "en-IN" },
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const d = (await res.json()) as { address?: Record<string, string> };
  const a = d.address ?? {};
  const pin = (a.postcode ?? "").replace(/\s/g, "");
  const city = a.city ?? a.town ?? a.village ?? a.county ?? a.state_district ?? null;
  const locality = a.suburb ?? a.neighbourhood ?? a.quarter ?? a.road ?? null;
  const state = matchState(a.state);
  const pincode = isValidPincode(pin) ? pin : null;
  return {
    source: "geocoder",
    pincode,
    locality,
    city,
    state,
    label: [locality, city].filter(Boolean).join(", ") || "your location",
  };
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t: number) => now - t < 60_000);
  if (recent.length >= 10) return NextResponse.json({ error: "Too many location lookups. Try again in a minute." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const body = await req.json().catch(() => null);
  const lat = Number(body?.lat);
  const lon = Number(body?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }
  if (!inIndia(lat, lon)) {
    return NextResponse.json({ error: "Krip delivers only within India. Enter an Indian pincode instead." }, { status: 422 });
  }
  // ~100 m grid for caching; the precise point is never kept.
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached) return NextResponse.json({ result: cached });

  let result: LocateResult | null = null;
  if ((process.env.GEOCODE_PROVIDER ?? "nominatim") === "nominatim") {
    try {
      result = await nominatim(lat, lon);
    } catch {
      result = null;
    }
  }
  if (!result) {
    const near = nearestCity(lat, lon);
    result = {
      source: "approximate",
      pincode: null,
      locality: null,
      city: near?.city ?? null,
      state: near?.state ?? null,
      label: near ? `near ${near.city}` : "your area",
    };
  }
  if (cache.size > 2000) cache.clear();
  cache.set(key, result);
  return NextResponse.json({ result });
}
