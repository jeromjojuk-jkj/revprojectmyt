import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeedProducts } from "../../src/data/catalog.ts";
import { computeQuote } from "../../src/lib/pricing.ts";
import type { Order, ProductPublic, Settings } from "../../src/lib/types.ts";
import { normalizeCoupon } from "../../src/lib/coupons.ts";
import { DEFAULT_DELIVERY } from "../../src/lib/pincode.ts";
import { addWorkingDays, validateShipping, vendorShares } from "../../src/lib/vendorPlans.ts";
import { applyVendorOp, allowedVendorOps, FulfilmentError } from "../../src/lib/vendorFulfilment.ts";
import { validateRegistration, validateVendorProduct } from "../../src/lib/vendorInput.ts";

const base = buildSeedProducts("fashion").map(({ private: _p, ...pub }) => pub);
const kripP = base.find((p) => p.status === "active" && p.price >= 300 && p.variants[0].stock > 2)!;
const sellerP: ProductPublic = { ...base.find((p) => p.status === "active" && p.id !== kripP.id && p.variants[0].stock > 2)!, vendorId: "VND-AAAAAA", price: 400 };
const products = [kripP, sellerP];
const settings: Settings = {
  deliveryFee: 49, freeDeliveryAbove: null, codFee: 20, codMaxOrderValue: 3000, returnAllowancePct: 8,
  channelFees: [{ channel: "Krip", marketplaceFeePct: 0, paymentFeePct: 2, fixedFee: 0 }],
  coupons: [normalizeCoupon({ code: "FLAT50", description: "x", amountOff: 50, minSubtotal: 1, active: true })],
  delivery: DEFAULT_DELIVERY,
};
const vendorShipping = { "VND-AAAAAA": { name: "Asha Stores", fee: 40, freeAbove: 1000 } };
const k = (qty = 1) => ({ sku: kripP.variants[0].sku, qty });
const sv = (qty = 1) => ({ sku: sellerP.variants[0].sku, qty });

test("each seller's delivery charge is added separately from Krip's", () => {
  const q = computeQuote({ items: [k(), sv()], pincode: "560001" }, products, settings, {}, { vendorShipping });
  assert.deepEqual(q.deliveryParts.map((d) => [d.vendorId, d.amount]), [[null, 49], ["VND-AAAAAA", 40]]);
  assert.equal(q.delivery, 89);
  assert.equal(q.total, q.subtotal + 89);
  const free = computeQuote({ items: [sv(3)] }, products, settings, {}, { vendorShipping });
  assert.equal(free.delivery, 0, "seller's free-delivery threshold");
  assert.equal(free.deliveryParts.length, 1);
});

test("coupons apply to Krip's items only; seller-only bags get no Krip discount", () => {
  const mixed = computeQuote({ items: [k(), sv()], couponCode: "FLAT50" }, products, settings, {}, { vendorShipping });
  assert.equal(mixed.discount, 50);
  const only = computeQuote({ items: [sv()], couponCode: "FLAT50" }, products, settings, {}, { vendorShipping });
  assert.equal(only.discount, 0);
  assert.match(only.couponMessage!, /sold by Krip/);
});

test("Cash on Delivery is off when the bag has a seller's item", () => {
  const q = computeQuote({ items: [k(), sv()], pincode: "560001", paymentMethod: "cod" }, products, settings, {}, { vendorShipping });
  assert.equal(q.codAvailable, false);
  assert.equal(q.codFee, 0);
  assert.equal(computeQuote({ items: [k()], pincode: "560001", paymentMethod: "cod" }, products, settings).codAvailable, true);
});

test("seller payout = items + their delivery charge − ₹10 per unit", () => {
  const o = { items: [{ vendorId: "V1", unitPrice: 499, qty: 3 }, { vendorId: null, unitPrice: 200, qty: 1 }], vendorParts: [{ vendorId: "V1", delivery: 40 }] } as unknown as Order;
  const s = vendorShares(o, 10).get("V1")!;
  assert.deepEqual(s, { items: 1497, units: 3, delivery: 40, commission: 30, payout: 1507 });
  assert.equal(vendorShares(o, 10).size, 1);
});

test("dispatch deadline skips Sundays (IST)", () => {
  // Sat 14 Nov 2026, 10:00 IST + 2 working days → Tue 17 Nov.
  const d = addWorkingDays(new Date("2026-11-14T04:30:00Z"), 2);
  assert.equal(d.toISOString().slice(0, 10), "2026-11-17");
});

test("shipping settings are validated", () => {
  assert.equal(validateShipping({ fee: "49", freeAbove: "", handlingDays: "2" }).ok, true);
  const bad = validateShipping({ fee: "-1", freeAbove: "abc", handlingDays: "9" });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["fee", "freeAbove", "handlingDays"]);
});

