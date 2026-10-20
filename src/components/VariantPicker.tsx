"use client";

import { useMemo, useState } from "react";
import type { ProductPublic, Variant } from "@/lib/types";
import { compareSizes } from "@/lib/search";
import { toast, useStore } from "@/lib/store";
import { imageForColor } from "@/lib/art";
import { IconRuler } from "./Icons";

export function colorsOf(p: ProductPublic) {
  const m = new Map<string, { color: string; hex: string; inStock: boolean }>();
  for (const v of p.variants) {
    const e = m.get(v.color);
    m.set(v.color, { color: v.color, hex: v.colorHex, inStock: (e?.inStock ?? false) || v.stock > 0 });
  }
  return [...m.values()];
}

export function sizesOf(p: ProductPublic) {
  return [...new Set(p.variants.map((v) => v.size).filter((s): s is string => !!s))].sort(compareSizes);
}

export const isPurchasable = (p: ProductPublic) => p.status === "active" && p.variants.some((v) => v.stock > 0);

export function useVariantSelection(p: ProductPublic, initialColor?: string) {
  const colors = useMemo(() => colorsOf(p), [p]);
  const sizes = useMemo(() => sizesOf(p), [p]);
  const [color, setColor] = useState<string>(
    (initialColor && colors.find((c) => c.color === initialColor)?.color) ?? colors.find((c) => c.inStock)?.color ?? colors[0]?.color,
  );
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const needsSize = sizes.length > 0;
  const variant: Variant | null =
    p.variants.find((v) => v.color === color && (needsSize ? v.size === size : true)) ?? null;
  const hex = colors.find((c) => c.color === color)?.hex ?? "";
  return { colors, sizes, color, setColor, size, setSize, needsSize, variant, hex };
}

export type Selection = ReturnType<typeof useVariantSelection>;

export function addSelectionToBag(p: ProductPublic, sel: Selection): { ok: boolean; error?: string } {
  if (!isPurchasable(p)) return { ok: false, error: "This product is out of stock." };
  if (sel.needsSize && !sel.size) return { ok: false, error: "Please select a size." };
  const v = sel.variant;
  if (!v) return { ok: false, error: "Please choose an option." };
  if (v.stock <= 0) return { ok: false, error: `${v.color}${v.size ? " / " + v.size : ""} is out of stock. Try another option.` };
  useStore.getState().addToCart({
    sku: v.sku,
    productId: p.id,
    slug: p.slug,
    title: p.title,
    color: v.color,
    size: v.size,
    image: imageForColor(p.images[0] ?? "", v.colorHex),
    price: p.price,
  });
  toast({
    message: `Added to bag — ${v.color}${v.size ? ", " + v.size : ""}`,
    action: { label: "View bag", href: "/cart" },
  });
  return { ok: true };
}

export function VariantPicker({
  product,
  sel,
  error,
  onSizeGuide,
  compact = false,
}: {
  product: ProductPublic;
  sel: Selection;
  error?: string | null;
  onSizeGuide?: () => void;
  compact?: boolean;
}) {
  const isBeauty = product.category === "beauty";
  const colorLabel = isBeauty ? (product.variants.length > 1 ? "Shade" : "Variant") : "Colour";
  const stockFor = (size: string) => product.variants.find((v) => v.color === sel.color && v.size === size)?.stock ?? 0;
  const colorStock = product.variants.filter((v) => v.color === sel.color).some((v) => v.stock > 0);

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm">
          <span className="font-semibold">{colorLabel}:</span> <span className="text-ink-soft">{sel.color}</span>
          {!sel.needsSize && (
            <span className={`ml-2 text-xs font-semibold ${colorStock ? "text-leaf" : "text-danger"}`}>
              {colorStock ? "In stock" : "Out of stock"}
            </span>
          )}
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={colorLabel}>
          {sel.colors.map((c) => {
            const checked = c.color === sel.color;
            return (
              <button
                key={c.color}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={`${c.color}${c.inStock ? "" : " (out of stock)"}`}
                onClick={() => sel.setColor(c.color)}
                className={`pressable relative flex h-11 min-w-11 items-center gap-2 rounded-full border-2 px-1.5 pr-3 text-xs ${
                  checked ? "border-leaf bg-leaf-soft" : "border-line bg-white"
                } ${compact ? "pr-1.5" : ""}`}
              >
                <span className="h-7 w-7 rounded-full border border-black/10" style={{ background: `#${c.hex}` }} />
                {!compact && <span className={c.inStock ? "" : "text-ink-soft line-through"}>{c.color}</span>}
                {!c.inStock && compact && (
                  <span className="absolute inset-0 m-auto h-0.5 w-8 rotate-45 bg-ink-soft" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {sel.needsSize && (
        <fieldset>
          <div className="mb-2 flex items-center justify-between">
            <legend className="text-sm">
              <span className="font-semibold">Size:</span>{" "}
              <span className="text-ink-soft">{sel.size ?? "Select a size"}</span>
            </legend>
            {onSizeGuide && product.sizeGuide && (
              <button type="button" onClick={onSizeGuide} className="flex min-h-11 items-center gap-1 text-sm font-semibold text-leaf">
                <IconRuler size={18} /> Size guide
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size" aria-describedby={error ? "variant-error" : undefined}>
            {sel.sizes.map((s) => {
              const stock = stockFor(s);
              const checked = sel.size === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-disabled={stock <= 0}
                  aria-label={`${s}${stock <= 0 ? ", out of stock" : ""}`}
                  onClick={() => sel.setSize(s)}
                  className={`pressable relative h-11 min-w-12 rounded-xl border-2 px-3 text-sm font-medium ${
                    checked
                      ? stock > 0 ? "border-leaf bg-leaf text-white" : "border-danger bg-danger-soft text-danger"
                      : stock > 0 ? "border-line bg-white" : "border-dashed border-line bg-neutral-50 text-neutral-400 line-through"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {sel.size && (
            <p className={`mt-2 text-xs font-semibold ${stockFor(sel.size) > 0 ? "text-leaf" : "text-danger"}`}>
              {stockFor(sel.size) > 0 ? "In stock" : "Out of stock in this size — try another size or colour"}
            </p>
          )}
        </fieldset>
      )}
      {error && (
        <p id="variant-error" role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
