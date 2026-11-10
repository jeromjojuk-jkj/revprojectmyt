import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeedProducts } from "../../src/data/catalog.ts";
import { computeQuote, estimateContribution } from "../../src/lib/pricing.ts";
import type { Settings } from "../../src/lib/types.ts";
import { normalizeCoupon } from "../../src/lib/coupons.ts";
import { DEFAULT_DELIVERY } from "../../src/lib/pincode.ts";

const products = buildSeedProducts("fashion").map(({ private: _p, ...pub }) => pub);
const settings: Settings = {
  deliveryFee: 49, freeDeliveryAbove: null, codFee: 20, codMaxOrderValue: 3000, returnAllowancePct: 8,
  channelFees: [{ channel: "Krip", marketplaceFeePct: 0, paymentFeePct: 2, fixedFee: 0 }],
  coupons: [normalizeCoupon({ code: "AURA50", description: "x", amountOff: 50, minSubtotal: 699, active: true })],
  delivery: DEFAULT_DELIVERY,
};

test("totals: subtotal + delivery + COD fee", () => {
  const q = computeQuote({ items: [{ sku: "P008-BLAC-M", qty: 2 }], pincode: "560001", paymentMethod: "cod" }, products, settings);
  assert.equal(q.subtotal, 498);
  assert.equal(q.delivery, 49);
  assert.equal(q.codFee, 20);
  assert.equal(q.total, 567);
  assert.ok(q.allAvailable);
});

test("coupon minimum is enforced", () => {
  const low = computeQuote({ items: [{ sku: "P008-BLAC-M", qty: 1 }], couponCode: "aura50" }, products, settings);
  assert.equal(low.discount, 0);
  assert.match(low.couponMessage!, /Add items worth/);
  const ok = computeQuote({ items: [{ sku: "P101-CHAM-S", qty: 1 }], couponCode: "AURA50" }, products, settings);
  assert.equal(ok.discount, 50);
});

test("unknown, out-of-stock and over-quantity lines are flagged", () => {
  const oos = products.flatMap((p) => p.variants).find((v) => v.stock === 0)!;
  const q = computeQuote({ items: [{ sku: "NOPE", qty: 1 }, { sku: oos.sku, qty: 1 }] }, products, settings);
  assert.equal(q.allAvailable, false);
  assert.equal(q.subtotal, 0);
  assert.equal(q.lines.filter((l) => !l.ok).length, 2);
});

test("COD blocked for remote pincode and high totals", () => {
  assert.equal(computeQuote({ items: [{ sku: "P008-BLAC-M", qty: 1 }], pincode: "744101" }, products, settings).codAvailable, false);
  assert.equal(computeQuote({ items: [{ sku: "P008-BLAC-M", qty: 1 }], pincode: "abc" }, products, settings).codAvailable, false);
});

test("contribution estimate", () => {
  const r = estimateContribution({ sellingPrice: 1000, purchaseCost: 400, shippingCost: 60, marketplaceFeePct: 15, paymentFeePct: 2, fixedFee: 30, returnAllowancePct: 8 });
  assert.equal(r.fees, 200);
  assert.equal(r.returns, 80);
  assert.equal(r.contribution, 260);
});

test("contribution subtracts other per-unit costs (packing, labels)", () => {
  const base = { sellingPrice: 200, purchaseCost: 80, shippingCost: 40, marketplaceFeePct: 0, paymentFeePct: 2, fixedFee: 0, returnAllowancePct: 0 };
  const without = estimateContribution(base);
  const withOther = estimateContribution({ ...base, otherCost: 10 });
  assert.equal(without.contribution - withOther.contribution, 10);
  assert.equal(withOther.contribution, 66); // 200 - 80 - 40 - 10 - 4 (2% fee)
});

test("Diwali theme runs 6–10 Nov 2026 (India time) and switches off on 11 Nov", async () => {
  const { activeFestival } = await import("../../src/lib/festival.ts");
  const at = (s: string) => activeFestival(new Date(s), undefined)?.id ?? null;
  assert.equal(at("2026-11-05T23:59:00+05:30"), null);
  assert.equal(at("2026-11-06T00:00:00+05:30"), "diwali");
  assert.equal(at("2026-11-08T20:00:00+05:30"), "diwali");
  assert.equal(at("2026-11-10T23:59:00+05:30"), "diwali");
  assert.equal(at("2026-11-11T00:00:00+05:30"), null);
  assert.equal(activeFestival(new Date("2026-11-08T12:00:00+05:30"), "off"), null);
  assert.equal(activeFestival(new Date("2027-01-01T00:00:00+05:30"), "on")?.id, "diwali");
});

test("festival offer: starts 4 days before, ends after the festival day, best of coupon or offer", async () => {
  const { activeFestivalOffer, festivalDiscount } = await import("../../src/lib/festivalOffers.ts");
  const xmas = { id: "x", name: "Christmas", date: "2026-12-25", days: 1, leadDays: 4, percentOff: 25, maxDiscount: 500, minSubtotal: 299, enabled: true, checkDate: false, tier: "big" as const };
  const at = (s: string) => activeFestivalOffer([xmas], new Date(s))?.id ?? null;
  assert.equal(at("2026-12-20T23:59:00+05:30"), null);
  assert.equal(at("2026-12-21T00:00:00+05:30"), "x");
  assert.equal(at("2026-12-25T23:59:00+05:30"), "x");
  assert.equal(at("2026-12-26T00:00:00+05:30"), null);
  assert.equal(activeFestivalOffer([{ ...xmas, enabled: false }], new Date("2026-12-24T12:00:00+05:30")), null);
  assert.equal(festivalDiscount(xmas, 1000), 250);
  assert.equal(festivalDiscount(xmas, 4000), 500); // capped
  assert.equal(festivalDiscount(xmas, 200), 0); // below minimum
  const s = { ...settings, festivalOffers: [xmas] };
  const during = { now: new Date("2026-12-24T12:00:00+05:30") };
  const q = computeQuote({ items: [{ sku: "P008-BLAC-M", qty: 4 }] }, products, s, {}, during); // ₹996
  assert.equal(q.discount, 249);
  assert.equal(q.festivalOffer, "Christmas offer (25% off)");
  const qc = computeQuote({ items: [{ sku: "P008-BLAC-M", qty: 4 }], couponCode: "AURA50" }, products, s, {}, during);
  assert.equal(qc.discount, 249); // offer beats the ₹50 coupon; they don't stack
  assert.equal(qc.couponCode, null);
  const after = computeQuote({ items: [{ sku: "P008-BLAC-M", qty: 4 }] }, products, s, {}, { now: new Date("2026-12-26T09:00:00+05:30") });
  assert.equal(after.discount, 0);
  assert.equal(after.festivalOffer, null);
});
