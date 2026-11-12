import "server-only";
import type { DB } from "./db";
import { shippingOf } from "../vendorPlans";
import type { VendorShippingRule } from "../pricing";

export { vendorLedger, type VendorSale, type VendorLedger, type WalletEntry } from "../vendorWallet";

/** Delivery charges of approved sellers, for checkout. */
export function vendorShippingRules(db: DB): Record<string, VendorShippingRule> {
  const out: Record<string, VendorShippingRule> = {};
  for (const v of db.vendors) {
    if (v.status !== "approved") continue;
    const s = shippingOf(v);
    out[v.id] = { name: v.businessName, fee: s.fee, freeAbove: s.freeAbove };
  }
  return out;
}
