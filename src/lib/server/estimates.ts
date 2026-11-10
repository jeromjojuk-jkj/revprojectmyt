import "server-only";
import type { Order, ProductRecord, Settings } from "../types";
import { estimateContribution } from "../pricing";
import { vendorShares } from "../vendorPlans";

/** Estimated per-unit contribution on each configured channel. ESTIMATE ONLY. */
export function productEstimates(p: ProductRecord, s: Settings) {
  return s.channelFees.map((cf) => {
    // Krip's own price is always the live selling price; a stored "Krip" channel price goes stale when the price changes.
    const price = cf.channel === "Krip" ? p.price : (p.private.channelPrices.find((c) => c.channel === cf.channel)?.price ?? null);
    if (price === null) return { channel: cf.channel, price: null, contribution: null, marginPct: null };
    const r = estimateContribution({
      sellingPrice: price,
      purchaseCost: p.private.purchaseCost,
      shippingCost: p.private.shippingCost,
      otherCost: p.private.otherCost ?? 0,
      marketplaceFeePct: cf.marketplaceFeePct,
      paymentFeePct: cf.paymentFeePct,
      fixedFee: cf.fixedFee,
      returnAllowancePct: s.returnAllowancePct,
    });
    return { channel: cf.channel, price, ...r };
  });
}

/** Estimated contribution for a Krip order (revenue incl. delivery/COD fees, minus costs). ESTIMATE ONLY. */
export function orderEstimate(o: Order, products: ProductRecord[], s: Settings) {
  const krip = s.channelFees.find((c) => c.channel === "Krip") ?? { marketplaceFeePct: 0, paymentFeePct: 0, fixedFee: 0 };
  let cost = 0;
  let shipping = 0;
  let missing = false;
  // Sellers' items: what Krip passes on to the seller counts as cost, so only the commission remains.
  for (const sh of vendorShares(o, o.commissionPerUnit ?? s.vendorCommissionPerUnit ?? 10).values()) cost += sh.payout;
  for (const it of o.items) {
    if (it.vendorId) continue;
    const p = products.find((x) => x.id === it.productId);
    if (!p) {
      missing = true;
      continue;
    }
    cost += (p.private.purchaseCost + (p.private.otherCost ?? 0)) * it.qty;
    shipping += p.private.shippingCost;
  }
  const revenue = o.total;
  const paymentFees = o.paymentMethod === "online" ? (revenue * krip.paymentFeePct) / 100 : 0;
  const kripItems = o.items.filter((i) => !i.vendorId).reduce((t, i) => t + i.unitPrice * i.qty, 0);
  const returns = (Math.max(0, kripItems - o.discount) * s.returnAllowancePct) / 100;
  return {
    revenue,
    cost,
    shipping,
    fees: Math.round(paymentFees + krip.fixedFee),
    returns: Math.round(returns),
    contribution: Math.round(revenue - cost - shipping - paymentFees - krip.fixedFee - returns),
    incomplete: missing,
  };
}
