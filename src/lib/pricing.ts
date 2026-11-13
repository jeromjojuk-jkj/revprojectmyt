import type { CouponUsage, VendorShipping, PaymentMethod, ProductPublic, Quote, QuoteLine, Settings } from "./types.ts";
import { evaluateCoupon } from "./coupons.ts";
import { estimateDelivery } from "./pincode.ts";
import { activeFestivalOffer, festivalDiscount } from "./festivalOffers.ts";

export const MAX_QTY_PER_LINE = 5;

/** What checkout needs to know about a seller's delivery charge. */
export type VendorShippingRule = Pick<VendorShipping, "fee" | "freeAbove"> & { name: string };

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
  ctx: { now?: Date; couponUsage?: CouponUsage; vendorShipping?: Record<string, VendorShippingRule> } = {},
): Quote {
  const vendorOf = new Map(products.map((p) => [p.id, p.vendorId ?? null]));
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
        title: "Unavailable item", color: "", option: null, size: null, image: "", unitPrice: 0, mrp: null, available: 0, lineTotal: 0,
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
      option: new Set(product.variants.map((x) => x.color)).size > 1 ? v.color : null,
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
  // Coupons and festival offers are Krip's own promotions: they apply to Krip's items only, never to sellers' items.
  const kripLines = okLines.filter((l) => !vendorOf.get(l.productId!));
  const kripSubtotal = kripLines.reduce((s, l) => s + l.lineTotal, 0);
  const itemCount = okLines.reduce((s, l) => s + l.qty, 0);

  let discount = 0;
  let couponCode: string | null = null;
  let couponMessage: string | null = null;
  const code = input.couponCode?.trim().toUpperCase();
  if (code) {
    const c = settings.coupons.find((x) => x.code.toUpperCase() === code);
    if (!c) couponMessage = "This code isn’t valid.";
    else if (!kripLines.length) couponMessage = "Krip codes apply to items sold by Krip, not to other sellers’ items.";
    else {
      const category = new Map(products.map((p) => [p.id, p.category]));
      const r = evaluateCoupon(c, kripLines.map((l) => ({ category: category.get(l.productId!)!, lineTotal: l.lineTotal })), ctx.now ?? new Date(), ctx.couponUsage);
      couponMessage = r.message;
      if (r.ok) {
        discount = r.discount;
        couponCode = c.code.toUpperCase();
      }
    }
  }

  // Festival offer applies by itself; it doesn't stack with a coupon — the shopper gets whichever saves more.
  let festivalOffer: string | null = null;
  const fest = activeFestivalOffer(settings.festivalOffers, ctx.now ?? new Date());
  if (fest) {
    const fd = festivalDiscount(fest, kripSubtotal);
    if (fd > discount) {
      if (couponCode) couponMessage = `The ${fest.name} offer saves you more, so it’s applied instead of ${couponCode}.`;
      discount = fd;
      couponCode = null;
      festivalOffer = `${fest.name} offer (${fest.percentOff}% off)`;
    } else if (fd > 0 && couponCode) {
      couponMessage = `${couponMessage ?? ""} It saves more than the ${fest.name} offer, so it’s used instead.`.trim();
    }
  }

  const afterDiscount = subtotal - discount;
  // Krip ships its own items; each seller ships theirs and sets their own delivery charge.
  const deliveryParts: Quote["deliveryParts"] = [];
  if (kripSubtotal > 0) {
    const free = settings.freeDeliveryAbove !== null && kripSubtotal - discount >= settings.freeDeliveryAbove;
    deliveryParts.push({ vendorId: null, name: "Krip", amount: free ? 0 : settings.deliveryFee });
  }
  const byVendor = new Map<string, number>();
  for (const l of okLines) {
    const vid = vendorOf.get(l.productId!);
    if (vid) byVendor.set(vid, (byVendor.get(vid) ?? 0) + l.lineTotal);
  }
  for (const [vid, sum] of byVendor) {
    const rule = ctx.vendorShipping?.[vid];
    const fee = rule ? (rule.freeAbove !== null && sum >= rule.freeAbove ? 0 : rule.fee) : 0;
    deliveryParts.push({ vendorId: vid, name: rule?.name ?? "Seller", amount: Math.max(0, Math.round(fee)) });
  }
  const delivery = deliveryParts.reduce((s, d) => s + d.amount, 0);

  const est = input.pincode ? estimateDelivery(input.pincode, settings.delivery) : null;
  let codAvailable = true;
  let codReason: string | null = null;
  if (!est) {
    codAvailable = false;
    codReason = "Enter a valid pincode to check Cash on Delivery.";
  } else if (byVendor.size > 0) {
    codAvailable = false;
    codReason = "Cash on Delivery isn’t available for items shipped by other sellers. Please pay online.";
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
    festivalOffer,
    deliveryParts,
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
