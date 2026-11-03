"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ProductPublic } from "@/lib/types";
import type { Look } from "@/data/catalog";
import { imageForColor } from "@/lib/art";
import { formatPrice } from "@/lib/format";
import { toast, useStore } from "@/lib/store";
import { VIBES } from "@/lib/constants";
import { ProductImage } from "./ProductImage";
import { isPurchasable, sizesOf, useVariantSelection, type Selection } from "./VariantPicker";

function LookItem({
  product,
  color,
  checked,
  onCheck,
  register,
  highlight,
  showErrors,
}: {
  product: ProductPublic;
  color?: string;
  checked: boolean;
  onCheck: (v: boolean) => void;
  register: (s: Selection) => void;
  highlight: boolean;
  showErrors: boolean;
}) {
  const sel = useVariantSelection(product, color);
  register(sel);
  const available = isPurchasable(product);
  const sizes = sizesOf(product);
  const sizeStock = (s: string) => product.variants.find((v) => v.color === sel.color && v.size === s)?.stock ?? 0;
  return (
    <li className={`flex gap-3 rounded-2xl bg-white p-2.5 ring-1 ${highlight ? "ring-sun ring-2" : "ring-line"}`}>
      <label className="flex shrink-0 items-start pt-1">
        <input
          type="checkbox"
          checked={checked && available}
          disabled={!available}
          onChange={(e) => onCheck(e.target.checked)}
          className="h-5 w-5 accent-[#166534]"
          aria-label={`Include ${product.title}`}
        />
      </label>
      <Link href={`/product/${product.slug}`} className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-white">
        <ProductImage src={imageForColor(product.images[0], sel.hex)} alt={product.title} sizes="80px" />
      </Link>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">
          {product.title} {highlight && <span className="text-xs text-ink-soft">(this item)</span>}
        </Link>
        <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
        {!available ? (
          <p className="text-xs font-semibold text-danger">Out of stock</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {sel.colors.length > 1 && (
              <select
                aria-label={`${product.category === "beauty" ? "Shade" : "Colour"} for ${product.title}`}
                value={sel.color}
                onChange={(e) => sel.setColor(e.target.value)}
                className="h-10 max-w-[150px] rounded-lg border border-line bg-white px-2 text-xs"
              >
                {sel.colors.map((c) => <option key={c.color} value={c.color}>{c.color}{c.inStock ? "" : " (sold out)"}</option>)}
              </select>
            )}
            {sizes.length > 1 && (
              <select
                aria-label={`Size for ${product.title}`}
                value={sel.size ?? ""}
                onChange={(e) => sel.setSize(e.target.value || null)}
                className={`h-10 rounded-lg border bg-white px-2 text-xs ${showErrors && checked && !sel.size ? "border-danger" : "border-line"}`}
              >
                <option value="">Size</option>
                {sizes.map((s) => <option key={s} value={s} disabled={sizeStock(s) <= 0}>{s}{sizeStock(s) <= 0 ? " (sold out)" : ""}</option>)}
              </select>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function LookBuilder({ look, products, highlightId, standalone = false }: { look: Look; products: ProductPublic[]; highlightId?: string; standalone?: boolean }) {
  const items = look.items
    .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) }))
    .filter((i): i is typeof i & { product: ProductPublic } => !!i.product);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((i) => [i.productId, isPurchasable(i.product)])));
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const selections = useRef<Record<string, Selection>>({}).current;
  const addToCart = useStore((s) => s.addToCart);

  const chosen = items.filter((i) => checked[i.productId] && isPurchasable(i.product));
  const total = chosen.reduce((s, i) => s + i.product.price, 0);

  const addAll = () => {
    setAttempted(true);
    const missing: string[] = [];
    for (const i of chosen) {
      const s = selections[i.productId];
      if (!s || (s.needsSize && !s.size) || !s.variant || s.variant.stock <= 0) missing.push(i.product.title);
    }
    if (missing.length) {
      setError(`Choose an in-stock size/option for: ${missing.join(", ")}`);
      return;
    }
    setError(null);
    for (const i of chosen) {
      const s = selections[i.productId];
      const v = s.variant!;
      addToCart({ sku: v.sku, productId: i.product.id, slug: i.product.slug, title: i.product.title, color: v.color, size: v.size, image: imageForColor(i.product.images[0], v.colorHex), price: i.product.price });
    }
    toast({ message: `Added ${chosen.length} piece${chosen.length === 1 ? "" : "s"} to your bag`, action: { label: "View bag", href: "/cart" } });
  };

  const Heading = standalone ? "h1" : "h2";
  return (
    <section aria-labelledby={`look-${look.id}`} className="px-4 pt-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">Complete the Look · {VIBES.find((v) => v.id === look.vibe)?.name}</p>
      <Heading id={`look-${look.id}`} className="text-lg font-semibold">{look.name}</Heading>
      <p className="mb-3 text-sm text-ink-soft">{look.line}</p>
      <ul className="grid gap-2 md:grid-cols-2">
        {items.map((i) => (
          <LookItem
            key={i.productId}
            product={i.product}
            color={i.color}
            highlight={i.productId === highlightId}
            showErrors={attempted}
            checked={!!checked[i.productId]}
            onCheck={(v) => setChecked((c) => ({ ...c, [i.productId]: v }))}
            register={(s) => (selections[i.productId] = s)}
          />
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sun-soft p-3 ring-1 ring-sun">
        <div>
          <p className="text-xs text-ink-soft">{chosen.length} selected · individual prices added up</p>
          <p className="text-lg font-semibold">{formatPrice(total)}</p>
        </div>
        <button type="button" onClick={addAll} disabled={!chosen.length} className="h-12 rounded-xl bg-leaf px-5 font-semibold text-white disabled:bg-neutral-300">
          Add selected to bag
        </button>
        {error && <p role="alert" className="w-full text-sm font-medium text-danger">{error}</p>}
      </div>
    </section>
  );
}
