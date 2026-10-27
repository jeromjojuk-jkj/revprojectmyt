import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCoupon, normalizeCoupon, validateCouponInput } from "../../src/lib/coupons.ts";
import { ALL_PERMISSIONS, BUILT_IN_ROLES, can, canGrant, findRole } from "../../src/lib/rbac.ts";
import { base32Decode, base32Encode, totpAt, verifyTotp } from "../../src/lib/totp.ts";
import { hashPassword, passwordProblem, verifyPassword } from "../../src/lib/passwords.ts";
import { allowedOps, paymentStateOf, fulfilmentStateOf } from "../../src/lib/orderflow.ts";
import { computeKpis, rangeForDays, change, workQueue } from "../../src/lib/metrics.ts";
import { validateStoreProfile } from "../../src/lib/storeProfile.ts";
import { filterOrders } from "../../src/lib/orderQuery.ts";
import { breadcrumbs, navFor } from "../../src/lib/adminNav.ts";
import type { Order } from "../../src/lib/types.ts";

const NOW = new Date("2026-10-21T06:00:00Z");

// ---------- Coupons ----------

const lines = [{ category: "women" as const, lineTotal: 800 }, { category: "beauty" as const, lineTotal: 200 }];

test("coupon: percent off with cap, category restriction", () => {
  const c = normalizeCoupon({ code: "GLOW20", kind: "percent", amountOff: 20, maxDiscount: 30, minSubtotal: 0, categories: ["beauty"] });
  const r = evaluateCoupon(c, lines, NOW);
  assert.ok(r.ok);
  assert.equal(r.ok && r.discount, 30); // 20% of 200 = 40, capped at 30
});

test("coupon: dates, minimum and usage limits", () => {
  const base = { code: "X", amountOff: 50, minSubtotal: 0 };
  assert.equal(evaluateCoupon(normalizeCoupon({ ...base, startsOn: "2026-10-22" }), lines, NOW).ok, false);
  assert.equal(evaluateCoupon(normalizeCoupon({ ...base, endsOn: "2026-10-20" }), lines, NOW).ok, false);
  assert.equal(evaluateCoupon(normalizeCoupon({ ...base, endsOn: "2026-10-21" }), lines, NOW).ok, true); // inclusive, IST
  assert.equal(evaluateCoupon(normalizeCoupon({ ...base, minSubtotal: 1500 }), lines, NOW).ok, false);
  assert.equal(evaluateCoupon(normalizeCoupon({ ...base, usageLimit: 2 }), lines, NOW, { total: 2, byCustomer: 0, customerHasOrders: false }).ok, false);
  assert.equal(evaluateCoupon(normalizeCoupon({ ...base, perCustomerLimit: 1 }), lines, NOW, { total: 5, byCustomer: 1, customerHasOrders: true }).ok, false);
  assert.equal(evaluateCoupon(normalizeCoupon({ ...base, firstOrderOnly: true }), lines, NOW, { total: 0, byCustomer: 0, customerHasOrders: true }).ok, false);
  // Without checkout context (bag quote), per-customer rules can't be judged yet and don't block.
  assert.equal(evaluateCoupon(normalizeCoupon({ ...base, firstOrderOnly: true }), lines, NOW).ok, true);
  // Never more than the eligible amount.
  const big = evaluateCoupon(normalizeCoupon({ code: "BIG", amountOff: 5000, minSubtotal: 0 }), lines, NOW);
  assert.equal(big.ok && big.discount, 1000);
});

test("coupon: admin input validation", () => {
  const bad = validateCouponInput({ code: "a", kind: "percent", amountOff: "95", startsOn: "2026-10-10", endsOn: "2026-10-01" }, ["women"]);
  assert.equal(bad.ok, false);
  assert.ok(!bad.ok && bad.errors.code && bad.errors.amountOff && bad.errors.endsOn);
  const good = validateCouponInput({ code: "fest10", kind: "percent", amountOff: "10", maxDiscount: "100", minSubtotal: "499", active: "on", categories: "women" }, ["women"]);
  assert.ok(good.ok);
  assert.equal(good.ok && good.coupon.code, "FEST10");
  assert.match(good.ok ? good.coupon.description : "", /10% off \(up to ₹100\) on orders of ₹499\+/);
});

// ---------- RBAC ----------

