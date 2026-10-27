"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductPublic } from "@/lib/types";
import { imageForColor } from "@/lib/art";
import { Sheet } from "./Sheet";
import { ProductImage } from "./ProductImage";
import { Price } from "./Price";
import { VariantPicker, addSelectionToBag, isPurchasable, useVariantSelection } from "./VariantPicker";

function QuickViewBody({ product, onDone }: { product: ProductPublic; onDone: () => void }) {
  const sel = useVariantSelection(product);
  const [error, setError] = useState<string | null>(null);
  const available = isPurchasable(product);
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
          <ProductImage src={imageForColor(product.images[0], sel.hex)} alt={`${product.title} in ${sel.color}`} sizes="112px" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs uppercase tracking-wide text-ink-soft">{product.brand}</p>
          <p className="font-semibold leading-snug">{product.title}</p>
          <Price price={product.price} mrp={product.mrp} />
          <p className="text-xs text-ink-soft">Price includes GST.</p>
        </div>
      </div>
      <p className="text-sm text-ink-soft">{product.description}</p>
      <ul className="grid grid-cols-2 gap-2 text-xs">
        {product.fit && <li className="rounded-lg bg-paper px-2 py-1.5"><b>Fit:</b> {product.fit}</li>}
        {product.material && <li className="rounded-lg bg-paper px-2 py-1.5"><b>Material:</b> {product.material}</li>}
        {product.beauty && <li className="rounded-lg bg-paper px-2 py-1.5"><b>Quantity:</b> {product.beauty.quantity}</li>}
        <li className="rounded-lg bg-paper px-2 py-1.5">
          <b>Returns:</b> {product.returnPolicy.type === "non-returnable" ? "Not returnable" : `${product.returnPolicy.days}-day ${product.returnPolicy.type === "exchange-only" ? "exchange" : "return"}`}
        </li>
      </ul>
      {available ? (
        <VariantPicker product={product} sel={sel} error={error} compact />
      ) : (
        <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium">Currently out of stock in all options.</p>
      )}
      <div className="flex gap-2 pt-1">
        <Link href={`/product/${product.slug}`} className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-leaf font-semibold text-leaf" onClick={onDone}>
          Full details
        </Link>
        <button
          type="button"
          disabled={!available}
          onClick={(e) => {
            const r = addSelectionToBag(product, sel, e.currentTarget);
            if (r.ok) onDone();
            else setError(r.error ?? null);
          }}
          className="h-12 flex-1 rounded-xl bg-leaf font-semibold text-white disabled:bg-neutral-300 disabled:text-neutral-600"
        >
          {available ? "Add to Bag" : "Out of stock"}
        </button>
      </div>
    </div>
  );
}

export function QuickView({ product, open, onClose }: { product: ProductPublic; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Quick View">
      <QuickViewBody product={product} onDone={onClose} />
    </Sheet>
  );
}
