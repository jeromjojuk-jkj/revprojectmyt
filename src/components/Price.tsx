import { discountPct, formatPrice } from "@/lib/format";

export function Price({ price, mrp, size = "md" }: { price: number; mrp: number | null; size?: "sm" | "md" | "lg" }) {
  const off = discountPct(price, mrp);
  const big = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-sm";
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5">
      <span className={`${big} font-semibold text-ink`}>{formatPrice(price)}</span>
      {off !== null && mrp && (
        <>
          <span className="text-xs text-ink-soft">
            MRP <s>{formatPrice(mrp)}</s>
          </span>
          <span className="text-xs font-semibold text-leaf">{off}% off</span>
        </>
      )}
    </div>
  );
}