test("rbac: built-in roles and escalation guard", () => {
  const sa = findRole([], "super_admin")!;
  const analyst = findRole([], "analyst")!;
  const orders = findRole([], "order_manager")!;
  assert.equal(sa.permissions.length, ALL_PERMISSIONS.length);
  assert.ok(can(analyst, "orders.view"));
  assert.ok(!can(analyst, "orders.edit"));
  assert.ok(!can(orders, "orders.refund"), "order managers can't refund");
  assert.ok(can(findRole([], "finance_manager"), "orders.refund"));
  assert.ok(!BUILT_IN_ROLES.filter((r) => r.id !== "super_admin").some((r) => can(r, "staff.manage")));
  assert.ok(canGrant(sa, orders));
  assert.ok(!canGrant(orders, sa));
  assert.ok(!canGrant(analyst, orders));
});

test("rbac: sidebar hides modules without permission", () => {
  const analyst = findRole([], "analyst")!;
  const items = navFor((p) => can(analyst, p)).flatMap((g) => g.items.map((i) => i.href));
  assert.ok(items.includes("/admin/orders"));
  assert.ok(!items.includes("/admin/staff"));
  assert.ok(!items.includes("/admin/import"));
  assert.deepEqual(breadcrumbs("/admin/orders/KRP-1").map((c) => c.label), ["Admin", "Orders", "KRP-1"]);
});

// ---------- TOTP & passwords ----------

test("totp: RFC 6238 SHA-1 test vector and drift window", () => {
  const secret = base32Encode(Buffer.from("12345678901234567890"));
  assert.equal(base32Decode(secret).toString(), "12345678901234567890");
  // RFC 6238 Appendix B: T = 59s → 94287082 (8 digits); last 6 digits = 287082.
  assert.equal(totpAt(secret, 1, 8), "94287082");
  const now = 1_700_000_000_000;
  const code = totpAt(secret, Math.floor(now / 30_000));
  assert.ok(verifyTotp(secret, code, now));
  assert.ok(verifyTotp(secret, code, now + 30_000));
  assert.ok(!verifyTotp(secret, code, now + 90_000));
  assert.ok(!verifyTotp(secret, "12345", now));
});

test("passwords: scrypt hash round-trip and policy", () => {
  const h = hashPassword("correct horse battery");
  assert.match(h, /^scrypt\$/);
  assert.ok(!h.includes("correct"));
  assert.ok(verifyPassword("correct horse battery", h));
  assert.ok(!verifyPassword("wrong horse battery", h));
  assert.ok(passwordProblem("short"));
  assert.ok(passwordProblem("krip-admin-demo"));
  assert.ok(passwordProblem("priya.sharma.2026", "priya.sharma@krip.in"));
  assert.equal(passwordProblem("lantern-mango-river-42"), null);
});

// ---------- Orders ----------

function order(over: Partial<Order>): Order {
  return {
    id: "KRP-1", accessToken: "t", idempotencyKey: "k", createdAt: "2026-10-20T10:00:00Z",
    items: [{ productId: "p001", slug: "s", sku: "SKU1", title: "Tee", color: "Black", size: "M", image: "", unitPrice: 500, qty: 2 }],
    subtotal: 1000, delivery: 49, codFee: 0, discount: 100, couponCode: "X", total: 949,
    address: { name: "Asha", phone: "9876543210", email: "", line1: "1 Road", line2: "", landmark: "", city: "Pune", state: "Maharashtra", pincode: "411001" },
    paymentMethod: "online", paymentProvider: "demo", status: "confirmed", statusHistory: [],
    paymentEvents: [{ id: "e1", provider: "demo", type: "payment.succeeded", at: "2026-10-20T10:01:00Z", amount: 949, reference: "r" }],
    reservationExpiresAt: null, stockHeld: true, demo: true, ...over,
  };
}

test("order lifecycle: allowed actions follow state", () => {
  assert.deepEqual(allowedOps(order({ status: "placed", paymentMethod: "cod", paymentEvents: [] })).sort(), ["cancel", "confirm", "hold", "note"].sort());
  assert.ok(allowedOps(order({ status: "confirmed" })).includes("pack"));
  assert.ok(allowedOps(order({ status: "confirmed" })).includes("refund"), "paid online orders can be refunded");
  assert.ok(!allowedOps(order({ status: "confirmed", onHold: true })).includes("pack"), "held orders can't advance");
  assert.ok(allowedOps(order({ status: "confirmed", onHold: true })).includes("release"));
  assert.ok(!allowedOps(order({ status: "shipped" })).includes("cancel"));
  assert.ok(!allowedOps(order({ status: "payment_pending", paymentEvents: [] })).includes("refund"), "no refund without a verified payment");
  const cod = order({ status: "delivered", paymentMethod: "cod", paymentEvents: [] });
  assert.ok(allowedOps(cod).includes("cod_collected"));
  assert.ok(!allowedOps(cod).includes("refund"), "COD can't be refunded before it's collected");
});

