import "server-only";
import crypto from "node:crypto";
import type { Address, Order, OrderStatus, PaymentMethod } from "../types";
import { allowedOps, paidAmount, refundedAmount, type OrderOp } from "../orderflow";
import { moveStock } from "./inventory";
import { audit, type Actor } from "./audit";
import { computeQuote } from "../pricing";
import { isValidPincode, estimateDelivery } from "../pincode";
import { INDIAN_STATES } from "../constants";
import { readDb, withDb, type DB } from "./db";
import { toPublicProduct } from "./catalog";
import { paymentConfig, verifySignature, type GatewayEvent } from "./payments";

const RESERVATION_MINUTES = 15;

export class OrderError extends Error {
  constructor(message: string, public code: string, public status = 400, public extra?: unknown) {
    super(message);
  }
}

export function validateAddress(a: Partial<Address>): { ok: true; value: Address } | { ok: false; errors: Record<string, string> } {
  const s = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const value: Address = {
    name: s(a.name, 60),
    // Strip a +91 / 91 country code only when it precedes a full 10-digit number,
    // so mobiles that themselves start with 91 (e.g. 91234 56780) stay intact.
    phone: s(a.phone, 15).replace(/[\s-]/g, "").replace(/^(\+?91|0)(?=\d{10}$)/, ""),
    email: s(a.email, 120),
    line1: s(a.line1),
    line2: s(a.line2),
    landmark: s(a.landmark),
    city: s(a.city, 60),
    state: s(a.state, 60),
    pincode: s(a.pincode, 6),
  };
  const errors: Record<string, string> = {};
  if (value.name.length < 2) errors.name = "Enter the recipient’s full name.";
  if (!/^[6-9]\d{9}$/.test(value.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email)) errors.email = "Enter a valid email or leave it blank.";
  if (value.line1.length < 5) errors.line1 = "Enter house/flat number and building or street.";
  if (value.city.length < 2) errors.city = "Enter your city or town.";
  if (!INDIAN_STATES.includes(value.state)) errors.state = "Choose your state.";
  if (!isValidPincode(value.pincode)) errors.pincode = "Enter a valid 6-digit pincode.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

function releaseStock(db: DB, order: Order, by = "system") {
  if (!order.stockHeld) return;
  for (const it of order.items) {
    const p = db.products.find((x) => x.id === it.productId);
    if (p?.variants.some((x) => x.sku === it.sku)) moveStock(db, it.sku, it.qty, "order_released", order.id, by);
  }
  order.stockHeld = false;
}

/** Normalised phone used to count coupon use per customer. */
export const customerKey = (phone: string) => crypto.createHash("sha256").update(phone.replace(/\D/g, "").slice(-10)).digest("hex").slice(0, 16);

function setStatus(order: Order, status: OrderStatus, note?: string) {
  order.status = status;
  order.statusHistory.push({ status, at: new Date().toISOString(), note });
}

/** Releases stock held by abandoned online payments. Runs inside a write lock. */
export function sweepExpired(db: DB, now = Date.now()) {
  for (const o of db.orders) {
    if (o.status === "payment_pending" && o.reservationExpiresAt && Date.parse(o.reservationExpiresAt) < now) {
      releaseStock(db, o);
      setStatus(o, "payment_failed", "Payment not completed in time. Items released.");
    }
  }
}

export interface CreateOrderInput {
  idempotencyKey: string;
  items: { sku: string; qty: number }[];
  address: Partial<Address>;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  /** Total the shopper saw; if the server total differs, we refuse and re-quote. */
  expectedTotal: number;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (typeof input.idempotencyKey !== "string" || !/^[A-Za-z0-9-]{16,64}$/.test(input.idempotencyKey)) {
    throw new OrderError("Missing checkout session. Please refresh and try again.", "bad_idempotency_key");
  }
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 30) {
    throw new OrderError("Your bag is empty.", "empty_cart");
  }
  const addr = validateAddress(input.address ?? {});
  if (!addr.ok) throw new OrderError("Please fix the highlighted address fields.", "invalid_address", 400, addr.errors);
  if (input.paymentMethod !== "online" && input.paymentMethod !== "cod") {
    throw new OrderError("Choose a payment method.", "invalid_payment_method");
  }
  const pay = paymentConfig();
  if (input.paymentMethod === "online" && !pay.onlineEnabled) {
    throw new OrderError("Online payment isn’t available right now.", "online_disabled");
  }
  const est = estimateDelivery(addr.value.pincode);
  if (!est?.serviceable) throw new OrderError("We don’t deliver to this pincode yet.", "unserviceable");

  return withDb((db) => {
    if (db.store.maintenance.active) throw new OrderError("The store is in maintenance mode. Please try again later.", "maintenance", 503);
    // Duplicate submit (double tap, retry after network error) → same order.
    const existing = db.orders.find((o) => o.idempotencyKey === input.idempotencyKey);
    if (existing) return existing;

    sweepExpired(db);
    // Coupon limits are checked here, inside the write lock, so two checkouts can't both take the last redemption.
    const key = customerKey(addr.value.phone);
    const code = input.couponCode?.trim().toUpperCase();
    const booked = db.orders.filter((o) => o.status !== "payment_failed" && o.status !== "cancelled");
    const couponUsage = {
      total: code ? booked.filter((o) => o.couponCode === code).length : 0,
      byCustomer: code ? booked.filter((o) => o.couponCode === code && customerKey(o.address.phone) === key).length : 0,
      customerHasOrders: booked.some((o) => customerKey(o.address.phone) === key),
    };
    const quote = computeQuote(
      { items: input.items, pincode: addr.value.pincode, paymentMethod: input.paymentMethod, couponCode: input.couponCode },
      db.products.map(toPublicProduct),
      db.settings,
      {},
      { couponUsage },
    );
    if (code && !quote.couponCode) {
      throw new OrderError(quote.couponMessage ?? "This code can’t be used.", "coupon_invalid", 409, quote);
    }
    if (!quote.allAvailable) {
      throw new OrderError("Some items in your bag changed. Please review your bag.", "items_unavailable", 409, quote);
    }
    if (input.paymentMethod === "cod" && !quote.codAvailable) {
      throw new OrderError(quote.codReason ?? "Cash on Delivery isn’t available.", "cod_unavailable", 409, quote);
    }
    if (Math.round(input.expectedTotal) !== quote.total) {
      throw new OrderError("Prices or charges changed since you last looked. Please confirm the new total.", "total_changed", 409, quote);
    }

    // Reserve stock atomically (we're inside the lock, and checked availability above).
    for (const l of quote.lines) {
      const v = db.products.find((p) => p.id === l.productId)!.variants.find((x) => x.sku === l.sku)!;
      if (v.stock < l.qty) throw new OrderError("An item just sold out.", "items_unavailable", 409, quote);
    }
    const now = new Date();
    const orderId = `KRP-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    for (const l of quote.lines) moveStock(db, l.sku, -l.qty, "order_reserved", orderId, "checkout");

    const order: Order = {
      id: orderId,
      accessToken: crypto.randomBytes(18).toString("base64url"),
      idempotencyKey: input.idempotencyKey,
      createdAt: now.toISOString(),
      items: quote.lines.map((l) => ({
        productId: l.productId!, slug: l.slug!, sku: l.sku, title: l.title, color: l.color, size: l.size,
        image: l.image, unitPrice: l.unitPrice, qty: l.qty,
      })),
      subtotal: quote.subtotal,
      delivery: quote.delivery,
      codFee: quote.codFee,
      discount: quote.discount,
      couponCode: quote.couponCode,
      total: quote.total,
      address: addr.value,
      paymentMethod: input.paymentMethod,
      paymentProvider: input.paymentMethod === "cod" ? "cod" : pay.provider,
      status: input.paymentMethod === "cod" ? "placed" : "payment_pending",
      statusHistory: [],
      paymentEvents: [],
      reservationExpiresAt: input.paymentMethod === "online" ? new Date(now.getTime() + RESERVATION_MINUTES * 60_000).toISOString() : null,
      stockHeld: true,
      demo: pay.demo || input.paymentMethod === "cod",
    };
    setStatus(order, order.status, input.paymentMethod === "cod" ? "Cash on Delivery order recorded." : "Awaiting payment confirmation.");
    db.orders.push(order);
    return order;
  });
}

export async function getOrderForCustomer(id: string, token: string): Promise<Order | null> {
  const db = await readDb();
  const o = db.orders.find((x) => x.id === id);
  if (!o || !token) return null;
  const a = Buffer.from(o.accessToken);
  const b = Buffer.from(token);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return o;
}

/**
 * The ONLY way an online payment becomes "confirmed": a correctly signed event
 * from the payment provider whose amount matches the order total.
 */
export async function handlePaymentWebhook(raw: string, signature: string | null) {
  if (!(await verifySignature(raw, signature))) throw new OrderError("Invalid signature", "bad_signature", 401);
  let ev: GatewayEvent;
  try {
    ev = JSON.parse(raw);
  } catch {
    throw new OrderError("Malformed event", "bad_event", 400);
  }
  return withDb((db) => {
    if (db.processedPaymentEvents.includes(ev.id)) return { duplicate: true };
    const order = db.orders.find((o) => o.id === ev.orderId);
    if (!order) throw new OrderError("Unknown order", "unknown_order", 404);
    db.processedPaymentEvents.push(ev.id);
    order.paymentEvents.push({ id: ev.id, provider: ev.provider, type: ev.type, at: ev.createdAt, amount: ev.amount, reference: ev.reference });

    if (order.status !== "payment_pending") {
      // e.g. success arriving after the reservation expired. Flag for manual refund review.
      order.statusHistory.push({ status: order.status, at: new Date().toISOString(), note: `Late ${ev.type} event received — needs manual review.` });
      return { ignored: true };
    }
    if (ev.type === "payment.succeeded") {
      if (ev.amount !== order.total) {
        order.statusHistory.push({ status: order.status, at: new Date().toISOString(), note: "Amount mismatch on payment event — needs manual review." });
        return { mismatch: true };
      }
      order.reservationExpiresAt = null;
      setStatus(order, "confirmed", `Payment confirmed by ${ev.provider}${order.demo ? " (demo)" : ""}. Ref ${ev.reference}.`);
    } else {
      releaseStock(db, order);
      order.reservationExpiresAt = null;
      setStatus(order, "payment_failed", `Payment failed (${ev.provider}). No charge recorded.`);
    }
    return { ok: true };
  });
}

/** Re-attempt payment on a failed order: re-reserves stock if still available. */
export async function retryPayment(id: string, token: string) {
  const o = await getOrderForCustomer(id, token);
  if (!o) throw new OrderError("Order not found", "not_found", 404);
  return withDb((db) => {
    sweepExpired(db);
    const order = db.orders.find((x) => x.id === id)!;
    if (order.status === "payment_pending") return order;
    if (order.status !== "payment_failed") throw new OrderError("This order can’t be paid again.", "bad_state");
    for (const it of order.items) {
      const p = db.products.find((x) => x.id === it.productId);
      const v = p?.variants.find((x) => x.sku === it.sku);
      if (!p || p.status !== "active" || !v || v.stock < it.qty || p.price !== it.unitPrice) {
        throw new OrderError("Something in this order changed or sold out. Please start a new checkout from your bag.", "items_unavailable", 409);
      }
    }
    for (const it of order.items) moveStock(db, it.sku, -it.qty, "order_reserved", order.id, "checkout");
    order.stockHeld = true;
    order.reservationExpiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000).toISOString();
    setStatus(order, "payment_pending", "Retrying payment.");
    return order;
  });
}

const CANCELLABLE: OrderStatus[] = ["payment_pending", "placed", "confirmed"];

export async function cancelOrderByCustomer(id: string, token: string) {
  const o = await getOrderForCustomer(id, token);
  if (!o) throw new OrderError("Order not found", "not_found", 404);
  return withDb((db) => {
    const order = db.orders.find((x) => x.id === id)!;
    if (!CANCELLABLE.includes(order.status)) throw new OrderError("This order can no longer be cancelled.", "bad_state");
    const wasPaid = order.status === "confirmed" && order.paymentMethod === "online";
    releaseStock(db, order);
    setStatus(order, "cancelled", wasPaid ? "Cancelled by customer. Refund must be issued through the payment provider." : "Cancelled by customer.");
    return order;
  });
}

export interface OrderActionInput {
  op: OrderOp;
  note?: string;
  carrier?: string;
  awb?: string;
  trackingUrl?: string;
  amount?: number;
  reason?: string;
  reference?: string;
}

/**
 * Every staff change to an order goes through here. The action is checked
 * against the order's current state (see allowedOps) and audited.
 */
export async function adminOrderAction(id: string, input: OrderActionInput, actor: Actor) {
  return withDb((db) => {
    sweepExpired(db);
    const order = db.orders.find((x) => x.id === id);
    if (!order) throw new OrderError("Order not found", "not_found", 404);
    if (!allowedOps(order).includes(input.op)) throw new OrderError(`“${input.op}” isn’t possible while the order is ${order.status}${order.onHold ? " (on hold)" : ""}.`, "bad_state");
    const note = input.note?.trim().slice(0, 300) || undefined;
    const before = { status: order.status, onHold: !!order.onHold };
    const now = new Date().toISOString();
    switch (input.op) {
      case "confirm":
        setStatus(order, "confirmed", note ?? `Confirmed by ${actor.name}.`);
        break;
      case "pack":
        setStatus(order, "packed", note ?? `Packed by ${actor.name}.`);
        break;
      case "ship": {
        const carrier = input.carrier?.trim().slice(0, 60) ?? "";
        const awb = input.awb?.trim().slice(0, 40) ?? "";
        if (carrier.length < 2) throw new OrderError("Enter the courier name.", "invalid");
        if (!/^[A-Za-z0-9-]{4,40}$/.test(awb)) throw new OrderError("Enter the AWB / tracking number (letters, digits, dashes).", "invalid");
        let trackingUrl: string | null = null;
        if (input.trackingUrl?.trim()) {
          try {
            const u = new URL(input.trackingUrl.trim());
            if (u.protocol !== "https:") throw new Error();
            trackingUrl = u.toString();
          } catch {
            throw new OrderError("Tracking link must be a full https:// URL.", "invalid");
          }
        }
        order.shipments ??= [];
        order.shipments.push({ id: crypto.randomBytes(4).toString("hex"), carrier, awb, trackingUrl, createdAt: now, createdBy: actor.name, events: [{ at: now, status: "Shipped", note }] });
        setStatus(order, "shipped", `Shipped with ${carrier}, AWB ${awb}.`);
        break;
      }
      case "tracking": {
        const s = order.shipments?.at(-1);
        if (!s || !note) throw new OrderError("Enter a tracking update.", "invalid");
        s.events.push({ at: now, status: "Update", note });
        break;
      }
      case "deliver":
        order.shipments?.at(-1)?.events.push({ at: now, status: "Delivered", note });
        setStatus(order, "delivered", note ?? "Marked delivered.");
        break;
      case "cod_collected":
        order.codCollectedAt = now;
        order.statusHistory.push({ status: order.status, at: now, note: `COD amount ₹${order.total} collected${note ? `: ${note}` : "."}` });
        break;
      case "cancel": {
        const paid = paidAmount(order) - refundedAmount(order);
        releaseStock(db, order, actor.name);
        order.onHold = false;
        setStatus(order, "cancelled", (note ? `${note}. ` : "") + (paid > 0 ? `Paid ₹${paid} — refund due.` : "Cancelled by Krip."));
        break;
      }
      case "hold":
        if (!note) throw new OrderError("Give a reason for the hold.", "invalid");
        order.onHold = true;
        order.statusHistory.push({ status: order.status, at: now, note: `On hold: ${note}` });
        break;
      case "release":
        order.onHold = false;
        order.statusHistory.push({ status: order.status, at: now, note: `Hold released${note ? `: ${note}` : "."}` });
        break;
      case "note":
        if (!note) throw new OrderError("Write a note first.", "invalid");
        order.notes ??= [];
        order.notes.push({ at: now, by: actor.name, text: note });
        break;
      case "refund": {
        const remaining = paidAmount(order) - refundedAmount(order);
        const amount = Math.round(Number(input.amount));
        if (!(Number.isInteger(amount) && amount > 0)) throw new OrderError("Enter a refund amount in whole rupees.", "invalid");
        if (amount > remaining) throw new OrderError(`Refund can’t exceed ₹${remaining} (amount paid minus earlier refunds).`, "invalid");
        const reason = input.reason?.trim().slice(0, 200) ?? "";
        if (reason.length < 3) throw new OrderError("Give a refund reason.", "invalid");
        const reference = input.reference?.trim().slice(0, 80) ?? "";
        // No refund API is connected: real refunds are issued in the provider's dashboard (or by bank/UPI
        // transfer for COD) and recorded here with their reference. Demo orders move no money.
        const mode = order.demo ? "demo" : order.paymentMethod === "cod" ? "cod-manual" : "provider";
        if (mode !== "demo" && reference.length < 4) throw new OrderError("Enter the refund reference from the payment provider or bank transfer.", "invalid");
        order.refunds ??= [];
        order.refunds.push({ id: crypto.randomBytes(4).toString("hex"), amount, reason, mode, reference: reference || "demo", at: now, by: actor.name });
        order.statusHistory.push({ status: order.status, at: now, note: `Refund of ₹${amount} recorded (${mode === "demo" ? "demo — no money moved" : `ref ${reference}`}).` });
        break;
      }
    }
    audit(db, actor, `order.${input.op}`, "order", order.id, { before, after: { status: order.status, onHold: !!order.onHold, note, amount: input.amount } });
    return order;
  });
}

/** Public, minimal view of an order (no access token / idempotency key). */
export function toCustomerOrder(o: Order) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accessToken, idempotencyKey, notes, assignee, refunds, shipments, ...rest } = o;
  return {
    ...rest,
    shipments: (shipments ?? []).map((s) => ({ carrier: s.carrier, awb: s.awb, trackingUrl: s.trackingUrl, events: s.events })),
    refunds: (refunds ?? []).map((r) => ({ amount: r.amount, at: r.at })),
  };
}
export type CustomerOrder = ReturnType<typeof toCustomerOrder>;
