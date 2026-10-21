import { test } from "node:test";
import assert from "node:assert/strict";
import { haversineKm, inIndia, nearestCity } from "../../src/lib/geo.ts";

test("India bounds", () => {
  assert.ok(inIndia(12.97, 77.59));
  assert.ok(!inIndia(51.5, -0.12));
});

test("nearest city only within 40 km, never a pincode", () => {
  const blr = nearestCity(12.93, 77.62);
  assert.equal(blr?.city, "Bengaluru");
  assert.equal(nearestCity(15.0, 79.5), null);
});

test("haversine", () => {
  const d = haversineKm(19.076, 72.8777, 18.5204, 73.8567);
  assert.ok(d > 110 && d < 130);
});
