// A seller's Krip wallet (pure; unit-tested).
//
// Online payments for sellers' items settle to Krip. Each sale's money (item price + the seller's
// delivery charge − commission, which is currently 0) is credited to the seller's wallet once the
// seller's part of the order is delivered. The seller then asks to withdraw it, and Krip sends it to
// their bank and records the reference.

import type { Order, Settings, VendorAdjustment, VendorPayout, VendorWithdrawal } from "./types.ts";
import { orderCommission, paise, vendorShares } from "./vendorPlans.ts";

export interface VendorSale {
  orderId: string;
  createdAt: string;
  status: Order["status"];
  paymentMethod: Order["paymentMethod"];
  items: { title: string; sku: string; qty: number; unitPrice: number }[];
  gross: number;
  delivery: number;
  units: number;
  commission: number;
  payout: number;
  /** credited = in the wallet (delivered); pending = paid, waiting for delivery; void = cancelled. */
  settlement: "credited" | "pending" | "void";
  creditedAt: string | null;
  shipped: boolean;
  part: NonNullable<Order["vendorParts"]>[number] | null;
}

export type WalletEntry =
  | { kind: "sale"; at: string; amount: number; orderId: string; text: string }
  | { kind: "adjustment"; at: string; amount: number; text: string; orderId: string | null }
  | { kind: "payout"; at: string; amount: number; text: string; reference: string }
  | { kind: "withdrawal"; at: string; amount: number; text: string; status: VendorWithdrawal["status"] };

export interface WalletSource {
  orders: Order[];
  vendorPayouts: VendorPayout[];
  vendorWithdrawals: VendorWithdrawal[];
  vendorAdjustments: VendorAdjustment[];
  settings: Pick<Settings, "vendorCommission">;
}

function deliveredAt(o: Order, vendorId: string): string | null {
  const part = o.vendorParts?.find((p) => p.vendorId === vendorId);
  const fromPart = part?.status === "delivered" ? part.history.findLast((h) => h.status === "delivered")?.at : undefined;
  if (fromPart) return fromPart;
  if (o.status === "delivered") return o.statusHistory.findLast((h) => h.status === "delivered")?.at ?? o.createdAt;
  return null;
}

export function vendorLedger(db: WalletSource, vendorId: string) {
  const sales: VendorSale[] = [];
  for (const o of db.orders) {
    if (o.status === "payment_pending" || o.status === "payment_failed") continue;
    const share = vendorShares(o, orderCommission(o, db.settings)).get(vendorId);
    if (!share) continue;
    const at = o.status === "cancelled" ? null : deliveredAt(o, vendorId);
    sales.push({
      orderId: o.id, createdAt: o.createdAt, status: o.status, paymentMethod: o.paymentMethod,
      items: o.items.filter((i) => i.vendorId === vendorId).map((i) => ({ title: i.title, sku: i.sku, qty: i.qty, unitPrice: i.unitPrice })),
      gross: share.items, delivery: share.delivery, units: share.units, commission: share.commission, payout: share.payout,
      settlement: o.status === "cancelled" ? "void" : at ? "credited" : "pending",
      creditedAt: at,
      shipped: (o.shipments ?? []).some((s) => s.vendorId === vendorId),
      part: o.vendorParts?.find((p) => p.vendorId === vendorId) ?? null,
    });
  }
  sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const live = sales.filter((s) => s.settlement !== "void");
  const byDate = <T extends { at: string }>(a: T, b: T) => b.at.localeCompare(a.at);
  const payouts = db.vendorPayouts.filter((p) => p.vendorId === vendorId).sort(byDate);
  const withdrawals = db.vendorWithdrawals.filter((w) => w.vendorId === vendorId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const adjustments = db.vendorAdjustments.filter((a) => a.vendorId === vendorId).sort(byDate);

  const sum = (xs: number[]) => paise(xs.reduce((s, x) => s + x, 0));
  const credited = sum(live.filter((s) => s.settlement === "credited").map((s) => s.payout));
  const adjusted = sum(adjustments.map((a) => a.amount));
  const paidOut = sum(payouts.map((p) => p.amount));
  const requested = sum(withdrawals.filter((w) => w.status === "requested").map((w) => w.amount));
  // Money in the wallet = credited sales ± adjustments − money already sent. A withdrawal waiting for Krip is held.
  const balance = paise(credited + adjusted - paidOut);
  const available = paise(Math.max(0, balance - requested));

  const history: WalletEntry[] = [
    ...live.filter((s) => s.creditedAt).map((s): WalletEntry => ({ kind: "sale", at: s.creditedAt!, amount: s.payout, orderId: s.orderId, text: `Order ${s.orderId} delivered` })),
    ...adjustments.map((a): WalletEntry => ({ kind: "adjustment", at: a.at, amount: a.amount, text: a.reason, orderId: a.orderId })),
    ...payouts.map((p): WalletEntry => ({ kind: "payout", at: p.at, amount: -p.amount, text: p.note || "Sent to your bank", reference: p.reference })),
    ...withdrawals.filter((w) => w.status !== "paid").map((w): WalletEntry => ({ kind: "withdrawal", at: w.requestedAt, amount: w.amount, text: w.status === "requested" ? "Withdrawal requested" : `Withdrawal not processed: ${w.note}`, status: w.status })),
  ].sort(byDate);

  return {
    sales,
    payouts,
    withdrawals,
    adjustments,
    history,
    openWithdrawal: withdrawals.find((w) => w.status === "requested") ?? null,
    totals: {
      gross: sum(live.map((x) => x.gross)),
      delivery: sum(live.map((x) => x.delivery)),
      units: live.reduce((s, x) => s + x.units, 0),
      commission: sum(live.map((x) => x.commission)),
      earnings: sum(live.map((x) => x.payout)),
      /** Paid by customers, credited when delivered. */
      pending: sum(live.filter((s) => s.settlement === "pending").map((s) => s.payout)),
      credited,
      adjusted,
      paidOut,
      /** Waiting for Krip to send. */
      requested,
      /** In the wallet (includes any amount requested for withdrawal). */
      balance,
      /** Can be withdrawn now. */
      available,
    },
  };
}

export type VendorLedger = ReturnType<typeof vendorLedger>;
