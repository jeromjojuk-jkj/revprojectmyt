import type { CouponUsage, PaymentMethod, ProductPublic, Quote, QuoteLine, Settings } from "./types.ts";
import { evaluateCoupon } from "./coupons.ts";
import { estimateDelivery } from "./pincode.ts";

export const MAX_QTY_PER_LINE = 5;

export interface QuoteInput {
  items: { sku: string; qty: number }[];
  pincode?: string | null;
  paymentMethod?: PaymentMethod | null;
  couponCode?: string | null;
}

/** Pure price calculation used by both the cart UI (via API) and order creation. */
export function computeQuote(
  input: QuoteInput,
  products: ProductPublic[],
  settings: Settings,
  /** Units of each sku held by other pending orders. */
  held: Record<string, number> = {},
  ctx: { now?: Date; couponUsage?: CouponUsage } = {},
): Quote {
  const bySku = new Map<string, { product: ProductPublic; variantIdx: number }>();
  for (const p of products) p.variants.forEach((v, i) => bySku.set(v.sku, { product: p, variantIdx: i }));

  const merged = new Map<string, number>();
  for (const it of input.items) {
    if (!it || typeof it.sku !== "string") continue;
    const q = Math.floor(Number(it.qty));
    if (!Number.isFinite(q) || q < 1) continue;
    merged.set(it.sku, (merged.get(it.sku) ?? 0) + q);
  }

  const lines: QuoteLine[] = [];
  for (const [sku, rawQty] of merged) {
    const hit = bySku.get(sku);
    if (!hit) {
      lines.push({
        sku, qty: rawQty, ok: false, problem: "This item is no longer available.", productId: null, slug: null,
        title: "Unavailable item", color: "", size: null, image: "", unitPrice: 0, mrp: null, available: 0, lineTotal: 0,
      });
      continue;
    }
    const { product, variantIdx } = hit;
    const v = product.variants[variantIdx];
    const available = Math.max(0, v.stock - (held[sku] ?? 0));
    const qty = Math.min(rawQty, MAX_QTY_PER_LINE);
    let problem: string | null = null;
    if (product.status !== "active") problem = "This item is currently unavailable.";
    else if (available <= 0) problem = "Out of stock in this variant.";
    else if (qty > available) problem = `Only ${available} available — please reduce the quantity.`;
    else if (rawQty > MAX_QTY_PER_LINE) problem = `Maximum ${MAX_QTY_PER_LINE} per item.`;
    lines.push({
      sku,
      qty,
      ok: problem === null,
      problem,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      color: v.color,
      size: v.size,
      image: product.images[0] ?? "",
      unitPrice: product.price,
      mrp: product.mrp,
      available,
      lineTotal: product.price * qty,
    });
  }

  const okLines = lines.filter((l) => l.ok);
  const subtotal = okLines.reduce((s, l) => s + l.lineTotal, 0);
  const itemCount = okLines.reduce((s, l) => s + l.qty, 0);

  let discount = 0;
  let couponCode: string | null = null;
  let couponMessage: string | null = null;
  const code = input.couponCode?.trim().toUpperCase();
  if (code) {
    const c = settings.coupons.find((x) => x.code.toUpperCase() === code);
    if (!c) couponMessage = "This code isn’t valid.";
    else {
      const category = new Map(products.map((p) => [p.id, p.category]));
      const r = evaluateCoupon(c, okLines.map((l) => ({ category: category.get(l.productId!)!, lineTotal: l.lineTotal })), ctx.now ?? new Date(), ctx.couponUsage);
      couponMessage = r.message;
      if (r.ok) {
        discount = r.discount;
        couponCode = c.code.toUpperCase();
      }
    }
  }

  const afterDiscount = subtotal - discount;
  const delivery =
    subtotal === 0
      ? 0
      : settings.freeDeliveryAbove !== null && afterDiscount >= settings.freeDeliveryAbove
        ? 0
        : settings.deliveryFee;

  const est = input.pincode ? estimateDelivery(input.pincode, settings.delivery) : null;
  let codAvailable = true;
  let codReason: string | null = null;
  if (!est) {
    codAvailable = false;
    codReason = "Enter a valid pincode to check Cash on Delivery.";
  } else if (!est.codEligible) {
    codAvailable = false;
    codReason = "Cash on Delivery isn’t available for this pincode.";
  } else if (afterDiscount + delivery > settings.codMaxOrderValue) {
    codAvailable = false;
    codReason = `Cash on Delivery is available for orders up to ₹${settings.codMaxOrderValue}.`;
  }
  const codFee = input.paymentMethod === "cod" && codAvailable && subtotal > 0 ? settings.codFee : 0;

  return {
    lines,
    subtotal,
    delivery,
    codFee,
    discount,
    couponCode,
    couponMessage,
    total: afterDiscount + delivery + codFee,
    itemCount,
    allAvailable: lines.length > 0 && lines.every((l) => l.ok),
    codAvailable,
    codReason,
  };
}

/** Estimated contribution for a unit sold on a channel. Clearly an estimate. */
export function estimateContribution(args: {
  sellingPrice: number;
  purchaseCost: number;
  shippingCost: number;
  otherCost?: number;
  marketplaceFeePct: number;
  paymentFeePct: number;
  fixedFee: number;
  returnAllowancePct: number;
}) {
  const fees =
    (args.sellingPrice * (args.marketplaceFeePct + args.paymentFeePct)) / 100 + args.fixedFee;
  const returns = (args.sellingPrice * args.returnAllowancePct) / 100;
  const contribution = args.sellingPrice - args.purchaseCost - args.shippingCost - (args.otherCost ?? 0) - fees - returns;
  return {
    fees: Math.round(fees),
    returns: Math.round(returns),
    contribution: Math.round(contribution),
    marginPct: args.sellingPrice > 0 ? Math.round((contribution / args.sellingPrice) * 1000) / 10 : 0,
  };
}
