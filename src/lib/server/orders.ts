import "server-only";
import crypto from "node:crypto";
import type { Address, Order, OrderStatus, PaymentMethod } from "../types";
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
    phone: s(a.phone, 15).replace(/[\s-]/g, "").replace(/^\+?91/, ""),
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

function releaseStock(db: DB, order: Order) {
  if (!order.stockHeld) return;
  for (const it of order.items) {
    const p = db.products.find((x) => x.id === it.productId);
    const v = p?.variants.find((x) => x.sku === it.sku);
    if (v) v.stock += it.qty;
  }
  order.stockHeld = false;
}

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
    // Duplicate submit (double tap, retry after network error) → same order.
    const existing = db.orders.find((o) => o.idempotencyKey === input.idempotencyKey);
    if (existing) return existing;

    sweepExpired(db);
    const quote = computeQuote(
      { items: input.items, pincode: addr.value.pincode, paymentMethod: input.paymentMethod, couponCode: input.couponCode },
      db.products.map(toPublicProduct),
      db.settings,
    );
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
      v.stock -= l.qty;
    }

    const now = new Date();
    const order: Order = {
      id: `KRP-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
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
    for (const it of order.items) {
      db.products.find((x) => x.id === it.productId)!.variants.find((x) => x.sku === it.sku)!.stock -= it.qty;
    }
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

export const FULFILMENT_FLOW: OrderStatus[] = ["placed", "confirmed", "packed", "shipped", "delivered"];

export async function adminSetStatus(id: string, status: OrderStatus, note?: string) {
  return withDb((db) => {
    const order = db.orders.find((x) => x.id === id);
    if (!order) throw new OrderError("Order not found", "not_found", 404);
    if (order.status === status) return order;
    if (["payment_pending", "payment_failed"].includes(order.status) && status !== "cancelled") {
      throw new OrderError("Unpaid orders can’t move into fulfilment.", "bad_state");
    }
    if (order.status === "cancelled" || order.status === "delivered") throw new OrderError("Order is closed.", "bad_state");
    if (status === "cancelled") releaseStock(db, order);
    else if (!FULFILMENT_FLOW.includes(status)) throw new OrderError("Invalid status", "bad_state");
    setStatus(order, status, note || "Updated by Krip team.");
    return order;
  });
}

/** Public, minimal view of an order (no access token / idempotency key). */
export function toCustomerOrder(o: Order) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accessToken, idempotencyKey, ...rest } = o;
  return rest;
}
export type CustomerOrder = ReturnType<typeof toCustomerOrder>;
