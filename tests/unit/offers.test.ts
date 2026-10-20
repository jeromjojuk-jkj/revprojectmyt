import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeedProducts } from "../../src/data/catalog.ts";
import { SEED_OFFERS } from "../../src/data/offers.ts";
import { evaluateOffer, liveOffers, validateOffer } from "../../src/lib/offers.ts";

const products = buildSeedProducts().filter((p) => p.status !== "draft").map(({ private: _p, ...pub }) => pub);

test("every sample offer is live and its headline price cap holds", () => {
  const live = liveOffers(SEED_OFFERS, products);
  assert.equal(live.length, SEED_OFFERS.length);
  for (const v of live) {
    const cap = /Under ₹(\d+)/.exec(v.offer.headline);
    if (cap) assert.ok(v.fromPrice! <= Number(cap[1]));
    assert.ok(v.count > 0);
  }
});

test("offers hide outside their dates and when switched off", () => {
  const o = { ...SEED_OFFERS[0], startsOn: "2026-11-01", endsOn: "2026-11-10" };
  assert.equal(evaluateOffer(o, products, new Date("2026-10-20T10:00:00+05:30")).state, "scheduled");
  assert.equal(evaluateOffer(o, products, new Date("2026-11-05T10:00:00+05:30")).state, "live");
  assert.equal(evaluateOffer(o, products, new Date("2026-11-11T10:00:00+05:30")).state, "ended");
  assert.equal(evaluateOffer({ ...o, active: false, startsOn: null, endsOn: null }, products).state, "inactive");
});

test("validation blocks headlines the link doesn't enforce and empty links", () => {
  const base = { headline: "Under ₹299", subhead: "Tops", badge: "Diwali Edit", theme: "red", productIds: "p102", active: "on" };
  const bad = validateOffer({ ...base, query: "cat=women" }, products);
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.match(bad.errors.query, /max=299/);
  const empty = validateOffer({ ...base, query: "cat=women&max=50" }, products);
  assert.equal(empty.ok, false);
  const ok = validateOffer({ ...base, query: "cat=women&max=299" }, products);
  assert.equal(ok.ok, true);
});
