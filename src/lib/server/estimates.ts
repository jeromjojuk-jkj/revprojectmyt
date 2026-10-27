import "server-only";
import type { Order, ProductRecord, Settings } from "../types";
import { estimateContribution } from "../pricing";

/** Estimated per-unit contribution on each configured channel. ESTIMATE ONLY. */
export function productEstimates(p: ProductRecord, s: Settings) {
  return s.channelFees.map((cf) => {
    const price = p.private.channelPrices.find((c) => c.channel === cf.channel)?.price ?? (cf.channel === "Krip" ? p.price : null);
    if (price === null) return { channel: cf.channel, price: null, contribution: null, marginPct: null };
    const r = estimateContribution({
      sellingPrice: price,
      purchaseCost: p.private.purchaseCost,
      shippingCost: p.private.shippingCost,
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
  for (const it of o.items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p) {
      missing = true;
      continue;
    }
    cost += p.private.purchaseCost * it.qty;
    shipping += p.private.shippingCost;
  }
  const revenue = o.total;
  const paymentFees = o.paymentMethod === "online" ? (revenue * krip.paymentFeePct) / 100 : 0;
  const returns = ((o.subtotal - o.discount) * s.returnAllowancePct) / 100;
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
