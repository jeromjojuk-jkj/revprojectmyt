import type { Quote } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function PriceSummary({ quote, showCodLine = true }: { quote: Quote; showCodLine?: boolean }) {
  const mrpSavings = quote.lines.filter((l) => l.ok && l.mrp && l.mrp > l.unitPrice).reduce((s, l) => s + (l.mrp! - l.unitPrice) * l.qty, 0);
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>Items ({quote.itemCount})</dt>
        <dd>{formatPrice(quote.subtotal)}</dd>
      </div>
      {quote.discount > 0 && (
        <div className="flex justify-between text-leaf">
          <dt>Discount {quote.couponCode ? `(${quote.couponCode})` : ""}</dt>
          <dd>−{formatPrice(quote.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>Delivery</dt>
        <dd>{quote.delivery === 0 && quote.subtotal > 0 ? "Free" : formatPrice(quote.delivery)}</dd>
      </div>
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
      <p className="text-xs text-ink-soft">
        Prices include GST.{mrpSavings > 0 ? ` You pay ${formatPrice(mrpSavings)} less than the listed MRP.` : ""}
      </p>
    </dl>
  );
}
