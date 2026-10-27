import Link from "next/link";
import type { ProductPublic } from "@/lib/types";
import type { Look } from "@/data/catalog";
import { imageForColor } from "@/lib/art";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { VIBES } from "@/lib/constants";

export function resolveLook(look: Look, products: ProductPublic[]) {
  return look.items
    .map((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) return null;
      const v = p.variants.find((x) => x.color === it.color) ?? p.variants[0];
      return { product: p, color: v.color, hex: v.colorHex };
    })
    .filter((x): x is { product: ProductPublic; color: string; hex: string } => !!x);
}

export function LookCard({ look, products }: { look: Look; products: ProductPublic[] }) {
  const items = resolveLook(look, products);
  const total = items.reduce((s, i) => s + i.product.price, 0);
  return (
    <Link href={`/look/${look.id}`} className="pressable block overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-line">
      <div className="grid grid-cols-2 gap-px bg-line">
        {items.slice(0, 4).map((i) => (
          <div key={i.product.id} className="relative aspect-square bg-neutral-100">
            <ProductImage src={imageForColor(i.product.images[0], i.hex)} alt="" sizes="(min-width:768px) 15vw, 30vw" />
          </div>
        ))}
      </div>
      <div className="space-y-0.5 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-ink">{VIBES.find((v) => v.id === look.vibe)?.name}</p>
        <p className="font-semibold leading-snug">{look.name}</p>
        <p className="text-xs text-ink-soft">
          {items.length} pieces · {formatPrice(total)} together
        </p>
      </div>
    </Link>
  );
}
