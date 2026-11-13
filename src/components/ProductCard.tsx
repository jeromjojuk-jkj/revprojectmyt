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

/** Added to the catalogue in the last 21 days. */
function isNew(p: ProductPublic) {
  return Date.now() - Date.parse(p.createdAt) < 21 * 86_400_000;
}

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

  // Desktop: gentle 3D tilt + light glare that follows the pointer.
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
    e.currentTarget.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    e.currentTarget.style.setProperty("--gx", `${x * 100}%`);
    e.currentTarget.style.setProperty("--gy", `${y * 100}%`);
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  return (
    <>
    <article
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="card3d reveal pressable group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-line"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <span aria-hidden className="glare pointer-events-none absolute inset-0 z-[1]" />
        <Link href={href} onClick={onNavigate} tabIndex={-1} aria-hidden className="absolute inset-0">
          <ProductImage src={product.images[0]} alt="" priority={priority} className="card-img" />
          {product.images[1] && (
            <span className="absolute inset-0 opacity-0 transition-opacity duration-200 [@media(hover:hover)]:group-hover:opacity-100">
              <ProductImage src={product.images[1]} alt="" />
            </span>
          )}
        </Link>
        {available && (product.collections.includes("trending") || isNew(product)) && (
          <span className="shimmer absolute left-2 top-2 z-[2] overflow-hidden rounded-md bg-sun px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink shadow-sm">
            {isNew(product) ? "New" : "Trending"}
          </span>
        )}
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
        <Price price={product.price} mrp={product.mrp} size="md" />
        {product.returnPolicy.type !== "non-returnable" && (
          <p className="text-[11px] font-medium text-leaf">{product.returnPolicy.days}-day {product.returnPolicy.type === "exchange-only" ? "exchange" : "returns"}</p>
        )}
        {(colors.length > 1 || sizes.length > 1) && (
          <p className="mt-auto truncate pt-1 text-[11px] text-ink-soft">
            {[colors.length > 1 ? `${colors.length} ${product.category === "beauty" ? "shades" : "options"}` : "", sizes.length > 1 ? `${sizes[0]}–${sizes[sizes.length - 1]}` : ""].filter(Boolean).join(" · ")}
          </p>
        )}
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
