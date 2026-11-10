// A seller's fulfilment of their part of an order, updated by hand from the seller panel
// (accept → packed → shipped with courier + AWB → tracking updates → delivered).
// Pure: works on the order object passed in; the server wraps it in a write lock.

import type { Order, OrderStatus, Shipment, VendorPart, VendorPartStatus } from "./types.ts";

export type VendorOp = "accept" | "pack" | "ship" | "tracking" | "deliver" | "issue";

export interface VendorOpInput {
  carrier?: string;
  awb?: string;
  trackingUrl?: string;
  /** Short tracking status for "tracking", e.g. "In transit". */
  update?: string;
  note?: string;
}

export const TRACKING_UPDATES = ["In transit", "Reached destination city", "Out for delivery", "Delivery attempted", "Delayed by courier"] as const;

export const PART_LABEL: Record<VendorPartStatus, string> = {
  new: "New — accept it",
  accepted: "Accepted — pack it",
  packed: "Packed — ready to ship",
  shipped: "Shipped",
  delivered: "Delivered",
  cancel_requested: "Cancellation asked",
};

const RANK: Record<VendorPartStatus, number> = { new: 0, cancel_requested: 0, accepted: 1, packed: 2, shipped: 3, delivered: 4 };

export class FulfilmentError extends Error {}

/** Can this seller act on the order at all? */
export function orderOpenForVendor(o: Order): string | null {
  if (o.status === "payment_pending" || o.status === "payment_failed") return "This order isn’t paid yet.";
  if (o.status === "cancelled") return "This order was cancelled.";
  if (o.onHold) return "Krip has put this order on hold. Please wait for Krip.";
  return null;
}

export function allowedVendorOps(o: Order, part: VendorPart): VendorOp[] {
  if (orderOpenForVendor(o)) return [];
  switch (part.status) {
    case "new": return ["accept", "issue"];
    case "accepted": return ["pack", "issue"];
    case "packed": return ["ship", "issue"];
    case "shipped": return ["tracking", "deliver"];
    default: return [];
  }
}

/** Applies one seller update. Returns a short description for the audit log. */
export function applyVendorOp(o: Order, vendorId: string, op: VendorOp, input: VendorOpInput, by: string, now = new Date()): string {
  const part = o.vendorParts?.find((p) => p.vendorId === vendorId);
  if (!part) throw new FulfilmentError("This order has none of your items.");
  const closed = orderOpenForVendor(o);
  if (closed) throw new FulfilmentError(closed);
  if (!allowedVendorOps(o, part).includes(op)) throw new FulfilmentError(`You can’t do that while this order is “${PART_LABEL[part.status]}”.`);
  const at = now.toISOString();
  const note = input.note?.trim().slice(0, 300) || undefined;
  const step = (status: VendorPartStatus, n?: string) => {
    part.status = status;
    part.history.push({ status, at, note: n });
  };
  let out = op as string;
  switch (op) {
    case "accept": step("accepted", note); break;
    case "pack": step("packed", note); break;
    case "ship": {
      const carrier = input.carrier?.trim().slice(0, 60) ?? "";
      const awb = input.awb?.trim().slice(0, 40) ?? "";
      if (carrier.length < 2) throw new FulfilmentError("Enter the courier name.");
      if (!/^[A-Za-z0-9-]{4,40}$/.test(awb)) throw new FulfilmentError("Enter the AWB / tracking number (letters, digits, dashes).");
      let trackingUrl: string | null = null;
      if (input.trackingUrl?.trim()) {
        try {
          const u = new URL(input.trackingUrl.trim());
          if (u.protocol !== "https:") throw new Error();
          trackingUrl = u.toString();
        } catch {
          throw new FulfilmentError("Tracking link must be a full https:// address, or leave it blank.");
        }
      }
      const id = `v${globalThis.crypto.randomUUID().slice(0, 8)}`;
      const s: Shipment = { id, carrier, awb, trackingUrl, createdAt: at, createdBy: by, events: [{ at, status: "Shipped", note }], vendorId };
      o.shipments ??= [];
      o.shipments.push(s);
      part.shipmentId = id;
      step("shipped", `${carrier}, AWB ${awb}`);
      out = `ship ${carrier} ${awb}`;
      break;
    }
    case "tracking": {
      const update = input.update?.trim().slice(0, 60) ?? "";
      if (!update && !note) throw new FulfilmentError("Choose an update or write one.");
      o.shipments?.find((s) => s.id === part.shipmentId)?.events.push({ at, status: update || "Update", note });
      part.history.push({ status: "tracking", at, note: [update, note].filter(Boolean).join(" — ") });
      break;
    }
    case "deliver":
      o.shipments?.find((s) => s.id === part.shipmentId)?.events.push({ at, status: "Delivered", note });
      step("delivered", note);
      break;
    case "issue":
      if (!note || note.length < 5) throw new FulfilmentError("Tell Krip why you can’t ship this order (at least 5 characters).");
      step("cancel_requested", note);
      o.notes ??= [];
      o.notes.push({ at, by, text: `Seller can’t fulfil their items: ${note}` });
      break;
  }
  syncOrderStatus(o, now);
  return out;
}

/**
 * When every item in the order is a seller's, the order's own status follows the sellers' progress
 * (the slowest seller decides). Orders with Krip's own items are moved by Krip staff as usual.
 */
export function syncOrderStatus(o: Order, now = new Date()) {
  if (!o.vendorParts?.length || o.items.some((i) => !i.vendorId) || o.onHold) return;
  if (!["placed", "confirmed", "packed", "shipped"].includes(o.status)) return;
  const min = Math.min(...o.vendorParts.map((p) => RANK[p.status]));
  const target: OrderStatus | null = min >= 4 ? "delivered" : min >= 3 ? "shipped" : min >= 2 ? "packed" : min >= 1 ? "confirmed" : null;
  const order: OrderStatus[] = ["placed", "confirmed", "packed", "shipped", "delivered"];
  if (target && order.indexOf(target) > order.indexOf(o.status)) {
    o.status = target;
    o.statusHistory.push({ status: target, at: now.toISOString(), note: o.vendorParts.length > 1 ? "Updated by the sellers." : "Updated by the seller." });
  }
}

/** Dispatch deadline state for the seller's order list. */
export function dispatchState(part: VendorPart, now = Date.now()): "late" | "due_today" | "ok" | null {
  if (RANK[part.status] >= 3) return null;
  const t = Date.parse(part.dispatchBy);
  if (t < now) return "late";
  if (t - now < 24 * 3600_000) return "due_today";
  return "ok";
}
