import "server-only";
import crypto from "node:crypto";
import type { MovementReason } from "../types";
import type { DB } from "./db";

const MAX_MOVEMENTS = 50_000;

/**
 * The only way stock changes. Records a ledger entry with the resulting
 * balance, so every unit can be traced. Call inside withDb.
 */
export function moveStock(db: DB, sku: string, delta: number, reason: MovementReason, ref: string, by: string) {
  for (const p of db.products) {
    const v = p.variants.find((x) => x.sku === sku);
    if (!v) continue;
    if (!Number.isInteger(delta)) throw new Error("Stock changes must be whole units.");
    if (v.stock + delta < 0) throw new Error(`Stock for ${sku} can’t go below zero.`);
    v.stock += delta;
    if (delta !== 0) {
      db.movements.push({ id: crypto.randomBytes(6).toString("hex"), at: new Date().toISOString(), sku, productId: p.id, delta, balanceAfter: v.stock, reason, ref, by });
      if (db.movements.length > MAX_MOVEMENTS) db.movements.splice(0, db.movements.length - MAX_MOVEMENTS);
    }
    return v.stock;
  }
  throw new Error(`Unknown SKU ${sku}`);
}

/** Units held by unpaid online orders and units sold but not yet shipped, per SKU. */
export function commitments(db: DB) {
  const held: Record<string, number> = {};
  const allocated: Record<string, number> = {};
  for (const o of db.orders) {
    const target = o.status === "payment_pending" && o.stockHeld ? held : ["placed", "confirmed", "packed"].includes(o.status) ? allocated : null;
    if (!target) continue;
    for (const it of o.items) target[it.sku] = (target[it.sku] ?? 0) + it.qty;
  }
  return { held, allocated };
}