function sellerOrder(): Order {
  return {
    id: "KRP-1", status: "placed", statusHistory: [], items: [{ vendorId: "V1", sku: "A", qty: 1, unitPrice: 300 }],
    vendorParts: [{ vendorId: "V1", status: "new", delivery: 0, dispatchBy: new Date(Date.now() + 86400_000).toISOString(), history: [], shipmentId: null }],
  } as unknown as Order;
}

test("seller moves their part step by step; a seller-only order follows it", () => {
  const o = sellerOrder();
  assert.throws(() => applyVendorOp(o, "V1", "ship", { carrier: "DTDC", awb: "D123456" }, "s"), FulfilmentError, "can't skip steps");
  applyVendorOp(o, "V1", "accept", {}, "s");
  assert.equal(o.status, "confirmed");
  applyVendorOp(o, "V1", "pack", {}, "s");
  assert.equal(o.status, "packed");
  assert.throws(() => applyVendorOp(o, "V1", "ship", { carrier: "DTDC", awb: "x" }, "s"), /AWB/);
  assert.throws(() => applyVendorOp(o, "V1", "ship", { carrier: "DTDC", awb: "D123456", trackingUrl: "http://x.y" }, "s"), /https/);
  applyVendorOp(o, "V1", "ship", { carrier: "DTDC", awb: "D123456" }, "s");
  assert.equal(o.status, "shipped");
  assert.equal(o.shipments!.length, 1);
  assert.equal(o.shipments![0].vendorId, "V1");
  applyVendorOp(o, "V1", "tracking", { update: "Out for delivery" }, "s");
  assert.equal(o.shipments![0].events.at(-1)!.status, "Out for delivery");
  applyVendorOp(o, "V1", "deliver", {}, "s");
  assert.equal(o.status, "delivered");
  assert.deepEqual(allowedVendorOps(o, o.vendorParts![0]), []);
});

test("another seller can't touch the order; a mixed order's status stays with Krip", () => {
  const o = sellerOrder();
  assert.throws(() => applyVendorOp(o, "V2", "accept", {}, "s"), /none of your items/);
  o.items.push({ vendorId: null, sku: "K", qty: 1, unitPrice: 100 } as Order["items"][number]);
  applyVendorOp(o, "V1", "accept", {}, "s");
  assert.equal(o.status, "placed");
});

test("unpaid, cancelled or held orders can't be updated by the seller", () => {
  for (const patch of [{ status: "payment_pending" }, { status: "cancelled" }, { onHold: true }]) {
    const o = Object.assign(sellerOrder(), patch);
    assert.throws(() => applyVendorOp(o, "V1", "accept", {}, "s"), FulfilmentError);
  }
});

test("can't-ship report needs a reason and leaves a note for Krip", () => {
  const o = sellerOrder();
  assert.throws(() => applyVendorOp(o, "V1", "issue", { note: "no" }, "s"), /why/);
  applyVendorOp(o, "V1", "issue", { note: "Out of stock" }, "Seller: Asha");
  assert.equal(o.vendorParts![0].status, "cancel_requested");
  assert.match(o.notes!.at(-1)!.text, /Out of stock/);
});

test("seller registration validation", () => {
  const good = {
    plan: "premium", businessName: "Asha Stores", ownerName: "Asha K", email: "asha@example.com", phone: "+91 98765 43210", password: "correct-horse-battery", password2: "correct-horse-battery",
    address: "12 MG Road, Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038", gstin: "", pan: "abcde1234f", bankHolder: "Asha K", ifsc: "sbin0001234",
    account: "123456789012", account2: "1234 5678 9012", upi: "", terms: "on",
  };
  const r = validateRegistration(good);
  assert.equal(r.ok, true);
  if (r.ok) { assert.equal(r.value.phone, "9876543210"); assert.equal(r.value.pan, "ABCDE1234F"); }
  const bad = validateRegistration({ ...good, plan: "gold", pan: "123", ifsc: "SBIN1234567", account2: "1", terms: "" });
  assert.equal(bad.ok, false);
  if (!bad.ok) for (const k of ["plan", "pan", "ifsc", "account2", "terms"]) assert.ok(bad.errors[k], k);
});

test("seller listing validation: https photos, MRP not below price, rights confirmed", () => {
  const raw = { title: "Steel Chopper 3 Blades", category: "kitchen", description: "A hand-pull chopper with three steel blades.", price: "299", mrp: "499", stock: "10", images: "https://x.example/a.jpg", rights: "on" };
  assert.equal(validateVendorProduct(raw, ["kitchen"]).ok, true);
  const bad = validateVendorProduct({ ...raw, mrp: "100", images: "http://x/a.jpg", rights: "" }, ["kitchen"]);
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["images", "mrp", "rights"]);
});
