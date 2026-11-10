import type { Quote } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function PriceSummary({ quote, showCodLine = true }: { quote: Quote; showCodLine?: boolean }) {
  const mrpSavings = quote.lines.filter((l) => l.ok && l.mrp && l.mrp > l.unitPrice).reduce((s, l) => s + (l.mrp! - l.unitPrice) * l.qty, 0);
  return (
    <dl className="space-y-2 text-sm">
      {mrpSavings > 0 && (
        <>
          <div className="flex justify-between text-ink-soft">
            <dt>Total MRP</dt>
            <dd>{formatPrice(quote.subtotal + mrpSavings)}</dd>
          </div>
          <div className="flex justify-between text-leaf">
            <dt>Discount on MRP</dt>
            <dd>−{formatPrice(mrpSavings)}</dd>
          </div>
        </>
      )}
      <div className="flex justify-between">
        <dt>Items ({quote.itemCount})</dt>
        <dd>{formatPrice(quote.subtotal)}</dd>
      </div>
      {quote.discount > 0 && (
        <div className="flex justify-between text-leaf">
          <dt>{quote.festivalOffer ?? `Discount${quote.couponCode ? ` (${quote.couponCode})` : ""}`}</dt>
          <dd>−{formatPrice(quote.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>Delivery</dt>
        <dd>{quote.delivery === 0 && quote.subtotal > 0 ? "Free" : formatPrice(quote.delivery)}</dd>
      </div>
      {(quote.deliveryParts?.length ?? 0) > 1 && (
        <ul className="-mt-1 space-y-0.5 pl-3 text-xs text-ink-soft">
          {quote.deliveryParts.map((d) => (
            <li key={d.vendorId ?? "krip"} className="flex justify-between"><span>Shipped by {d.name}</span><span>{d.amount ? formatPrice(d.amount) : "Free"}</span></li>
          ))}
        </ul>
      )}
      {showCodLine && quote.codFee > 0 && (
        <div className="flex justify-between">
          <dt>Cash on Delivery fee</dt>
          <dd>{formatPrice(quote.codFee)}</dd>
        </div>
      )}
      <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
        <dt>Total payable</dt>
        <dd>{formatPrice(quote.total)}</dd>
      </div>
      {mrpSavings + quote.discount > 0 && (
        <p className="flex items-center gap-2 rounded-lg bg-leaf-soft px-3 py-2 text-sm font-semibold text-leaf">
          <span aria-hidden>🎉</span> Yay! You save {formatPrice(mrpSavings + quote.discount)}{mrpSavings > 0 ? " on MRP" : ""}{quote.discount > 0 && mrpSavings > 0 ? " and codes" : ""}
        </p>
      )}
      <p className="text-xs text-ink-soft">Prices include GST.</p>
    </dl>
  );
}
