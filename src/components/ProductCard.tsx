"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductPublic } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { Price } from "./Price";
import { WishlistButton } from "./WishlistButton";
import { IconEye } from "./Icons";
import { QuickView } from "./QuickView";
import { colorsOf, isPurchasable, sizesOf } from "./VariantPicker";

export function ProductCard({
  product,
  priority = false,
  onNavigate,
}: {
  product: ProductPublic;
  priority?: boolean;
  onNavigate?: () => void;
}) {
  const [quick, setQuick] = useState(false);
  const colors = colorsOf(product);
  const sizes = sizesOf(product);
  const available = isPurchasable(product);
  const href = `/product/${product.slug}`;

  return (
    <>
    <article className="pressable group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-line">
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <Link href={href} onClick={onNavigate} tabIndex={-1} aria-hidden className="absolute inset-0">
          <ProductImage src={product.images[0]} alt="" priority={priority} />
          {product.images[1] && (
            <span className="absolute inset-0 opacity-0 transition-opacity duration-200 [@media(hover:hover)]:group-hover:opacity-100">
              <ProductImage src={product.images[1]} alt="" />
            </span>
          )}
        </Link>
        {!available && (
          <span className="absolute left-2 top-2 rounded-md bg-ink/85 px-2 py-1 text-[11px] font-semibold text-white">
            Out of stock
          </span>
        )}
        <WishlistButton
          productId={product.id}
          title={product.title}
          className="absolute right-1.5 top-1.5 h-11 w-11 rounded-full bg-white/90 text-ink shadow-sm backdrop-blur"
        />
        <button
          type="button"
          onClick={() => setQuick(true)}
          className="absolute bottom-2 right-2 flex h-8 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[11px] font-semibold text-ink shadow-sm ring-1 ring-black/5"
          aria-label={`Quick view: ${product.title}`}
          aria-haspopup="dialog"
        >
          <IconEye size={15} /> Quick View
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">{product.brand}</p>
        <h3 className="line-clamp-2 text-[13px] leading-snug font-medium">
          <Link href={href} onClick={onNavigate} className="hover:underline">
            {product.title}
          </Link>
        </h3>
        <Price price={product.price} mrp={product.mrp} size="sm" />
        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <span className="flex -space-x-1" aria-hidden>
            {colors.slice(0, 4).map((c) => (
              <span key={c.color} className="h-3.5 w-3.5 rounded-full border border-white ring-1 ring-black/10" style={{ background: `#${c.hex}` }} />
            ))}
          </span>
          <span className="truncate text-[11px] text-ink-soft">
            {colors.length > 1 ? `${colors.length} ${product.category === "beauty" ? "shades" : "colours"}` : colors[0]?.color}
            {sizes.length > 1 ? ` · ${sizes[0]}–${sizes[sizes.length - 1]}` : ""}
          </span>
        </div>
      </div>
    </article>
    <QuickView product={product} open={quick} onClose={() => setQuick(false)} />
    </>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
  onNavigate,
}: {
  products: ProductPublic[];
  priorityCount?: number;
  onNavigate?: () => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} priority={i < priorityCount} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

export function ProductRail({ products }: { products: ProductPublic[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
      {products.map((p) => (
        <li key={p.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
