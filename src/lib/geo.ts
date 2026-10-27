// Location helpers. Pure — used by the /api/locate route and unit tests.

export const INDIA_BOUNDS = { minLat: 6.5, maxLat: 37.5, minLon: 68, maxLon: 97.5 };

export const inIndia = (lat: number, lon: number) =>
  lat >= INDIA_BOUNDS.minLat && lat <= INDIA_BOUNDS.maxLat && lon >= INDIA_BOUNDS.minLon && lon <= INDIA_BOUNDS.maxLon;

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * City centres used ONLY as an offline fallback when no reverse-geocoding
 * service is reachable. They give a city name, never a pincode — a pincode
 * guessed from a city centre would often be wrong.
 */
export const CITIES: { city: string; state: string; lat: number; lon: number }[] = [
  { city: "Mumbai", state: "Maharashtra", lat: 19.076, lon: 72.8777 },
  { city: "Delhi", state: "Delhi", lat: 28.6139, lon: 77.209 },
  { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lon: 77.5946 },
  { city: "Hyderabad", state: "Telangana", lat: 17.385, lon: 78.4867 },
  { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  { city: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639 },
  { city: "Pune", state: "Maharashtra", lat: 18.5204, lon: 73.8567 },
  { city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lon: 72.5714 },
  { city: "Jaipur", state: "Rajasthan", lat: 26.9124, lon: 75.7873 },
  { city: "Surat", state: "Gujarat", lat: 21.1702, lon: 72.8311 },
  { city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lon: 80.9462 },
  { city: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lon: 80.3319 },
  { city: "Nagpur", state: "Maharashtra", lat: 21.1458, lon: 79.0882 },
  { city: "Indore", state: "Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  { city: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lon: 77.4126 },
  { city: "Patna", state: "Bihar", lat: 25.5941, lon: 85.1376 },
  { city: "Vadodara", state: "Gujarat", lat: 22.3072, lon: 73.1812 },
  { city: "Ludhiana", state: "Punjab", lat: 30.901, lon: 75.8573 },
  { city: "Chandigarh", state: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  { city: "Kochi", state: "Kerala", lat: 9.9312, lon: 76.2673 },
  { city: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lon: 76.9366 },
  { city: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lon: 76.9558 },
  { city: "Madurai", state: "Tamil Nadu", lat: 9.9252, lon: 78.1198 },
  { city: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lon: 83.2185 },
  { city: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lon: 80.648 },
  { city: "Bhubaneswar", state: "Odisha", lat: 20.2961, lon: 85.8245 },
  { city: "Guwahati", state: "Assam", lat: 26.1445, lon: 91.7362 },
  { city: "Ranchi", state: "Jharkhand", lat: 23.3441, lon: 85.3096 },
  { city: "Raipur", state: "Chhattisgarh", lat: 21.2514, lon: 81.6296 },
  { city: "Dehradun", state: "Uttarakhand", lat: 30.3165, lon: 78.0322 },
  { city: "Srinagar", state: "Jammu and Kashmir", lat: 34.0837, lon: 74.7973 },
  { city: "Goa (Panaji)", state: "Goa", lat: 15.4909, lon: 73.8278 },
  { city: "Mysuru", state: "Karnataka", lat: 12.2958, lon: 76.6394 },
  { city: "Mangaluru", state: "Karnataka", lat: 12.9141, lon: 74.856 },
  { city: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lon: 82.9739 },
  { city: "Agra", state: "Uttar Pradesh", lat: 27.1767, lon: 78.0081 },
  { city: "Noida", state: "Uttar Pradesh", lat: 28.5355, lon: 77.391 },
  { city: "Gurugram", state: "Haryana", lat: 28.4595, lon: 77.0266 },
];

export function nearestCity(lat: number, lon: number, maxKm = 40) {
  let best: (typeof CITIES)[number] | null = null;
  let bestKm = Infinity;
  for (const c of CITIES) {
    const d = haversineKm(lat, lon, c.lat, c.lon);
    if (d < bestKm) {
      best = c;
      bestKm = d;
    }
  }
  return best && bestKm <= maxKm ? { ...best, km: Math.round(bestKm) } : null;
}

export interface LocateResult {
  source: "geocoder" | "approximate";
  pincode: string | null;
  locality: string | null;
  city: string | null;
  state: string | null;
  /** Human sentence for the UI. */
  label: string;
}