test("order lifecycle: payment and fulfilment states", () => {
  assert.equal(paymentStateOf(order({})), "paid");
  assert.equal(paymentStateOf(order({ refunds: [{ id: "r", amount: 100, reason: "x", mode: "demo", reference: "d", at: "", by: "" }] })), "partially_refunded");
  assert.equal(paymentStateOf(order({ refunds: [{ id: "r", amount: 949, reason: "x", mode: "demo", reference: "d", at: "", by: "" }] })), "refunded");
  assert.equal(paymentStateOf(order({ status: "payment_pending", paymentEvents: [] })), "pending");
  // A success event with the wrong amount is not money received.
  assert.equal(paymentStateOf(order({ status: "payment_pending", paymentEvents: [{ id: "e", provider: "d", type: "payment.succeeded", at: "", amount: 1, reference: "" }] })), "pending");
  assert.equal(paymentStateOf(order({ paymentMethod: "cod", paymentEvents: [], status: "shipped" })), "cod_due");
  assert.equal(fulfilmentStateOf(order({ status: "packed" })), "packed");
});

test("metrics: formulas, ranges and comparisons", () => {
  const { current, previous } = rangeForDays(7, NOW);
  assert.equal(current.to.toISOString(), "2026-10-21T18:30:00.000Z"); // end of today, IST
  assert.equal(previous.to.getTime(), current.from.getTime());
  const orders = [
    order({ id: "A" }),
    order({ id: "B", address: { ...order({}).address, phone: "9000000001" }, status: "cancelled", refunds: [{ id: "r", amount: 949, reason: "x", mode: "demo", reference: "", at: "2026-10-20T12:00:00Z", by: "" }] }),
    order({ id: "C", status: "payment_failed", paymentEvents: [] }),
    order({ id: "D", createdAt: "2026-09-01T10:00:00Z" }),
  ];
  const k = computeKpis(orders, current);
  assert.equal(k.orders, 1); // cancelled and failed excluded
  assert.equal(k.grossSales, 1000);
  assert.equal(k.discounts, 100);
  assert.equal(k.refunds, 949);
  assert.equal(k.netSales, 1000 - 100 - 949);
  assert.equal(k.aov, 949);
  assert.equal(k.customers, 1);
  assert.equal(k.returningCustomers, 1, "same phone ordered in September");
  assert.equal(change(110, 100), 10);
  assert.equal(change(5, 0), null);
  assert.equal(workQueue(orders).pendingRefunds, 0, "fully refunded");
});

test("order search covers id, phone, AWB and filters", () => {
  const list = [order({ id: "KRP-AAA", shipments: [{ id: "s", carrier: "Delhivery", awb: "DL12345", trackingUrl: null, createdAt: "", createdBy: "", events: [] }] }), order({ id: "KRP-BBB", total: 300 })];
  assert.equal(filterOrders(list, { q: "dl123" }).length, 1);
  assert.equal(filterOrders(list, { q: "43210" }).length, 2);
  assert.equal(filterOrders(list, { max: "500" })[0].id, "KRP-BBB");
  assert.deepEqual(filterOrders(list, { sort: "total:asc" }).map((o) => o.id), ["KRP-BBB", "KRP-AAA"]);
});

// ---------- Store profile ----------

test("store profile: validates public contact details", () => {
  const bad = validateStoreProfile({ name: "Krip", supportEmail: "nope", instagram: "https://evil.example/krip", gstin: "123", announcementActive: "on", announcementText: "" }, {});
  assert.equal(bad.ok, false);
  assert.ok(!bad.ok && bad.errors.supportEmail && bad.errors.instagram && bad.errors.gstin && bad.errors.announcementText);
  const good = validateStoreProfile({ name: "Krip", supportEmail: "help@krip.in", instagram: "https://www.instagram.com/krip", gstin: "27abcde1234f1z5", lowStockThreshold: "5" }, { acceptedPayments: ["UPI", "Bitcoin"] });
  assert.ok(good.ok);
  assert.equal(good.ok && good.value.gstin, "27ABCDE1234F1Z5");
  assert.deepEqual(good.ok && good.value.acceptedPayments, ["UPI"]);
});
