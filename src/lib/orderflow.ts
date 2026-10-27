import type { Order, OrderStatus } from "./types.ts";

// Order, payment and fulfilment are tracked as separate lifecycles. The
// stored `status` drives the order lifecycle; payment and fulfilment states
// are derived from it plus payment events, refunds and shipments, so they
// can't drift apart.

export type PaymentState = "pending" | "failed" | "paid" | "partially_refunded" | "refunded" | "cod_due" | "cod_collected" | "void";
export type FulfilmentState = "unfulfilled" | "packed" | "shipped" | "delivered" | "cancelled" | "not_started";

export const BOOKED = (s: OrderStatus) => s !== "payment_pending" && s !== "payment_failed";

export function refundedAmount(o: Order) {
  return (o.refunds ?? []).reduce((s, r) => s + r.amount, 0);
}

/** Money Krip actually holds for this order (authoritative events only). */
export function paidAmount(o: Order) {
  if (o.paymentMethod === "cod") return o.codCollectedAt ? o.total : 0;
  return o.paymentEvents.some((e) => e.type === "payment.succeeded" && e.amount === o.total) ? o.total : 0;
}

export function paymentStateOf(o: Order): PaymentState {
  const paid = paidAmount(o);
  const refunded = refundedAmount(o);
  if (paid > 0 && refunded >= paid) return "refunded";
  if (paid > 0 && refunded > 0) return "partially_refunded";
  if (o.paymentMethod === "cod") {
    if (o.codCollectedAt) return "cod_collected";
    return o.status === "cancelled" ? "void" : "cod_due";
  }
  if (paid > 0) return "paid";
  if (o.status === "payment_failed") return "failed";
  if (o.status === "cancelled") return "void";
  return "pending";
}

export function fulfilmentStateOf(o: Order): FulfilmentState {
  switch (o.status) {
    case "payment_pending":
    case "payment_failed":
      return "not_started";
    case "placed":
    case "confirmed":
      return "unfulfilled";
    case "packed":
      return "packed";
    case "shipped":
      return "shipped";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
  }
}

export type OrderOp = "confirm" | "pack" | "ship" | "deliver" | "cancel" | "hold" | "release" | "cod_collected" | "refund" | "note" | "tracking";

/** Which admin actions are valid for an order right now. */
export function allowedOps(o: Order): OrderOp[] {
  const ops: OrderOp[] = ["note"];
  const held = !!o.onHold;
  if (!held) {
    if (o.status === "placed") ops.push("confirm");
    if (o.status === "confirmed") ops.push("pack");
    if (o.status === "packed") ops.push("ship");
    if (o.status === "shipped") ops.push("deliver", "tracking");
  }
  if (["placed", "confirmed", "packed"].includes(o.status)) ops.push(held ? "release" : "hold");
  if (["payment_pending", "placed", "confirmed", "packed"].includes(o.status)) ops.push("cancel");
  if (o.paymentMethod === "cod" && o.status === "delivered" && !o.codCollectedAt) ops.push("cod_collected");
  if (paidAmount(o) - refundedAmount(o) > 0) ops.push("refund");
  return ops;
}

export const PAYMENT_LABEL: Record<PaymentState, string> = {
  pending: "Payment pending",
  failed: "Payment failed",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  cod_due: "COD due",
  cod_collected: "COD collected",
  void: "Void",
};

export const FULFILMENT_LABEL: Record<FulfilmentState, string> = {
  not_started: "—",
  unfulfilled: "Unfulfilled",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  payment_pending: "Awaiting payment",
  payment_failed: "Payment failed",
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
